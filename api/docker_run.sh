#!/bin/sh

# Note: This script needs to run from inside /api dir
export PROMTAIL_BASE_DIR=$(pwd)  


# grafana-agent --config.expand-env=true --config.file ./configs/grafana-logs.config.yaml

./target/release/api