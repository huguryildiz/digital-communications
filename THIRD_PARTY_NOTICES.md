# Third-Party Notices

The repository contains or uses the following third-party components. Their
licenses are not changed by the licenses for the original software or course
content in this repository.

## KaTeX 0.16.11

KaTeX is vendored in `build/src/20_katex.css` and `build/src/30_katex.js` and
is embedded in the generated HTML editions. Its font faces are inlined in
`20_katex.css` as part of the same release. It is distributed under the MIT
License.

Copyright (c) 2013–2020 Khan Academy and other contributors.

The MIT license text is included in `LICENSE` and applies to this component
under its original copyright notice.

## Radiant Shaders, “Kinetic Grid”

The hero background of the public page, `site/grid.js`, is adapted from the
upstream shader. What was changed is written at the top of that file.

Copyright (c) 2025 Paul Bakaus

Released under the MIT License. Source project:
https://github.com/pbakaus/radiant

## Pyodide 0.29.3

The code pages run Python in the reader's browser through Pyodide. It is not
stored in this repository: `tools/pyodide.js` fetches it at deploy time and
publishes it beside the artifact under its own licenses (Mozilla Public
License 2.0 for Pyodide; NumPy, Matplotlib and their dependencies under their
own terms). Source project: https://github.com/pyodide/pyodide
