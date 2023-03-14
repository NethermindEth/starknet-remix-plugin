use std::borrow::Cow;
use std::path::{Path, PathBuf};

use rand::{self, Rng};

pub struct Id<'a>(Cow<'a, str>);

impl Id<'_> {
    pub fn new(size: usize) -> Id<'static> {
        const BASE62: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        let mut id = String::with_capacity(size);
        let mut rng = rand::thread_rng();
        for _ in 0..size {
            id.push(BASE62[rng.gen::<usize>() % 62] as char);
        }

        Id(Cow::Owned(id))
    }

    pub fn file_path(&self, ext: &str) -> PathBuf {
        let root = concat!(env!("CARGO_MANIFEST_DIR"), "/", "upload/temp/");
        Path::new(root)
            .with_file_name(self.0.as_ref())
            .with_extension(ext)
    }

    pub fn sierra_path(&self) -> PathBuf {
        let root = concat!(env!("CARGO_MANIFEST_DIR"), "/", "sierra/temp/");
        Path::new(root)
            .with_file_name(self.0.as_ref())
            .with_extension("json")
    }

    pub fn get_id(&self) -> String {
        self.0.to_string()
    }
}
