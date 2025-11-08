# GPU Configuration Guide

This guide explains how to configure ZigNet to use specific GPUs on multi-GPU systems.

## Problem

On systems with multiple GPUs (e.g., AMD Radeon + NVIDIA RTX), ZigNet may use the wrong GPU for LLM inference. This is particularly common when:
- You have an AMD GPU (e.g., Radeon 6950XT) AND an NVIDIA GPU (e.g., RTX 4090)
- The AMD GPU is enumerated first by the system
- You want to force ZigNet to use the faster NVIDIA GPU

## Solution

ZigNet provides the `ZIGNET_GPU_DEVICE` environment variable to control GPU selection via `CUDA_VISIBLE_DEVICES`.

## How It Works

`CUDA_VISIBLE_DEVICES` is a standard CUDA environment variable that controls which GPUs are visible to CUDA applications:
- Setting it restricts CUDA to only see specific GPU indices
- GPU indices start at 0 (first GPU), 1 (second GPU), etc.
- AMD GPUs won't be used by CUDA anyway (they're not CUDA-compatible)

When you set `ZIGNET_GPU_DEVICE`, ZigNet automatically sets `CUDA_VISIBLE_DEVICES` before loading the LLM model.

## Identifying Your GPUs

Use `nvidia-smi` to list your NVIDIA GPUs:

```bash
nvidia-smi
```

Output example:
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 525.85.12    Driver Version: 525.85.12    CUDA Version: 12.0     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA RTX 4090     Off  | 00000000:01:00.0  On |                  Off |
| 30%   45C    P8    20W / 450W |    512MiB / 24564MiB |      0%      Default |
+-------------------------------+----------------------+----------------------+
```

In this example, the RTX 4090 is GPU 0.

## Configuration Methods

### Method 1: Environment Variable (Shell)

**Linux/macOS:**
```bash
export ZIGNET_GPU_DEVICE="0"
npx -y zignet
```

**Windows (PowerShell):**
```powershell
$env:ZIGNET_GPU_DEVICE="0"
npx -y zignet
```

**Windows (CMD):**
```cmd
set ZIGNET_GPU_DEVICE=0
npx -y zignet
```

### Method 2: VS Code MCP Configuration

Edit `.vscode/mcp.json`:

```json
{
  "servers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

**Windows with full paths:**
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

### Method 3: Claude Desktop Configuration

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

### Method 4: .env File

Create or edit `.env` file in your project:

```bash
ZIGNET_GPU_DEVICE="0"
```

## Configuration Values

| Value | Description | Use Case |
|-------|-------------|----------|
| `"0"` | Use first GPU only | Force use of RTX 4090 when it's GPU 0 |
| `"1"` | Use second GPU only | Force use of RTX 4090 when it's GPU 1 |
| `"2"` | Use third GPU only | For systems with 3+ GPUs |
| `"0,1"` | Use first and second GPUs | Multi-GPU inference (experimental) |
| Not set | Use all available GPUs | Default behavior |

## Common Scenarios

### Scenario 1: AMD GPU + NVIDIA GPU (User's Case)

**System:**
- GPU 0: AMD Radeon 6950XT
- GPU 1: NVIDIA RTX 4090

**Problem:** ZigNet tries to use the AMD GPU first, but CUDA doesn't work with AMD.

**Solution:** Set `ZIGNET_GPU_DEVICE="1"` to force NVIDIA GPU usage.

```bash
export ZIGNET_GPU_DEVICE="1"
npx -y zignet
```

### Scenario 2: Multiple NVIDIA GPUs

**System:**
- GPU 0: NVIDIA RTX 3090
- GPU 1: NVIDIA RTX 4090

**Problem:** ZigNet uses RTX 3090, but you want to use the faster RTX 4090.

**Solution:** Set `ZIGNET_GPU_DEVICE="1"` to use RTX 4090.

```bash
export ZIGNET_GPU_DEVICE="1"
npx -y zignet
```

### Scenario 3: CPU-Only Inference

**Problem:** You want to use CPU for inference (no GPU).

**Solution:** Set `ZIGNET_GPU_LAYERS="0"` (different from GPU_DEVICE):

```bash
export ZIGNET_GPU_LAYERS="0"
npx -y zignet
```

## Verification

Test your configuration:

```bash
node scripts/test-gpu-config.js
```

Expected output with `ZIGNET_GPU_DEVICE="0"`:
```
🧪 Testing GPU Device Configuration

📋 Configuration Test:
   GPU_DEVICE: 0
   GPU_LAYERS: 35
   MODEL_PATH: /home/user/.zignet/models/zignet-qwen-7b-q4km.gguf

🎯 GPU Selection Logic:
   ✅ CUDA_VISIBLE_DEVICES will be set to: 0
   ℹ️  This means only the specified GPU(s) will be visible to CUDA

✅ Configuration test complete!
```

## Troubleshooting

### GPU Still Using Wrong Device

1. **Check CUDA installation:**
   ```bash
   nvidia-smi
   nvcc --version
   ```

2. **Verify node-llama-cpp CUDA support:**
   ```bash
   npm list node-llama-cpp
   ```

3. **Check environment variables are being passed:**
   - For MCP: Ensure `env` section is correctly configured
   - For shell: Use `echo $ZIGNET_GPU_DEVICE` (Linux/macOS) or `echo %ZIGNET_GPU_DEVICE%` (Windows)

### Performance Still Slow

1. **Check GPU memory:**
   ```bash
   nvidia-smi
   ```
   The model requires ~5GB VRAM. If your GPU has less, consider reducing `ZIGNET_GPU_LAYERS`.

2. **Adjust GPU layers:**
   ```bash
   export ZIGNET_GPU_LAYERS="20"  # Use fewer layers
   npx -y zignet
   ```

### AMD GPU Warning Messages

AMD GPUs are not CUDA-compatible. If you see warnings about AMD GPUs:
- Set `ZIGNET_GPU_DEVICE` to the NVIDIA GPU index
- AMD GPU will be automatically ignored by CUDA

## Advanced Configuration

### Multiple GPUs for Model Parallelism

**Experimental:** Use multiple NVIDIA GPUs:

```bash
export ZIGNET_GPU_DEVICE="0,1"
npx -y zignet
```

Note: Multi-GPU support depends on model size and node-llama-cpp configuration.

### Custom Model with GPU Selection

```bash
export ZIGNET_GPU_DEVICE="0"
export ZIGNET_MODEL_PATH="/path/to/custom/model.gguf"
export ZIGNET_GPU_LAYERS="30"
npx -y zignet
```

## References

- [CUDA Environment Variables](https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#env-vars)
- [node-llama-cpp CUDA Support](https://node-llama-cpp.withcat.ai/guide/CUDA)
- [llama.cpp Multi-GPU](https://github.com/ggml-org/llama.cpp/discussions/8725)

## Related Configuration

See [.env.example](../.env.example) for all available configuration options.
