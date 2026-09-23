---
paths:
  - "source/**/*"
  - "build/src/8*.js"
  - "build/src/9*.js"
  - "notes/src/**/*.js"
---

# Source evidence and corrections

`source/` holds private reference material and is never reproduced, quoted, or redistributed, and
never named or described in student-facing text (`content-writing.md`, R1–R3). It is gitignored and
must be present locally before source-based authoring or correction can be checked.

Take the order of ideas and, where it is already plain, the phrasing of a definition or a warning
from that material rather than reconstructing one from a textbook or a slide deck. Where a page shows
a worked example as an image with no extractable text, that page is the authority for the numbers in
it; check them against it before writing the scene.

Never correct the source silently. Where a confirmed error is found (a sign, a factor, a mislabelled
axis), record it in `.claude/reference/history.md` and state the correction in the artifact where it
occurs, without naming the source. Look up a textbook anchor before writing it; a wrong `PS` or `CH`
anchor is well-formed text, so no gate can catch it. Where the reference material's chapter numbers
and this course's do not agree, check both before writing the anchor rather than assuming they match.
