#!/bin/bash
set -x
echo "=== Container Starting ==="
echo "Working directory: $(pwd)"
echo "Port: $PORT"
echo "R_LIBS_USER: $R_LIBS_USER"
ls -la /app/ || echo "Failed to list /app"
echo "Running Rscript..."
exec Rscript /app/run.R
