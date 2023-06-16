git clone git@github.com:NethermindEth/starknet-remix-plugin.git

cd starknet-remix-plugin/plugin

pnpm install

screen -S starknet-remix-frontend -d -m pnpm run start

cd ../api

git submodule update --init;
cargo build;

screen -S rust-backend -d -m cargo run

source ../../starknet-venv/bin/activate
screen -S starknet-devnet -d -m starknet-devnet --port 0.0.0.0