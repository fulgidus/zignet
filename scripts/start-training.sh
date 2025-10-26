#!/bin/bash
# Start ZigNet training in background with logging

cd /home/fulgidus/Projects/zignet

# Activate virtual environment
source venv-train/bin/activate

# Run training with output to log file
echo "🚀 Starting ZigNet training at $(date)"
echo "📝 Log file: training.log"
echo "📊 Monitor progress: tail -f training.log"
echo ""

nohup python scripts/train-qwen-standard.py > training.log 2>&1 &

# Get PID
TRAIN_PID=$!
echo "✅ Training started with PID: $TRAIN_PID"
echo "$TRAIN_PID" > training.pid

echo ""
echo "Commands:"
echo "  - Monitor: tail -f training.log"
echo "  - Stop: kill \$(cat training.pid)"
echo "  - Check GPU: watch -n 1 nvidia-smi"
echo ""
echo "Estimated completion: $(date -d '+8 hours')"
