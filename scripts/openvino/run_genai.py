import argparse
import sys

from openvino.properties.intel_npu import CompilerType
from openvino_genai import LLMPipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run an OpenVINO GenAI text generation prompt.")
    parser.add_argument("model_dir", help="Path to the exported OpenVINO model directory.")
    parser.add_argument("prompt", nargs="?", help="Prompt text. If omitted, the prompt is read from stdin as UTF-8.")
    parser.add_argument("--device", default="CPU", help="OpenVINO device, such as CPU, GPU, or NPU.")
    parser.add_argument("--max-new-tokens", type=int, default=256, help="Maximum number of generated tokens.")
    parser.add_argument("--do-sample", action="store_true", help="Enable sampling. NPU commonly requires greedy decoding.")
    parser.add_argument("--npu-driver-compiler", action="store_true", help="Use the NPU driver compiler path.")
    return parser.parse_args()


def resolve_prompt(args: argparse.Namespace) -> str:
    if args.prompt is not None:
        return args.prompt
    return sys.stdin.buffer.read().decode("utf-8")


def main() -> int:
    args = parse_args()
    kwargs = {}
    if args.device.upper() == "NPU" and args.npu_driver_compiler:
        kwargs["COMPILER_TYPE"] = CompilerType.DRIVER
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    pipe = LLMPipeline(args.model_dir, args.device, **kwargs)
    tokenizer = pipe.get_tokenizer()
    if getattr(tokenizer, "chat_template", None):
        tokenizer.set_chat_template(tokenizer.chat_template)
    output = pipe.generate(resolve_prompt(args), max_new_tokens=args.max_new_tokens, do_sample=args.do_sample)
    sys.stdout.write(str(output))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
