use crate::handlers;
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::types::ApiError;
use crossbeam_queue::ArrayQueue;
use crossbeam_skiplist::SkipMap;
use rocket::tokio;
use rocket::tokio::task::JoinHandle;
use rocket::tokio::time;
use rocket::tokio::time::sleep;
use std::fmt::{Display, Formatter};
use std::sync::Arc;
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

#[derive(Debug)]
pub struct WorkerEngine {
    pub num_workers: u32,
    pub worker_threads: Vec<JoinHandle<()>>,
    pub arc_command_queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
    pub arc_process_states: Arc<SkipMap<Uuid, ProcessState>>,
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

        WorkerEngine {
            num_workers,
            arc_command_queue,
            arc_process_states,
            worker_threads,
        }
    }

    pub fn start(&mut self) {
        for _ in 0..self.num_workers {
            // add to collection
            let arc_clone = self.arc_command_queue.clone();
            let arc_states = self.arc_process_states.clone();
            self.worker_threads.push(tokio::spawn(async move {
                WorkerEngine::worker(arc_clone, arc_states).await;
            }));
        }
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
        arc_process_states: Arc<SkipMap<Uuid, ProcessState>>,
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
                                }
                                Err(e) => {
                                    arc_process_states.insert(process_id, ProcessState::Error(e));
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
}
