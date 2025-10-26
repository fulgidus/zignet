#!/bin/bash
# Monitor ZigNet training progress

echo "🔍 ZigNet Training Monitor"
echo "=========================="
echo ""

# Check if training is running
if [ ! -f training.pid ]; then
    echo "❌ No training.pid found. Is training running?"
    exit 1
fi

PID=$(cat training.pid)

if ! ps -p $PID > /dev/null 2>&1; then
    echo "❌ Training process (PID $PID) is not running!"
    echo "Check training.log for errors."
    exit 1
fi

echo "✅ Training is running (PID: $PID)"
echo ""

# Get timestamps for ETA calculation
# Use process start time instead of log file modification time
PROCESS_START=$(ps -p $PID -o lstart= | date +%s -f -)
CURRENT_TIME=$(date +%s)
ELAPSED=$((CURRENT_TIME - PROCESS_START))
ELAPSED_HOURS=$(echo "scale=2; $ELAPSED / 3600" | bc)

# GPU status
echo "📊 GPU Status:"
/usr/lib/wsl/lib/nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total,power.draw --format=csv,noheader,nounits | \
    awk -F', ' '{printf "   Temperature: %s°C\n   GPU Usage: %s%%\n   VRAM Usage: %s%%\n   VRAM: %s MB / %s MB\n   Power: %s W\n", $1, $2, $3, $4, $5, $6}'
echo ""

# Training progress
echo "📝 Training Progress:"
# Get last progress bar line (contains X/1806)
PROGRESS_LINE=$(tail -50 training.log | grep -oE '[0-9]+/1806' | tail -1)
if [ -n "$PROGRESS_LINE" ]; then
    CURRENT_STEP=$(echo $PROGRESS_LINE | cut -d'/' -f1)
    TOTAL_STEPS=1806
    PERCENT=$(echo "scale=1; $CURRENT_STEP * 100 / $TOTAL_STEPS" | bc)
    echo "   Step: $CURRENT_STEP / $TOTAL_STEPS ($PERCENT%)"
    
    # Estimate time remaining
    if [ $CURRENT_STEP -gt 0 ]; then
        ELAPSED_SECS=$ELAPSED
        TIME_PER_STEP=$(echo "scale=2; $ELAPSED_SECS / $CURRENT_STEP" | bc)
        REMAINING_STEPS=$((TOTAL_STEPS - CURRENT_STEP))
        REMAINING_SECS=$(echo "$REMAINING_STEPS * $TIME_PER_STEP" | bc | cut -d'.' -f1)
        REMAINING_HOURS=$(echo "scale=1; $REMAINING_SECS / 3600" | bc)
        echo "   Speed: ${TIME_PER_STEP}s per step"
        echo "   ETA: ~${REMAINING_HOURS}h remaining"
    fi
else
    echo "   Initializing..."
fi
echo ""

echo "⏱️  Time elapsed: ${ELAPSED_HOURS}h"
echo "⏱️  Started: $(ps -p $PID -o lstart= | awk '{print $4}')"
echo ""

echo "Commands:"
echo "  - Full log: tail -f training.log"
echo "  - GPU status: watch -n 1 ./scripts/monitor-training.sh"
echo "  - GPU watch: watch -n 1 /usr/lib/wsl/lib/nvidia-smi"
echo "  - Stop training: kill \$(cat training.pid)"
