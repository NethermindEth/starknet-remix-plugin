# Use the official Python 3.9 image as the base image
FROM python:3.9

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libgmp3-dev \
    git

# Install rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add Rust binaries to the PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install the stable version of Rust
RUN rustup install stable

# Create and activate a Python virtual environment
RUN python -m venv ~/cairo_venv
ENV PATH="/root/cairo_venv/bin:${PATH}"

# Install cairo-lang
RUN pip install cairo-lang

# Set the working directory
WORKDIR /app

# Copy the existing Rust application
COPY . .

# Compile necessary Rust packages
RUN ls
RUN git clone https://github.com/starkware-libs/cairo; cd cairo; git checkout v1.0.0-alpha.6; cargo build --bin starknet-compile; cargo build --bin starknet-sierra-compile
# RUN git submodule update --init
RUN cd cairo; git checkout v1.0.0-alpha.6; cargo build --bin starknet-compile; cargo build --bin starknet-sierra-compile
RUN cd /app; cargo build --release

# Expose the server port (replace it with the actual port your server uses)
EXPOSE 8080

# Start the server
CMD ["cargo", "run", "--release"]