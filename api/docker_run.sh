#!/bin/bash

# Note: This script needs to run from inside /api dir
export PROMTAIL_BASE_DIR=$(pwd)  
export METRICS_PORT=${METRICS_PORT-8001}

if [ -z ${ENVIRONMENT} ]; then
  echo "ENVIRONMENT env var undefined"
  exit 1
fi

if [ -z ${SERVICE_VERSION} ]; then
  echo "SERVICE_VERSION env var undefined"
  exit 1
fi

grafana-agent-flow run ./configs/grafana-logs.config.river &

cargo run --release