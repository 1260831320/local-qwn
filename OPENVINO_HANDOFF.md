# OpenVINO Handoff

This note summarizes the OpenVINO state that has already been verified on the current development machine.
It is intended as a handoff for future work that extends the existing Ollama-based backend with an OpenVINO backend option.

## Machine Summary

- OS: Windows 11 Home China 64-bit, build 26200
- CPU: Intel Core Ultra 5 125H
- RAM: 16 GB
- GPU: Intel Arc Graphics (integrated)
- NPU: Intel AI Boost

## Verified OpenVINO Runtime State

Python runtime used:

- `C:\Users\12608\AppData\Local\Programs\Python\Python312\python.exe`

Installed packages for the current user:

- `openvino==2026.0.0`
- `openvino-genai==2026.0.0.0`
- `tokenizers==0.22.2`

Verified device detection result:

- `CPU`
- `GPU`
- `NPU`

Observed device names:

- CPU: `Intel(R) Core(TM) Ultra 5 125H`
- GPU: `Intel(R) Arc(TM) Graphics (iGPU)`
- NPU: `Intel(R) AI Boost`

## NPU Driver State

Current Intel AI Boost driver state from `pnputil`:

- main driver `npu.inf`: `32.0.100.4621`
- extension driver `npu_extension.inf`: `32.0.100.2381`

The NPU is visible to OpenVINO and can be selected as a target device.

## Verified Local Assets

Utility scripts created during validation:

- `C:\Users\12608\openvino-ai\detect_devices.py`
- `C:\Users\12608\openvino-ai\run_genai.py`
- `C:\Users\12608\openvino-ai\run_writer.ps1`
- `C:\Users\12608\openvino-ai\README.md`

Verified local model directories:

- `C:\Users\12608\models\qwen2.5-1.5b-instruct-int4-ov`
- `C:\Users\12608\models\qwen3-1.7b-int4-ov`

## Actual Inference Results

### Working

`qwen2.5-1.5b-instruct-int4-ov`

- `CPU`: works
- `GPU`: works
- `NPU`: works

This is the current best verified model for office/writing tasks on this machine.

### Not Working Yet

`qwen3-1.7b-int4-ov`

- `CPU` or `GPU`: not revalidated in this handoff pass, but the model files are present
- `NPU`: fails during compile

Observed NPU compile error:

- `StopLocationVerifierPass Pass failed : Found 16 duplicated names after full verification`
- raised from `vpux-compiler`

This means NPU support is real on this machine, but model compatibility is still model-specific.

## Known Good Command

This command was verified after the NPU driver update:

```powershell
C:\Users\12608\AppData\Local\Programs\Python\Python312\python.exe C:\Users\12608\openvino-ai\run_genai.py C:\Users\12608\models\qwen2.5-1.5b-instruct-int4-ov "Please write a formal meeting notice email." --device NPU --max-new-tokens 180
```

## Integration Guidance For This Project

Current project backend is Ollama-first:

- default base URL: `http://127.0.0.1:11434`
- default model: `qwen2.5-coder:14b`
- current backend client class: `src/main/java/cn/zzy/qwen/service/OllamaClient.java`

For OpenVINO integration on this machine, the first practical step should be adding a backend abstraction instead of hard-wiring more logic into the existing Ollama client.

Recommended shape:

1. Introduce a model backend interface, for example:
   - `generate(systemPrompt, conversation, userMessage)`
   - `health()`
   - optional `backendName()`
2. Keep the current Ollama implementation as one backend.
3. Add an OpenVINO backend that shells out to the verified Python entrypoint first.
4. Make backend selection configurable in `application.yml`.
5. Keep model path and device configurable.

For the first OpenVINO pass, do not try to match the Ollama feature surface exactly.
Start with a simple non-streaming text generation backend for:

- health check
- single-turn generation
- existing `/api/chat` compatibility

Suggested initial OpenVINO config keys:

- `qwen.backend.type=openvino|ollama`
- `qwen.openvino.python-exe`
- `qwen.openvino.script-path`
- `qwen.openvino.model-dir`
- `qwen.openvino.device`
- `qwen.openvino.max-new-tokens`

Suggested values on this machine:

- `python-exe=C:\Users\12608\AppData\Local\Programs\Python\Python312\python.exe`
- `script-path=C:\Users\12608\openvino-ai\run_genai.py`
- `model-dir=C:\Users\12608\models\qwen2.5-1.5b-instruct-int4-ov`
- `device=NPU`
- `max-new-tokens=180`

## Important Constraints

- The validated OpenVINO path here is Python-based, not Java-native.
- The current verified model is a small writing model, not a coder model.
- It is suitable for office/writing tasks, not as a drop-in replacement for `qwen2.5-coder:14b`.
- NPU availability does not imply every OpenVINO model will compile on this hardware.

## Recommended Next Step For The Project Agent

Implement a backend abstraction and wire an OpenVINO backend through process execution first, using the verified Python command above.
After that works end-to-end, consider a richer integration path or a different local model set for coding tasks.
