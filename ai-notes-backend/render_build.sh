#!/usr/bin/env bash
set -o errexit

echo "==> Installing dependencies via pip..."
pip install -r requirements.txt
echo "✅ Dependencies installed successfully."