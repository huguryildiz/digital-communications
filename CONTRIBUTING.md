# Contributing

Thank you for reading this before opening an issue. This repository is the
teaching material for one undergraduate course, written and maintained by one
person, so what is useful here is narrower than in a normal open-source
project. This page says what that is, so that nobody spends an evening on work
that will not be merged.

## What is very welcome

**Errata.** A wrong number, a wrong sign, a factor of two, a mislabelled axis,
a solution whose `Check` step does not close, a broken figure in one browser.
These are the most valuable reports this repository can get, and they are
merged quickly.

When you report one, give:

- where it is — the scene id, the laboratory letter, or the question number;
- what it says, and what it should say;
- how you know. A one-line derivation or a two-line script is enough.

**Wording that a second-year student cannot follow.** The whole course is
written to be read by someone meeting the subject for the first time, in what
may be their second language. A sentence that only works if you already know
the answer is a defect, and saying which sentence it was is a real
contribution.

**Reproduction reports.** The build should give the same bytes on your machine
as on mine. If it does not, that is a bug worth hearing about.

## What will probably be declined

- **New topics, new modules, new laboratories.** The syllabus is fixed by the
  course, not by what would be interesting to add.
- **Reformatting, restyling and refactoring** that does not fix something. The
  visual language and the file layout are decided; see the Design System
  section of the README.
- **A build tool, a bundler, a framework or a runtime dependency.** The
  artifact is one offline file with no dependency at run time, and that is a
  requirement rather than a preference.
- **Multiple-choice options on questions.** Every question here is open-ended
  on purpose.

If you want one of these anyway, open an issue and make the case before you
write the code.

## Before you open a pull request

Everything in this repository is checked by gates, and a change is not finished
until they pass. Run them and paste **what the run printed** — a summary in
place of a run is not accepted.

```bash
cd build && node build.js                      # rebuild the artifact
cd build && node pw.js qa.js                   # 0 errors, 0 overflow, nothing dense
cd build && node pw.js labtest.js              # ERRORS: none
cd build && node pw.js textclash.js            # TOTAL COLLISIONS: 0
cd build && node pw.js mathscan.js             # SCENES WITH MATH DAMAGE: 0
cd build && node pw.js labwalk.js              # PROBLEMS: none
cd build && node pw.js seccheck.js             # PROBLEMS: none
cd verify && ../.venv/bin/python verify_scenes.py
cd verify && ../.venv/bin/python verify_drills.py
cd verify && ../.venv/bin/python verify_ber.py
.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" \
  "build/src/9[2-8]_drill_m*.js" "build/src/91_*.js" "build/src/70_labs.js" \
  "build/src/7[1-9]_labs*.js" "notes/src/*.js"
```

The README explains what each gate does and what it must print.

Two things that catch everybody at least once:

- **Commit the source and the rebuilt `dist/` file together**, never in
  separate commits.
- **Never run a blanket search-and-replace over `build/src/*.js`.** A backslash
  means one thing in JavaScript and another inside a TeX string.

You will need `source/` to build, and it is not in the repository: it holds the
lecture material and a textbook, which are not mine to redistribute. If you
cannot build because of that, report the problem instead and describe it well.

## Licence of what you contribute

By opening a pull request you agree that your change is released under the
licences this repository already uses: MIT for the software, and CC BY-NC-SA
4.0 for the teaching material. See [LICENSE](LICENSE).

## Reporting something privately

There is no server, no account and no user data here — the artifact is one HTML
file that makes no network request — so there is very little that could be a
security problem. If you still find something you would rather not post in
public, write to the address on <https://www.huguryildiz.com/>.
