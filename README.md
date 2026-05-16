# EdgeVision Runtime

Real-time computer vision in the browser, powered by ONNX Runtime Web.

EdgeVision Runtime is a browser-native inference engine for running multiple vision models locally via WASM or WebGPU. It ships with **YOLOv8n** as the default demo model and is built to support object detection, embeddings, segmentation, and future vision pipelines.

No cloud inference. No server-side GPU required for execution. A minimal static host (or local dev server) is still required to serve assets and set COOP/COEP headers for multi-threaded WASM.

## Key features

- Browser-native inference (WASM / WebGPU)
- Real-time detection on uploaded video or direct video URLs
- Multi-model layout: plug-in ONNX files under `public/models/`
- YOLOv8n included as the default demo model only
- Local model loading from `/models/`
- Reference UI with session analytics and class breakdown
- Extensible toward embeddings, tracking, and segmentation

## Architecture overview

EdgeVision is a modular vision runtime, not a single-model application.

| Layer | Role |
|-------|------|
| **Input** | Video upload, file drop, or direct `.mp4` URL (browser permitting CORS) |
| **Inference** | ONNX Runtime Web (WASM default; WebGPU when enabled) |
| **Model** | ONNX files in `public/models/` (YOLOv8n demo today; more types planned) |
| **Output** | Bounding boxes and class scores; future: masks, embeddings, track IDs |

**Hosting:** Files are served from `public/`. Local development uses `server.js` (Express) to apply `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` required for threaded WASM. Vercel or similar static hosts need the same headers via `vercel.json`.

## Default model (demo only)

EdgeVision includes one bundled demo model:

- **YOLOv8n** (COCO pretrained)
- 80 object classes, 640×640 input
- Lightweight real-time detection on CPU via WASM

**YOLOv8n is the starting model, not the product.** The runtime is not limited to YOLO or detection.

Default demo classes include: person, bag, backpack, car, bicycle, bottle, phone, laptop, umbrella, suitcase, cat, dog, and 70+ more.

## Models

**Currently supported**

- YOLOv8 ONNX exports (detection), loaded from `public/models/`

**Planned**

- Embedding models (similarity / visual search)
- Segmentation models (instance masks)
- Multi-object tracking adapters
- Custom ONNX pipelines and model switcher in the reference UI

The dev server lists ONNX files at `http://localhost:3000/models` when running `npm start`. The reference UI currently loads `yolov8n.onnx` by default.

## Quick start

```bash
npm install
npm run dev
```

This will:

1. Install dependencies
2. Download the default model if missing (`yolov8n.onnx`, ~12MB) via `npm run setup`
3. Start the dev server
4. Open the browser at `http://localhost:3000`

## Manual setup

```bash
npm install
npm run setup   # download yolov8n.onnx (~12MB)
npm start       # http://localhost:3000
```

If port 3000 is occupied:

```bash
PORT=8080 npm start
```

## Adding new models

Drop any compatible `.onnx` file into:

```text
public/models/
```

When using the local server, available models are listed at:

```text
http://localhost:3000/models
```

Reload the app after adding files. For detection exports, use the same input size and opset as your reference model unless you update the UI pre/post-processing.

## Export models (YOLOv8 example)

```bash
pip install ultralytics
yolo export model=yolov8n.pt format=onnx opset=12 imgsz=640 dynamic=False
```

Move the exported `.onnx` into `public/models/`.

## Performance

Benchmarks use the **default YOLOv8n demo** on a typical laptop:

| Mode | Performance |
|------|-------------|
| WASM (CPU) | ~3–8 FPS |
| WebGPU (Chrome) | ~15–25 FPS |

Enable WebGPU in Chrome: `chrome://flags` → search **WebGPU** → Enable.

## Vision and roadmap

EdgeVision Runtime is evolving into a browser-native vision framework:

- Embedding-based visual search
- Multi-object tracking (e.g. SORT / ByteTrack-style association)
- Segmentation and mask overlays in the reference UI
- Model adapter layer and runtime model selection
- WebGPU-first inference path where available

Compared with cloud-only vision stacks, browser-edge inference reduces cost, keeps data on-device, and supports offline-capable deployments once assets are cached.

## Project structure

```text
public/
  index.html          # reference host UI
  models/
    yolov8n.onnx      # default demo model (committed)
scripts/
  setup.js            # download default model if missing
server.js             # local dev server (static + COOP/COEP)
package.json
README.md
```

## Author

Built by [kimmonzon.com](https://kimmonzon.com)
