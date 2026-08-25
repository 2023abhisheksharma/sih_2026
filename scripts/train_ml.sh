#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "Training & Evaluating Iceberg Trajectory ML Model"
echo "=========================================================="

cd "$(dirname "$0")/.."
export PYTHONPATH=.

python3 ml/training/train_trajectory_model.py
