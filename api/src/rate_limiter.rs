use crate::errors::{ApiError, Result};
use crate::utils::lib::timestamp;
use crate::worker::Timestamp;
use crossbeam_queue::ArrayQueue;
use crossbeam_skiplist::SkipMap;
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome};
use rocket::Request;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};

pub type Method = String;

pub type RateLimiterMap = SkipMap<IpAddr, ArrayQueue<Timestamp>>;

#[derive(Debug)]
pub struct RateLimiter {
    call_queue: Arc<RateLimiterMap>,
    last_purge: Arc<Mutex<Timestamp>>,
}

impl Default for RateLimiter {
    fn default() -> Self {
        let now = timestamp();

        Self {
            call_queue: Arc::new(SkipMap::new()),
            last_purge: Arc::new(Mutex::new(now)),
        }
    }
}

impl RateLimiter {
    pub fn new() -> Self {
        Self::default()
    }

    fn do_rate_limit(&self, ip: IpAddr) -> Result<()> {
        self.insert_timestamp(ip)?;

        Ok(())
    }

    fn update_queue(&self, key: IpAddr) -> Result<()> {
        // Clean up the queue
        self.purge()?;

        // 15 req/minute
        let result = self.call_queue.get_or_insert(key, ArrayQueue::new(15));

        let queue = result.value();

        if queue.is_empty() {
            return Ok(());
        }

        let current_time = timestamp();

        while !queue.is_empty() {
            let time = queue.pop().unwrap();

            if current_time - time <= 60 {
                // 1 minute
                queue.push(time).map_err(|_| ApiError::QueueIsFull)?;
                break;
            }
        }

        Ok(())
    }

    fn insert_timestamp(&self, key: IpAddr) -> Result<()> {
        self.update_queue(key)?;

        let current_time = timestamp();

        let result = self.call_queue.get_or_insert(key, ArrayQueue::new(15));

        let queue = result.value();

        queue
            .push(current_time)
            .map_err(|_| ApiError::QueueIsFull)?;

        Ok(())
    }

    fn purge(&self) -> Result<()> {
        let now = timestamp();

        let mut last_purge = self
            .last_purge
            .lock()
            .map_err(|_| ApiError::MutexUnlockError)?;

        if now - *last_purge > 60 * 60 {
            info!("Purging call queue in the rate limiter");

            self.call_queue.clear();

            *last_purge = now;
        }

        Ok(())
    }
}

#[derive(Debug)]
pub struct RateLimited;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RateLimited {
    type Error = ApiError;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let rate_limiter: &RateLimiter = match request.rocket().state() {
            None => {
                return Outcome::Error((
                    Status::InternalServerError,
                    ApiError::RateLimiterNotInState,
                ))
            }
            Some(x) => x,
        };

        let client_ip = match request.client_ip() {
            None => return Outcome::Error((Status::BadRequest, ApiError::FailedToGetClientIp)),
            Some(x) => x,
        };

        match rate_limiter.do_rate_limit(client_ip) {
            Ok(_) => Outcome::Success(RateLimited),
            Err(_) => Outcome::Error((Status::TooManyRequests, ApiError::TooManyRequests)),
        }
    }
}
