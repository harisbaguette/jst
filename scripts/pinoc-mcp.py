#!/usr/bin/env python3
"""Codex에 연결된 PINOC만 호출한다. 인증 정보는 메모리에서만 사용한다."""

import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

SERVER = "https://pinoc.mcp.viggle.ai/mcp"


def credentials():
    payloads = [
        {"type": "http", "url": SERVER, "headers": {}},
        {"headers": {}, "type": "http", "url": SERVER},
    ]
    for payload in payloads:
        digest = hashlib.sha256(json.dumps(payload, separators=(",", ":")).encode()).hexdigest()[:16]
        result = subprocess.run(
            ["security", "find-generic-password", "-s", "Codex MCP Credentials", "-a", "pinoc|" + digest, "-w"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            stored = json.loads(result.stdout)
            if stored.get("url") == SERVER and stored.get("server_name") in ("pinoc", "local:pinoc"):
                return stored["token_response"]["access_token"]
    raise RuntimeError("PINOC 인증 정보를 찾지 못했습니다. scripts/connect-pinoc.py를 실행하세요.")


class Client:
    def __init__(self):
        self.token = credentials()
        self.session = None
        self.sequence = 0
        self.protocol = "2025-03-26"
        initialized = self.request("initialize", {
            "protocolVersion": self.protocol,
            "capabilities": {},
            "clientInfo": {"name": "jst-local", "version": "0.1.0"},
        })
        self.protocol = initialized.get("protocolVersion", self.protocol)
        self.request("notifications/initialized", notification=True)

    def request(self, method, params=None, notification=False):
        self.sequence += 1
        payload = {"jsonrpc": "2.0", "method": method}
        if not notification:
            payload["id"] = self.sequence
        if params is not None:
            payload["params"] = params
        headers = [
            "Authorization: Bearer " + self.token,
            "Content-Type: application/json",
            "Accept: application/json, text/event-stream",
            "MCP-Protocol-Version: " + self.protocol,
        ]
        if self.session:
            headers.append("Mcp-Session-Id: " + self.session)
        config = '\n'.join('header = ' + json.dumps(h) for h in headers)
        config += '\ndata = ' + json.dumps(json.dumps(payload)) + '\n'
        with tempfile.TemporaryDirectory(prefix="jst-mcp-") as temporary:
            header_file = Path(temporary) / "headers"
            result = subprocess.run([
                "curl", "--silent", "--show-error", "--max-time", "100",
                "--request", "POST", "--url", SERVER, "--config", "-",
                "--dump-header", str(header_file), "--write-out", "\n%{http_code}",
            ], input=config, text=True, capture_output=True)
            if result.returncode:
                raise RuntimeError("PINOC 요청 연결 실패 (curl " + str(result.returncode) + ")")
            for line in header_file.read_text().splitlines():
                if line.lower().startswith("mcp-session-id:"):
                    self.session = line.split(":", 1)[1].strip()
        body, status = result.stdout.rsplit("\n", 1)
        if not 200 <= int(status) < 300:
            raise RuntimeError("PINOC HTTP " + status + ": " + body[:1500])
        if not body.strip():
            return {}
        if body.lstrip().startswith("{"):
            response = json.loads(body)
        else:
            messages = [json.loads(line[5:].strip()) for line in body.splitlines() if line.startswith("data:")]
            response = next((item for item in messages if item.get("id") == self.sequence), {})
        if "error" in response:
            raise RuntimeError(json.dumps(response["error"], ensure_ascii=False))
        return response.get("result", {})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("tool", help="list, schema 또는 PINOC 도구 이름")
    parser.add_argument("arguments", nargs="?", default="{}", help="도구 인자 JSON, schema일 때 도구 이름")
    parser.add_argument("--output", help="응답 JSON 저장 경로")
    args = parser.parse_args()
    client = Client()
    if args.tool in ("list", "schema"):
        result = client.request("tools/list")
        if args.tool == "list":
            result = [{"name": item["name"], "description": item.get("description", "")} for item in result.get("tools", [])]
        else:
            result = next(item for item in result["tools"] if item["name"] == args.arguments)
    else:
        result = client.request("tools/call", {"name": args.tool, "arguments": json.loads(args.arguments)})
    serialized = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        path = Path(args.output)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(serialized + "\n")
        print("응답 저장:", path)
    else:
        print(serialized)


if __name__ == "__main__":
    main()
