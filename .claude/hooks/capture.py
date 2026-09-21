#!/usr/bin/env python3
"""
8x assignment capture hook.

Wired into .claude/settings.json on UserPromptSubmit and Stop.
Appends PROMPT / RESPONSE entries to a per-session log file under .agent-logs/.

Must never block or break Claude Code: every failure path falls through to
sys.exit(0) after (best-effort) logging the error to stderr.
"""
import sys
import os
import json
import glob
import re
from datetime import datetime, timezone

AUTHOR = "SobanSageer"
TOOL = "claude-code"
PROJECT = "amazon-clone"

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
FRONTMATTER_ORDER = [
    "session_id", "date", "author", "model", "tool", "project",
    "total_exchanges", "first_prompt_time", "last_prompt_time",
]


def eprint(*a, **k):
    try:
        print(*a, file=sys.stderr, **k)
    except Exception:
        pass


def now_iso():
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def read_stdin_json():
    data = sys.stdin.read()
    return json.loads(data) if data else {}


def project_dir():
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()


def logs_dir():
    d = os.path.join(project_dir(), ".agent-logs")
    os.makedirs(d, exist_ok=True)
    return d


def find_session_file(session_id):
    pattern = os.path.join(logs_dir(), f"*_{session_id}.md")
    matches = glob.glob(pattern)
    if matches:
        matches.sort()
        return matches[-1]
    return None


def load_transcript_entries(transcript_path):
    entries = []
    if not transcript_path or not os.path.isfile(transcript_path):
        return entries
    with open(transcript_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def is_tool_result_entry(entry):
    if entry.get("type") != "user":
        return False
    msg = entry.get("message") or {}
    content = msg.get("content")
    if isinstance(content, list):
        return any(isinstance(c, dict) and c.get("type") == "tool_result" for c in content)
    return False


def most_recent_model(entries):
    for entry in reversed(entries):
        if entry.get("type") == "assistant":
            msg = entry.get("message") or {}
            model = msg.get("model")
            if model:
                return model
    return None


def last_turn_final_text(entries):
    """Final assistant text of the latest turn: text-only content blocks of the
    LAST assistant message since the most recent real (non tool-result) user
    prompt. No thinking, no tool_use, no tool_result."""
    last_user_idx = None
    for i in range(len(entries) - 1, -1, -1):
        if entries[i].get("type") == "user" and not is_tool_result_entry(entries[i]):
            last_user_idx = i
            break
    search_from = last_user_idx if last_user_idx is not None else 0

    last_assistant = None
    for i in range(len(entries) - 1, search_from - 1, -1):
        if entries[i].get("type") == "assistant":
            last_assistant = entries[i]
            break

    if last_assistant is None:
        return None, None

    msg = last_assistant.get("message") or {}
    model = msg.get("model")
    content = msg.get("content")
    parts = []
    if isinstance(content, list):
        for c in content:
            if isinstance(c, dict) and c.get("type") == "text" and c.get("text"):
                parts.append(c["text"])
    elif isinstance(content, str):
        parts.append(content)
    return model, "\n\n".join(parts).strip()


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm


def build_frontmatter(fm):
    lines = ["---"]
    for k in FRONTMATTER_ORDER:
        lines.append(f"{k}: {fm.get(k, '')}")
    lines.append("---")
    return "\n".join(lines) + "\n"


def rewrite_frontmatter(path, updates):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    fm = parse_frontmatter(text)
    fm.update(updates)
    new_fm = build_frontmatter(fm)
    body = FRONTMATTER_RE.sub("", text, count=1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_fm + body)


def count_prompt_entries(path):
    if not path or not os.path.isfile(path):
        return 0
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    return len(re.findall(r"\[LOG_ENTRY type=PROMPT ", text))


def handle_prompt(payload):
    session_id = payload.get("session_id") or "unknown-session"
    transcript_path = payload.get("transcript_path")
    prompt_text = payload.get("prompt", "")
    ts = now_iso()

    entries = load_transcript_entries(transcript_path)
    model = most_recent_model(entries) or "unknown"

    path = find_session_file(session_id)
    is_new = path is None
    if is_new:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
        path = os.path.join(logs_dir(), f"{stamp}_{session_id}.md")
        fm = {
            "session_id": session_id,
            "date": date_str,
            "author": AUTHOR,
            "model": model,
            "tool": TOOL,
            "project": PROJECT,
            "total_exchanges": "0",
            "first_prompt_time": ts,
            "last_prompt_time": ts,
        }
        header = build_frontmatter(fm)
        header += f"\n# Session Log - {date_str}\n\n"
        header += f"Session: `{session_id}` | Project: `{PROJECT}` | Author: `{AUTHOR}`\n\n---\n"
        with open(path, "w", encoding="utf-8") as f:
            f.write(header)

    num = count_prompt_entries(path) + 1

    entry = (
        f"\n[LOG_ENTRY type=PROMPT num={num} session={session_id}]\n"
        f"timestamp: {ts}\n"
        f"model: {model}\n\n"
        f"{prompt_text}\n\n"
    )
    with open(path, "a", encoding="utf-8") as f:
        f.write(entry)

    updates = {"last_prompt_time": ts, "total_exchanges": str(num)}
    if is_new:
        updates["first_prompt_time"] = ts
    rewrite_frontmatter(path, updates)


def handle_response(payload):
    session_id = payload.get("session_id") or "unknown-session"
    transcript_path = payload.get("transcript_path")
    ts = now_iso()

    path = find_session_file(session_id)
    if path is None:
        # Stop fired without a captured prompt for this session; nothing to attach to.
        return

    entries = load_transcript_entries(transcript_path)
    model, text = last_turn_final_text(entries)
    if not text:
        text = "(no final text content captured)"
    if not model:
        model = "unknown"

    num = count_prompt_entries(path)

    entry = (
        f"\n[LOG_ENTRY type=RESPONSE num={num} session={session_id}]\n"
        f"timestamp: {ts}\n"
        f"model: {model}\n\n"
        f"{text}\n\n"
    )
    with open(path, "a", encoding="utf-8") as f:
        f.write(entry)

    rewrite_frontmatter(path, {"model": model})


def main():
    try:
        mode = sys.argv[1] if len(sys.argv) > 1 else None
        payload = read_stdin_json()
        event = payload.get("hook_event_name") or mode
        if mode == "prompt" or event == "UserPromptSubmit":
            handle_prompt(payload)
        elif mode == "response" or event == "Stop":
            handle_response(payload)
        else:
            eprint(f"[capture.py] unrecognized event/mode: event={event} mode={mode}")
    except Exception as e:
        eprint(f"[capture.py] error: {e}")
    sys.exit(0)


if __name__ == "__main__":
    main()
