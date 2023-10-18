#!/bin/bash

echo "Building cairo compilers"

directories=$(ls -d */)

for dir in $directories
do
  echo "Building $dir"

  if [[ ! -f "$dir/Cargo.toml" ]] || [[ ! "$dir" =~ ^v[0-9]+\.[0-9]+\.[0-9]+/$ ]]; then
    echo "Invalid cairo version provided $dir"
    exit 1
  fi

  cd "$dir" || exit 1

  cargo build --bin starknet-compile --release
  cargo build --bin starknet-sierra-compile --release

  cd ..

  echo "Done building $dir"
done