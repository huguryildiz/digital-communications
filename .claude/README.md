# Local working area

Most of this folder is ignored by git. Only the agent instructions and guards are tracked: this
README, `settings.json`, `rules/`, and `hooks/`. Everything else is a local working record and never
leaves this machine.

| Folder | Tracked | What goes in it |
|---|---|---|
| `rules/` | yes | path-scoped content, figure, notes/PDF, source-audit, and build instructions; `CLAUDE.md` routes Codex to the relevant file |
| `hooks/` | yes | the shared `PreToolUse` guard, the Stop guard, and their behavior tests |
| `commands/` | no | slash-command definitions used while building this course |
| `notes/` | no | per-module source inventories and scratch findings, gitignored |
| `plans/` | no | phase plans, one per build phase; their `- [ ]` checkboxes are the state of the work |
| `sdd/` | no | spec-driven-development handoffs, briefs and reports for individual phases |
| `specs/` | no | design records for the plans, under the same date |
| `reference/` | no | `history.md` (how the course reached its state), `archive/` (earlier instruction files) |
| `worktrees/` | no | scratch git worktrees created by agent tooling; safe to delete |

The tracked `settings.json` and the repository's `.codex/hooks.json` both run
`hooks/agent_guard.py` before a tool call; it blocks common `npm install` calls and direct edits to
`dist/`. `hooks/stop_guard.py` is currently not wired to any hook and can be run by hand; it also
depends on `tools/content_guard.py` and `tools/derivation_advisor.py`, neither of which exists in
this repository yet, so it will not run correctly until those are ported from the sibling course or
written here. Codex requires the user to review and trust a new hook definition before it runs. These
agent hooks do not run in CI.

`plans/`, `sdd/`, `specs/`, `notes/` and `reference/history.md` exist only on this machine; back up
the working copy accordingly. Editorial rules R1–R10 live in `rules/content-writing.md` and
`rules/figures-and-math.md`. Current work and release state are in the root `TODO.md`, which is also
local.
