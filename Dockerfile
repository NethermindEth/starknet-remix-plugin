FROM ubuntu:20.04
FROM node:20

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN=true

ADD ./starknet-remix-plugin /home/ubuntu/starknet-remix-plugin

RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get install -y software-properties-common
RUN apt-get install -y libgmp-dev

RUN add-apt-repository ppa:deadsnakes/ppa

# Install python3.9 and pip3.9
RUN  apt install -y python3.9 python3.9-dev python3.9-distutils python3.9-venv
RUN  apt-get install -y python3-pip

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y


# Install nodejs
# RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# RUN  apt-get install -y nodejs

# Install pnpm
# RUN npm install -g pnpm

# Install starknet-devnet inside virtual environment

RUN node --version

RUN python3.9 -m venv starknet-venv
RUN . starknet-venv/bin/activate
RUN pip3 install starknet-devnet


EXPOSE 5050

# Run starknet-devnet after activating virtual environment
ENTRYPOINT ["/home/ubuntu/starknet-venv/bin/activate", "&&", "starknet-devnet"]



# Run the frontend server
# CMD cd /home/ubuntu/starknet-remix-plugin/plugin && pnpm install && pnpm run start

# # Run the backend server
# CMD cd /home/ubuntu/starknet-remix-plugin/api && cargo run






