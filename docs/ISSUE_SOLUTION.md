# Solution: Force ZigNet to Use NVIDIA RTX 4090 Instead of AMD Radeon

## Your Issue

You have:
- AMD Radeon 6950XT
- NVIDIA RTX 4090  
- ZigNet is using the Radeon instead of the 4090

You want to "blacklist" the Radeon so ZigNet always uses the 4090.

## Quick Solution

Update your VS Code MCP configuration (`.vscode/mcp.json`) to include the GPU device selection:

```json
{
  "servers": {
    "zignet": {
      "command": "C:\\nvm4w\\nodejs\\npx.cmd",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

**Important:** The GPU index depends on how your system enumerates devices. You'll need to check which GPU is which.

## Step-by-Step Guide

### Step 1: Identify Your GPU Indices

Run this command in PowerShell or CMD:

```powershell
nvidia-smi
```

You'll see output like:
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 525.85.12    Driver Version: 525.85.12    CUDA Version: 12.0     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
|   0  NVIDIA RTX 4090     Off  | 00000000:01:00.0  On |                  Off |
+-------------------------------+----------------------+----------------------+
```

Note the GPU number (0 in this example).

**Note:** Your AMD GPU won't show up in `nvidia-smi` because it only lists NVIDIA GPUs. This is actually good - CUDA (which ZigNet uses) can't use AMD GPUs anyway.

### Step 2: Update Your Configuration

If your RTX 4090 is GPU 0 (likely):
```json
{
  "servers": {
    "zignet": {
      "command": "C:\\nvm4w\\nodejs\\npx.cmd",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

If your RTX 4090 is GPU 1:
```json
{
  "servers": {
    "zignet": {
      "command": "C:\\nvm4w\\nodejs\\npx.cmd",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "1"
      }
    }
  }
}
```

### Step 3: Restart VS Code

After updating the configuration:
1. Close VS Code completely
2. Reopen VS Code
3. The MCP server will restart with the new GPU selection

### Step 4: Verify It's Working

After running ZigNet, you should see in the logs:
```
🎯 GPU device selection: 0
🎮 GPU layers: 35
```

You can also check GPU usage while ZigNet is running:
```powershell
nvidia-smi
```

You should see the RTX 4090 showing activity.

## What This Does

Setting `ZIGNET_GPU_DEVICE` tells ZigNet to set the `CUDA_VISIBLE_DEVICES` environment variable before loading the model. This is a standard CUDA feature that:

1. Restricts CUDA to only see the specified GPU(s)
2. Makes other GPUs invisible to CUDA
3. Effectively "blacklists" the AMD GPU (which CUDA can't use anyway)

## Alternative: Global Environment Variable

If you want this setting for all instances of ZigNet (not just VS Code):

**PowerShell:**
```powershell
[System.Environment]::SetEnvironmentVariable('ZIGNET_GPU_DEVICE', '0', 'User')
```

**Then restart your terminal and VS Code.**

## Troubleshooting

### Still Using Wrong GPU

1. **Check GPU index:** Run `nvidia-smi` to confirm your RTX 4090's index
2. **Check logs:** ZigNet logs should show "GPU device selection: X"
3. **Try the other index:** If 0 doesn't work, try 1

### Performance Still Slow

1. **Check VRAM usage:**
   ```powershell
   nvidia-smi
   ```
   The model needs ~5GB. If you see less, reduce GPU layers:
   ```json
   "env": {
     "ZIGNET_GPU_DEVICE": "0",
     "ZIGNET_GPU_LAYERS": "20"
   }
   ```

2. **Monitor GPU utilization:**
   ```powershell
   nvidia-smi -l 1
   ```
   This refreshes every second. You should see GPU usage spike when ZigNet is active.

### AMD GPU Warnings

AMD GPUs are not CUDA-compatible. Any warnings about AMD GPUs can be safely ignored - CUDA simply won't use them.

## Additional Configuration Options

See [GPU_CONFIGURATION.md](./GPU_CONFIGURATION.md) for more advanced scenarios:
- Multiple NVIDIA GPUs
- CPU-only inference
- Custom model paths
- Multi-GPU inference (experimental)

## Need More Help?

- Full documentation: [GPU_CONFIGURATION.md](./GPU_CONFIGURATION.md)
- Test your config: Run `node scripts/test-gpu-config.js`
- Configuration reference: [.env.example](../.env.example)
