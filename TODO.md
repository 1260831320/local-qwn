# Qwen Local Agent TODO

1. Persist conversation sessions and pending patch state across restarts.
2. Replace the text-only pending patch contract with a structured preview payload that includes file, line, and diff blocks.
3. Add explicit create-file confirmation in the UI so `write_file` follows the same trust model as patch apply.
4. Add a project summary / code map tool for larger repositories.
5. Add session and tool telemetry so invalid model actions can be diagnosed from the UI.
