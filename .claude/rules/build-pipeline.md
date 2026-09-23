---
paths:
  - "build/**/*"
  - "notes/**/*"
  - "verify/**/*"
  - "tools/**/*"
  - "web/**/*"
  - "dist/**/*"
---

# Build and verification

`build/` and `notes/` must remain siblings at the repository root. `dist/` is generated; never
hand-edit it. `build/build.js` finds `build/src/[78][1-9]_*.js` and `9[1-9]_*.js`, but
`build/src/99_tail.html` assembles scene order. Add any new `SCENES_M*`, `LABS_M*`, or `DRILL_M*`
array there. Version bumps change `CONTENT.META` in `80_content_core.js`.

Python is the arm64 venv at `.venv/`. Never the x86_64 anaconda `python3`. `source/` is gitignored
and must be present locally before anything that reads it can be built or checked.

## Build commands

```bash
cd build  && node build.js          # the artifact -> dist/Digital_Communications.html
cd notes  && node build.js          # the lecture notes HTML
cd build  && node pw.js ../notes/topdf.js   # every edition to PDF
```

Run `git status` before any generated write. The tree is shared; preserve unrelated changes and stage
by explicit path. Verify a generated diff before committing. The artifact build is byte-reproducible:
building twice from unchanged sources leaves `git status` clean, so a diff nobody authored means
something is wrong.

## The gate chain

Routine edits (styling, wording, a single figure) need only a rebuild and a screenshot. Run the full
chain before a release, after a change to mathematics or laboratory logic, or when the owner asks.
Start with the syntax check; a parse error can make later gate failures misleading. Report the numbers
a run actually printed; do not substitute an old baseline.

```bash
node --check build/src/7*.js build/src/8*.js build/src/9*.js   # not a gate; runs first
cd build && node pw.js qa.js                 # 0 errors, 0 overflow, nothing under `dense`
cd build && node pw.js labtest.js            # ERRORS: none, options=0
cd build && node pw.js textclash.js          # TOTAL COLLISIONS: 0
cd build && node pw.js mathscan.js           # SCENES WITH MATH DAMAGE: 0 / N
cd build && node pw.js ../notes/mathscan.js  # LITERAL MATH IN NOTES: 0, KATEX ERRORS: 0
cd build && node pw.js labwalk.js            # PROBLEMS: none
cd build && node pw.js seccheck.js           # PROBLEMS: none
cd verify && ../.venv/bin/python verify_scenes.py   # N passed, 0 failed
cd verify && ../.venv/bin/python verify_drills.py   # N passed, 0 failed
cd verify && ../.venv/bin/python verify_ber.py      # N passed, 0 failed
.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" \
  "build/src/9[2-8]_drill_m*.js" "build/src/91_*.js" "build/src/70_labs.js" \
  "build/src/7[1-9]_labs*.js" "notes/src/*.js"       # TOTAL VIOLATIONS: 0
```

For the local edit loop, use `cd build && node pw.js labwalk.js --smoke` to check every laboratory in
both themes with a representative control state, skipping the full pager and endpoint sweep. Use
`cd build && node pw.js labwalk.js --labs=A,B` when a change is limited to selected laboratories. The
unqualified `labwalk.js` command remains the release gate.

`verify_ber.py` is written independently of the artifact's own simulation. Porting the simulation into
the gate makes the gate verify itself. Every new numerical result a scene states needs a PASS/FAIL
line in `verify/verify_scenes.py`.

After the PDFs are built, sweep them — no gate reads a rendering:

```bash
pdftotext -layout dist/Lecture_Notes.pdf - | grep -nE '\$[^$]+\$|\\\\[a-zA-Z]+'   # no output
cd build && node pw.js shot.js                                                    # then look
```

## The phone layout — a separate sweep

`body[data-layout]` chooses between the fixed 1920×1080 stage and a fluid phone/tablet column; see
`DESIGN.md` for the mechanism. None of the gates above reads the phone layout. When anything in
`10_style.css`, `40_core.js`, or `90_app.js` is touched, also run:

```bash
cd build && node pw.js mcheck.js              # PAGE SCROLLS SIDEWAYS / SPILLED / TARGETS: none
cd build && node pw.js mcheck.js --w=320 --h=568
cd build && node pw.js mcheck.js --w=844 --h=390     # a phone on its side
cd build && node pw.js mcheck.js --w=820 --h=1180    # a tablet upright
cd build && node pw.js mshot.js               # then look — scenes and the drawer, search, notation, map
```

## Advisory tools, not yet in the release chain

`build/slidebudget.js` counts figures and tabbed cards on every `slide:true` scene against the budget
in `DESIGN.md` and lists the slides outside it; run it after converting a module. `build/fitlist.js`
prints the fit factor of every slide scene and flags any under 0.90. Neither is one of the required
gates above; run them by hand when working on the slide conversion, the same way Signals and Systems
ran them while converting its own modules.

## Site

`web/` holds the public landing page and `web/build-site.js`, which assembles the published site in
`site/` (gitignored). The script runs the artifact and notes builds, then copies the artifact with the
instructor edition removed in memory: `{t:'instr'}` blocks, `src` and `teach` fields, and the edition
control. It must not modify `build/src` or overwrite `dist/`, and each transform asserts its hit count,
so a source edit that breaks a match stops the build. `web/pyodide.js` fetches the pinned Pyodide
runtime into `site/pyodide/` and checks every file against a pinned SHA-256 (`SKIP_PYODIDE=1` skips
it offline). After a site rebuild, run `cd build && node pw.js ../web/sitecheck.js`; it walks the
sanitised artifact, the cover links and the three HTML editions. `vercel.json` and `.vercelignore`
say what the host builds and serves; `.vercelignore` replaces `.gitignore` for the upload rather than
adding to it, so anything that must stay off the host is named there even when git already ignores
it.

## Traps

- `node --check` takes one file at a time; `node --check build/src/*.js` checks only the first match
  and silently ignores the rest. Loop over the glob, or use the multi-glob form shown above.
- A `const` at the top level of a classic script is not a property of `window`. A probe reading
  `window.LABS` finds nothing and reports a laboratory missing that is actually present.
- Never run a blanket search-and-replace over `build/src/*.js`. A backslash means one thing in
  JavaScript and another inside a TeX string.
- Commit sources and any rebuilt `dist/` file together, never in separate commits.
