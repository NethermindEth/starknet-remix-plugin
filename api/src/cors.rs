use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};
use rocket::{Request, Response};
use std::env;

#[derive(Default)]

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new(
                "Access-Control-Allow-Methods",
                "POST, PATCH, GET, DELETE",
            ));
            response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        }

        // Take the Plugin App URL from the env variable, if set
        match env::var("VITE_URL") {
            Ok(v) => {
                response.set_header(Header::new("Access-Control-Allow-Origin", v));
            }
            Err(_) => {
                response.set_header(Header::new(
                    "Access-Control-Allow-Origin",
                    "https://cairo-remix-dev.nethermind.io",
                ));
            }
        }

        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}
