#!/usr/bin/env python3
"""사용자 창을 열지 않는 공식 Codex PINOC 로그인 명령."""

import os

os.execvp("codex", [
    "codex", "mcp", "login", "pinoc", "--no-browser",
    "--scopes", "pinoc:read,pinoc:generate",
])
