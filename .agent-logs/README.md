# Agent logs

Automatically captured by `.claude/hooks/capture.py`, wired via `.claude/settings.json`
(`UserPromptSubmit` + `Stop` hooks). One file per session:
`YYYY-MM-DD_HH-MM-SS_<session-id>.md`, containing the verbatim prompt and the final
assistant response text for each turn — no thinking, no tool calls, no intermediate steps.

Not in `.gitignore` — these ship with the repo.
