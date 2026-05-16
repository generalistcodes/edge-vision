const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MODEL_DEST = path.join(__dirname, '..', 'public', 'models', 'yolov8n.onnx');
const MODEL_SIZE_EXPECTED = 6_000_000;

const SOURCES = [
  'https://github.com/ultralytics/assets/releases/latest/download/yolov8n.onnx',
  'https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.onnx',
];

async function downloadFile(url, dest) {
  console.log(`\nDownloading from:\n  ${url}`);
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total = parseInt(res.headers.get('content-length') || '0', 10);
  const reader = res.body && res.body.getReader ? res.body.getReader() : null;
  if (!reader) {
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log('\n  ✓ Download complete');
    return;
  }
  const file = fs.createWriteStream(dest);
  let downloaded = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      file.write(value);
      downloaded += value.length;
      if (total) {
        const pct = Math.round((downloaded / total) * 100);
        process.stdout.write(`\r  Progress: ${pct}% (${(downloaded / 1e6).toFixed(1)}MB)`);
      }
    }
    await new Promise((resolve, reject) => {
      file.end((e) => (e ? reject(e) : resolve()));
    });
    console.log('\n  ✓ Download complete');
  } catch (e) {
    file.close();
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    throw e;
  }
}

function tryPythonExport() {
  console.log('\nTrying Python ultralytics export...');
  try {
    execSync('python3 -c "import ultralytics"', { stdio: 'ignore' });
    console.log('  ultralytics found, exporting...');
    execSync(
      `python3 -c "from ultralytics import YOLO; m=YOLO('yolov8n.pt'); m.export(format='onnx', opset=12, dynamic=False, imgsz=640)"`,
      { stdio: 'inherit', cwd: path.join(__dirname, '..') }
    );
    const generated = path.join(__dirname, '..', 'yolov8n.onnx');
    if (fs.existsSync(generated)) {
      fs.renameSync(generated, MODEL_DEST);
      console.log('  ✓ Model exported and moved to public/models/');
      return true;
    }
  } catch (e) {
    const msg = e && e.message ? e.message.split('\n')[0] : String(e);
    console.log('  Python export not available:', msg);
  }
  return false;
}

async function main() {
  console.log('='.repeat(50));
  console.log('  EdgeVision Runtime — Setup');
  console.log('='.repeat(50));

  if (fs.existsSync(MODEL_DEST)) {
    const size = fs.statSync(MODEL_DEST).size;
    if (size > MODEL_SIZE_EXPECTED) {
      console.log(`\n✓ Model already exists (${(size / 1e6).toFixed(1)}MB) — skipping download`);
      return;
    }
    console.log('\nExisting model too small, re-downloading...');
    fs.unlinkSync(MODEL_DEST);
  }

  fs.mkdirSync(path.dirname(MODEL_DEST), { recursive: true });

  for (const url of SOURCES) {
    try {
      await downloadFile(url, MODEL_DEST);
      const size = fs.statSync(MODEL_DEST).size;
      if (size > MODEL_SIZE_EXPECTED) {
        console.log(`\n✓ Model ready: ${(size / 1e6).toFixed(1)}MB`);
        return;
      }
      console.log(`  File too small (${size} bytes), trying next source...`);
      fs.unlinkSync(MODEL_DEST);
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
      if (fs.existsSync(MODEL_DEST)) fs.unlinkSync(MODEL_DEST);
    }
  }

  const pyOk = tryPythonExport();
  if (!pyOk) {
    console.log('\n⚠ Could not download model automatically.');
    console.log('\nMANUAL OPTIONS:');
    console.log('  1. pip install ultralytics');
    console.log("     yolo export model=yolov8n.pt format=onnx opset=12 imgsz=640");
    console.log('     mv yolov8n.onnx public/models/');
    console.log('\n  2. Download from browser:');
    console.log('     https://github.com/ultralytics/assets/releases/latest/download/yolov8n.onnx');
    console.log('     → save to public/models/yolov8n.onnx');
    console.log('\nThen run: npm start');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
