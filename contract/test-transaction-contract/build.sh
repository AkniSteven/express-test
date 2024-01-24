#!/bin/bash
set -e

RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
mkdir -p ../out
cp target/wasm32-unknown-unknown/release/*.wasm ../out/main.wasm

rustup toolchain install 1.59
rustup default 1.59
rustup target add wasm32-unknown-unknown
