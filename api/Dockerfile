# Use the official Python 3.9 image as the base image
FROM python:3.9

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgmp3-dev

RUN git config --global url."https://github".insteadOf ssh://git@github

# Install rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add Rust binaries to the PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install the stable version of Rust
RUN rustup install stable

# Create and activate a Python virtual environment
RUN python -m venv ~/cairo_venv
RUN . ~/cairo_venv/bin/activate
ENV PATH="/root/cairo_venv/bin:${PATH}"

# Install cairo-lang
RUN pip install cairo-lang

# install Scarb
RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | bash
ENV PATH="/root/.local/bin:${PATH}"

# Set the working directory
WORKDIR /app

# Copy the existing Rust application
COPY . .

# Compile necessary Rust packages
RUN cd cairo_compilers; chmod +x build.sh; ./build.sh
RUN cargo build --release

EXPOSE 8000:80
CMD ["cargo", "run", "--release"]