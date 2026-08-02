---
description: Continue producing the EE 413 artifact from the implementation plan — finds the first unchecked step, does it, ticks it, commits.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Skill, TodoWrite
---

# Continue production

You are producing the EE 413 Digital Communications teaching artifact. This command is the only
entry point; the user runs it repeatedly and each run advances the work.

## Read first, in this order

1. `docs/superpowers/plans/2026-08-02-digital-communications.md` — the plan. Its `- [ ]` checkboxes
   are the state of the work.
2. `docs/superpowers/specs/2026-08-02-digital-communications-design.md` — the design record. The
   plan's section references (§4, §7, …) point into it.
3. `CLAUDE.md` if it exists yet — it does not until the final task.

## What to do

1. **Find where the work stands.** Grep the plan for the first `- [ ]`. Everything above it is
   done; everything below it is not. If the plan has no unchecked box left, say so and stop.

2. **Check the tree matches the plan.** Run `git status` and `git log --oneline | head -5`. The
   working tree is shared and may have moved. If the first unchecked step describes work that is
   visibly already done, say so and ask before ticking it — do not assume the plan is authoritative
   over the filesystem.

3. **Do the work.** Complete whole tasks, not single steps, unless a step is genuinely large. Stop
   at a task boundary, not in the middle of one — a half-written scene file that does not parse
   takes the whole artifact down.

4. **Run the gates the task names, and report the numbers they printed.** Never a summary in place
   of a run. If a gate fails, fix the cause; do not loosen the gate. Loosening `verify_ber.py` in
   particular — fewer trials, a wider interval — turns it green without checking anything.

5. **Tick the boxes you completed** by editing the plan file, `- [ ]` to `- [x]`.

6. **Commit.** Sources and any rebuilt `dist/` file in the same commit. Follow the repository's
   commit style: a short imperative subject naming what changed for the reader, then a body
   explaining why, in plain English. End with:

   ```text
   Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
   ```

7. **Report to the user in Turkish**: which task you finished, what each gate printed, what the
   next task is. Keep it short.

## Constraints that override convenience

- **`source/` must be present.** It is gitignored, so a fresh clone lacks it. If
  `source/Book.pdf` is missing, stop and say so — nothing can be built or checked without it.
- **Python is `.venv/bin/python`**, an arm64 venv. Never the x86_64 anaconda `python3`.
- **Playwright gates run through `build/pw.js`.** Do not rewrite the container `require` path in
  any gate, including a new one.
- **Never run a blanket search-and-replace over `build/src/*.js`.** A backslash means one thing in
  JavaScript and another inside a TeX string.
- **A textbook anchor is looked up in `source/Book.pdf` before it is written.** Never inferred from
  a chapter number, never carried over from `commsyslab` — its comments cite a different edition in
  places, confirmed for `gram-schmidt.ts`. `rule_check.py` cannot catch this: a wrong `PS` anchor is
  a well-formed one.
- **Look at a screenshot after a scene task.** No gate reads a rendering.
- **Do not redesign anything the spec locks.** If something looks wrong, say so and stop. Never
  change a locked decision silently.

## If the user passed an argument

`$ARGUMENTS` names a specific task or phase to work on instead of the first unchecked one — for
example `/uret Task 9` or `/uret Phase 3`. Honour it, but say plainly if earlier tasks it depends
on are still unchecked.
