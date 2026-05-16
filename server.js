const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS headers needed for ONNX Runtime Web SharedArrayBuffer
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Health check
app.get('/health', (req, res) => {
  const modelPath = path.join(__dirname, 'public', 'models', 'yolov8n.onnx');
  const modelExists = fs.existsSync(modelPath);
  const modelSize = modelExists ? fs.statSync(modelPath).size : 0;
  res.json({
    status: 'ok',
    model: modelExists ? 'ready' : 'missing',
    model_size_mb: (modelSize / 1e6).toFixed(1),
  });
});

// List available models
app.get('/models', (req, res) => {
  const modelsDir = path.join(__dirname, 'public', 'models');
  if (!fs.existsSync(modelsDir)) return res.json({ models: [] });
  const models = fs
    .readdirSync(modelsDir)
    .filter((f) => f.endsWith('.onnx'))
    .map((f) => ({
      name: f,
      size_mb: (fs.statSync(path.join(modelsDir, f)).size / 1e6).toFixed(1),
      url: `/models/${f}`,
    }));
  res.json({ models });
});

// Serve public directory (correct MIME for wasm/onnx)
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
      if (filePath.endsWith('.onnx')) {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
    },
  })
);

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n' + '='.repeat(50));
  console.log('  EdgeVision Runtime — Running');
  console.log('='.repeat(50));
  console.log(`\n  ✓ Server: ${url}`);
  console.log(`  ✓ Model:  ${url}/models/yolov8n.onnx`);
  console.log(`  ✓ Health: ${url}/health`);
  console.log('\n  Open your browser at:');
  console.log(`  → ${url}`);
  console.log('\n  Press Ctrl+C to stop\n');

  const cmd =
    process.platform === 'win32'
      ? `start ${url}`
      : process.platform === 'darwin'
        ? `open ${url}`
        : `xdg-open ${url}`;
  exec(cmd, (err) => {
    if (err) console.log('  (open browser manually)');
  });
});
