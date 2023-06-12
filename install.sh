sudo apt-get update
sudo  apt-get install -y curl
sudo  apt-get install -y git
sudo  apt-get install -y software-properties-common
sudo  apt-get install -y libgmp-dev
sudo apt-get install screen -y

sudo add-apt-repository ppa:deadsnakes/ppa -y

# Install python3.9 and pip3.9
sudo  apt install -y python3.9 python3.9-dev python3.9-distutils python3.9-venv
sudo  apt-get install -y python3-pip

# Install Rust
sudo  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"


# Install nodejs
sudo  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo  apt-get install -y nodejs

# Install pnpm
sudo  npm install -g pnpm

python3.9 -m venv starknet-venv
source starknet-venv/bin/activate
pip3 install starknet-devnet

deactivate