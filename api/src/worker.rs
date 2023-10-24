use crate::handlers;
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::types::ApiError;
use crate::utils::lib::DURATION_TO_PURGE;
use crossbeam_queue::ArrayQueue;
use crossbeam_skiplist::SkipMap;
use rocket::tokio;
use rocket::tokio::sync::Mutex;
use rocket::tokio::task::JoinHandle;
use rocket::tokio::time;
use rocket::tokio::time::sleep;
use std::fmt::{Display, Formatter};
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

#[derive(Debug)]
pub enum ProcessState {
    New,
    Running,
    Completed(ApiCommandResult),
    Error(ApiError),
}

impl Display for ProcessState {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ProcessState::New => write!(f, "New"),
            ProcessState::Running => write!(f, "Running"),
            ProcessState::Completed(_) => write!(f, "Completed"),
            ProcessState::Error(e) => write!(f, "Error({:?})", e),
        }
    }
}

pub type ProcessStateMap = SkipMap<Uuid, ProcessState>;
pub type Timestamp = u64;

#[derive(Debug)]
pub struct WorkerEngine {
    pub num_workers: u32,
    pub worker_threads: Vec<JoinHandle<()>>,
    pub arc_command_queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
    pub arc_process_states: Arc<ProcessStateMap>,
    pub arc_timestamps_to_purge: Arc<ArrayQueue<(Uuid, Timestamp)>>,
    pub is_supervisor_enabled: Arc<Mutex<bool>>,
    pub supervisor_thread: Arc<Option<JoinHandle<()>>>,
}

impl WorkerEngine {
    pub fn new(num_workers: u32, queue_capacity: usize) -> Self {
        // Create a queue instance

        let queue: ArrayQueue<(Uuid, ApiCommand)> = ArrayQueue::new(queue_capacity);
        let arc_command_queue = Arc::new(queue);

        // Create a process state map instance (NOTE: how to implement purging from this map???)
        let process_states = SkipMap::new();
        let arc_process_states = Arc::new(process_states);

        // Create a collection of worker threads
        let worker_threads: Vec<JoinHandle<()>> = vec![];

        // Create a flag to enable/disable the supervisor thread
        let is_supervisor_enabled = Arc::new(Mutex::new(true));

        // Create a collection of timestamps to purge
        let timestamps_to_purge: ArrayQueue<(Uuid, Timestamp)> = ArrayQueue::new(queue_capacity);
        let arc_timestamps_to_purge = Arc::new(timestamps_to_purge);

        WorkerEngine {
            num_workers,
            arc_command_queue,
            arc_process_states,
            worker_threads,
            supervisor_thread: Arc::new(None),
            arc_timestamps_to_purge,
            is_supervisor_enabled,
        }
    }

    pub fn start(&mut self) {
        for _ in 0..self.num_workers {
            // add to collection
            let arc_clone = self.arc_command_queue.clone();
            let arc_states = self.arc_process_states.clone();
            let arc_timestamps_to_purge = self.arc_timestamps_to_purge.clone();
            self.worker_threads.push(tokio::spawn(async move {
                WorkerEngine::worker(arc_clone, arc_states, arc_timestamps_to_purge).await;
            }));
        }

        // start supervisor thread
        {
            let is_supervisor_enabled = self.is_supervisor_enabled.clone();
            let arc_process_states = self.arc_process_states.clone();
            let process_timestamps_to_purge = self.arc_timestamps_to_purge.clone();

            self.supervisor_thread = Arc::new(Some(tokio::spawn(async move {
                WorkerEngine::supervisor(
                    is_supervisor_enabled,
                    arc_process_states,
                    process_timestamps_to_purge,
                )
                .await;
            })));
        }
    }

    pub async fn enable_supervisor_thread(&mut self) {
        let is_supervisor_enabled = self.is_supervisor_enabled.clone();
        let arc_process_states = self.arc_process_states.clone();
        let process_timestamps_to_purge = self.arc_timestamps_to_purge.clone();
        let mut is_enabled = self.is_supervisor_enabled.lock().await;
        *is_enabled = true;
        self.supervisor_thread = Arc::new(Some(tokio::spawn(async move {
            WorkerEngine::supervisor(
                is_supervisor_enabled,
                arc_process_states,
                process_timestamps_to_purge,
            )
            .await;
        })));
    }

    pub async fn supervisor(
        is_supervisor_enabled: Arc<Mutex<bool>>,
        arc_process_states: Arc<ProcessStateMap>,
        process_timestamps_to_purge: Arc<ArrayQueue<(Uuid, Timestamp)>>,
    ) {
        loop {
            let is_supervisor_enabled = is_supervisor_enabled.lock().await;
            if !*is_supervisor_enabled {
                break;
            }

            let now = Self::timestamp();

            while let Some((process_id, timestamp)) = process_timestamps_to_purge.pop() {
                if timestamp < now {
                    arc_process_states.remove(&process_id);

                    info!("Process {:?} removed from process states", process_id);
                } else {
                    process_timestamps_to_purge
                        .push((process_id, timestamp))
                        .unwrap();
                    break;
                }
            }

            sleep(time::Duration::from_millis(2000)).await;
        }
    }

    pub async fn disable_supervisor_thread(&mut self) {
        let mut is_enabled = self.is_supervisor_enabled.lock().await;
        *is_enabled = false;

        if let Ok(supervisor_thread) = Arc::try_unwrap(self.supervisor_thread.clone()) {
            if let Some(join_handle) = supervisor_thread {
                let _ = join_handle.await;
            }
        }

        self.supervisor_thread = Arc::new(None);
    }

    pub fn enqueue_command(&self, command: ApiCommand) -> Result<Uuid, String> {
        let uuid = Uuid::new_v4();

        self.arc_process_states.insert(uuid, ProcessState::New);

        match self.arc_command_queue.push((uuid, command)) {
            Ok(()) => Ok(uuid),
            Err((uuid, command)) => Err(format!(
                "Error enqueueing command {:?} in process {:?}",
                command, uuid
            )),
        }
    }

    // worker function
    pub async fn worker(
        arc_command_queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
        arc_process_states: Arc<ProcessStateMap>,
        arc_timestamps_to_purge: Arc<ArrayQueue<(Uuid, Timestamp)>>,
    ) {
        info!("Starting worker thread...");
        'worker_loop: loop {
            // read process ID and command from queue
            match arc_command_queue.pop() {
                Some((process_id, command)) => {
                    debug!("Command received: {:?}", command);

                    match command {
                        ApiCommand::Shutdown => {
                            break 'worker_loop;
                        }
                        _ => {
                            // update process state
                            arc_process_states.insert(process_id, ProcessState::Running);

                            match handlers::dispatch_command(command).await {
                                Ok(result) => {
                                    arc_process_states
                                        .insert(process_id, ProcessState::Completed(result));

                                    arc_timestamps_to_purge
                                        .push((process_id, Self::timestamp() + DURATION_TO_PURGE))
                                        .unwrap();
                                }
                                Err(e) => {
                                    arc_process_states.insert(process_id, ProcessState::Error(e));

                                    arc_timestamps_to_purge
                                        .push((process_id, Self::timestamp() + DURATION_TO_PURGE))
                                        .unwrap();
                                }
                            }
                        }
                    }
                }
                None => {
                    debug!("Waiting for commands...");
                    sleep(time::Duration::from_millis(200)).await;
                }
            }
        }
        info!("Worker thread finished...");
    }

    fn timestamp() -> u64 {
        chrono::Utc::now().timestamp() as u64
    }
}
