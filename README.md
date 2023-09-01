# Starknet Remix Plugin

Welcome to the Starknet Remix Plugin repository! This powerful tool seamlessly integrates with the Remix IDE, enabling developers to effortlessly deploy and interact with StarkNet contracts. Whether you're a seasoned blockchain developer or just getting started, our plugin provides a streamlined experience for working with StarkNet's unique capabilities. Dive in to explore detailed installation guides, developer resources, and more. Happy coding!

## For users

If you're looking to utilize the capabilities of StarkNet contracts within the Remix IDE, you've come to the right place. This section provides you with a straightforward guide to get started.

### Getting Started

1. **Installation**: No additional installation is required for standard users. Simply access the Remix IDE and look for the Starknet Remix Plugin in the plugins section. Or just go to Remix directly from [this link](https://remix.ethereum.org/#activate=Starknet-cairo1-compiler).

2. **Usage**: Once the plugin is activated, you'll find a user-friendly interface that allows you to deploy and interact with StarkNet contracts. Follow the on-screen prompts and tooltips for guidance.

3. **Feedback**: Your feedback is invaluable to us. If you encounter any issues or have suggestions for improvements, please reach out through our [discord](https://discord.com/invite/PaCMRFdvWT) or our [community](https://community.nethermind.io/).

## For Developers

### Installation

#### API

The API is a Rust project that uses [Rocket](https://rocket.rs/). Therefore you'll need to install Rust and Cargo, [see](https://www.rust-lang.org/tools/install).
Ideally you'll want to want use [rustup](https://rustup.rs/) to install Rust.

```bash
cd api;
git submodule update --init;
cargo build;
```

#### Plugin

The plugin it self is a React project, you'll need to install [pnpm](https://pnpm.io/).

```bash
cd plugin;
pnpm install;
```

#### Running the development environment

You need to be running both the server and the plugin in order to have a working environment.

For your dev environment:
```bash
cd plugin;
pnpm run start;
```

For an optimized build (will not listen to changes):
```
pnpm run deploy;
pnpm run serve;
```

```bash
cd api;
cargo run;
```

or alternatively, you can run the server in watch mode (with `cargo watch`):

```bash
cargo install cargo-watch;
cargo watch -x run;
```

For devnet interactions, you'll need to use [Starknet Devnet](https://github.com/Shard-Labs/starknet-devnet).

##### Connecting the plugin

In [Remix](http://remix-alpha.ethereum.org/), go to the `Plugin Manager` at the bottom of the left panel, and click on `Connect to a Local Plugin`.

Then, chose a name for the plugin, and in the `URL` field, enter `http://localhost:3000`, the `Type of Connection` should `iframe` and the `Location in remix` `Side Panel` and click on `Ok`, see the image below.

![Plugin Manager](./docs/images/plugin-import.png)

You should be able to activate and see the plugin now.

### Support and Contributions

Feel free to contribute any [issues](https://github.com/NethermindEth/starknet-remix-plugin/issues) you might find, check our [good first issues](https://github.com/NethermindEth/starknet-remix-plugin/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and read our [Contribution Guidelines](https://github.com/NethermindEth/starknet-remix-plugin/blob/develop/docs/CONTRIBUTING.md). Join our [Discord channel](https://discord.com/invite/PaCMRFdvWT) and our [community](https://community.nethermind.io/) to connect with other users, share your experiences, and get answers to any questions you might have. Our community is eager to help newcomers.

We hope you enjoy using the Starknet Remix Plugin and look forward to seeing the innovative ways you leverage StarkNet contracts!
