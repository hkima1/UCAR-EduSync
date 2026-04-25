import requests, json, sys

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

NVIDIA_API_KEY = "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"
invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {NVIDIA_API_KEY}",
    "Accept": "text/event-stream"
}

payload = {
    "model": "google/gemma-4-31b-it",
    "messages": [{"role": "user", "content": "Reply only with the word: CONNECTED"}],
    "max_tokens": 16,
    "temperature": 0.1,
    "stream": True,
    "chat_template_kwargs": {"enable_thinking": True},
}

print("Testing google/gemma-4-31b-it ...", flush=True)

try:
    response = requests.post(invoke_url, headers=headers, json=payload, stream=True, timeout=90)
    response.raise_for_status()
    output = ""
    for line in response.iter_lines():
        if not line:
            continue
        decoded = line.decode("utf-8")
        if not decoded.startswith("data:"):
            continue
        data_str = decoded[5:].strip()
        if data_str == "[DONE]":
            break
        try:
            data = json.loads(data_str)
            choices = data.get("choices", [])
            if not choices:
                continue
            delta = choices[0].get("delta", {})
            reasoning = delta.get("reasoning_content")
            if reasoning:
                print(reasoning, end="", flush=True)
            content = delta.get("content")
            if content:
                output += content
                print(content, end="", flush=True)
        except json.JSONDecodeError:
            continue
    print(f"\n\nSUCCESS - Model LIVE. Output: '{output.strip()}'")
except Exception as e:
    print(f"\nFAILED: {e}")
