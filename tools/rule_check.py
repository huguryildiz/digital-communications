#!/usr/bin/env python3
"""R8: fail on any banned provenance phrase, on any figure label that is
mathematics written as something other than LaTeX (R7), and on prose that a
second-year reader cannot take in one read (R10)."""
import re, sys, glob, os
# The list is matched case-insensitively, so a phrase opening a sentence is
# caught as readily as one inside it. Write each pattern in lower case.
# Two patterns are narrower here than in the course this list came from, and
# both for the same reason: the words mean something technical in a
# communications course and banning them outright bans the subject.
#
# "source" is the origin of the information — a discrete memoryless source, a
# Gaussian source, the source coding theorem. What R2 forbids is naming the
# material this artifact was written from, so the pattern now matches only that
# sense: the source *document*, or a claim made about what "the source" says.
#
# "PDF" is a probability density function on every page of this course. What R2
# forbids is naming a file, so the pattern now needs the file sense: a .pdf
# extension, or the word "file" or "document" beside it. A gate that fires on
# the abbreviation would be turned off within a module, and a gate that is
# turned off checks nothing.
#
# Two more were narrowed for the same reason once Module 6 was written. "the
# source" is the thing that emits symbols — an entropy is computed *from the
# source*, so only the two prepositions that can carry a claim about a document
# are kept. "ambiguity" is what a code has when it cannot be decoded uniquely,
# so only the provenance phrases are banned and the technical word is free.
BANNED = [
 r'\.pdf\b', r'\bpdf (?:file|document|page)\b', r'in this file', r'this document', r'the document shows',
 r'source notes', r'the source (?:material|document|text|file|notes|slides?|pages?)\b',
 r'(?:per|according to) the source\b', r'the source (?:says|states|shows|gives)\b',
 r'original notes', r'the lecture notes (state|say|show)',
 r'uploaded document', r'provided material', r'\bredrawn\b',
 r'reconstructed from', r'based on the original', r'verified against',
 # "Check:" and "Cross-check:" are legitimate steps of a worked example (R7).
 # Only the provenance sense is banned, which is the one that names a source.
 r'cross-check\w*\s+(?:against|with)\b',
 r'the audit', r'editorial enhancement', r'\(source\)', r'\bprovenance\b', r'editorially developed',
 r'\bambiguit(?:y|ies)\s+(?:ledger|in the (?:source|material|notes|slides))\b',
 r'\bledger\b', r'phase 1\b', r'phase 2\b', r'\bv0\.9\b',
 # A page reference is provenance wherever a student can read it: "p. 15",
 # "pp. 6-7", "page 15", "pages 6 and 7".
 r'\bpp?\.\s*\d', r'\bpages?\s+\d',
 # The course code and the name of the course this engine came from are both
 # off every page. Neither is anything a student needs, and either one ties
 # this material to something outside it. Comments are exempt already, so a
 # note to whoever is building this can still say what it means.
 r'\bee ?413\b', r'\bsignals[- ]and[- ]systems\b',
]
# strings that are legitimately instructor-only or internal are marked with these markers
EXEMPT_MARKERS = ['data-instr', "t:'instr'", 'instr-panel', 'INSTRUCTOR-ONLY']

SRC_FIELD = re.compile(r"""\bsrc\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")""")

def strip_exempt(line, in_block):
    """Blank out what R3 puts outside the student view, so the sweep reads only
       what a student can read. Two things are exempt, by what they are rather
       than by where they sit: the src: field of a scene, a question or a
       laboratory item, which is the traceability record itself, and any
       comment, which never reaches the artifact. A block comment is tracked
       across lines, because its interior carries no marker of its own."""
    out, i, n = [], 0, len(line)
    while i < n:
        if in_block:
            j = line.find('*/', i)
            if j < 0: return ''.join(out), True
            i, in_block = j + 2, False
            continue
        b = line.find('/*', i)
        # a // that follows a colon is a URL scheme, not a comment
        s = i
        while True:
            s = line.find('//', s)
            if s > 0 and line[s-1] == ':': s += 2; continue
            break
        if b >= 0 and (s < 0 or b < s):
            out.append(line[i:b]); i, in_block = b + 2, True
            continue
        if s >= 0:
            out.append(line[i:s]); return ''.join(out), False
        out.append(line[i:]); break
    return ''.join(out), in_block

def scan(path):
    hits, in_block = [], False
    for i, raw in enumerate(open(path, encoding='utf-8'), 1):
        line, in_block = strip_exempt(SRC_FIELD.sub('src:', raw), in_block)
        if any(m in line for m in EXEMPT_MARKERS): continue
        for b in BANNED:
            if re.search(b, line, re.I):
                hits.append((i, b, raw.strip()[:110]))
                break
    return hits

# ---------------------------------------------------------------------------
# R7 figure labels. Every piece of mathematics drawn inside a figure is TeX,
# typeset by texName. The four ways a label reaches a figure are note(), span(),
# an axis name, and a label on a box, an arrow or a free text item in blocks().
# ---------------------------------------------------------------------------
STR = r"'((?:[^'\\]|\\.)*)'"          # one single-quoted JavaScript string
ARG = r"[^,]+,\s*"
LABEL_SITES = [
 ('note',   re.compile(r'\.note\(\s*' + ARG*2 + STR)),
 ('span',   re.compile(r'\.span\(\s*' + ARG*3 + STR)),
 ('xlabel', re.compile(r'xlabel\s*:\s*' + STR)),
 ('ylabel', re.compile(r'ylabel\s*:\s*' + STR)),
 ('block',  re.compile(r"t:'(?:box|text|arrow)'[^\n]*?\blabel\s*:\s*" + STR)),
]
# An axis name is TeX by contract (§7.3); the other three carry tex:true.
ALWAYS_TEX = ('xlabel', 'ylabel')
# Mathematics has no business being spelled with these.
UNICODE_MATH = ('∞', '²', '³', '⁴', 'ⁿ', '₀', '₁', '₂', '₃', 'ₙ', '½', '¼',
                'Σ', 'Π', '∫', '∂', '∇', '√', '−', '±', '×', '÷', '·',
                '≤', '≥', '≈', '≠', '≡', '∝', '⇒', '⇔', '→', '←', '↔', '↦',
                '∈', '∀', '∃', '∞', 'Δ', 'Ω', 'α', 'β', 'γ', 'δ', 'ε', 'θ',
                'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'χ', 'ψ', 'ω', 'ˆ', '‖')
# A label stays plain sans-serif only while it is words. These are the marks that
# make it mathematics instead: a function or sequence argument, a relation, a TeX
# token, or a bare symbol standing for a signal or an operator. Ordinary prose
# punctuation is not on the list, so "PATH 1 — combine, then process" and
# "equal?" stay plain, while "x(t)", "T=8", "Ev{x}" and "S" do not.
IS_MATH = re.compile(r'[A-Za-z][\(\[]|[=<>]|[\\^_{}]|^[A-Za-z]$')

def tex_flagged(line, at):
    """tex:true belongs to the option object that follows the label."""
    return 'tex:true' in line[at:] or 'tex: true' in line[at:]

def backslash_runs_odd(s):
    """A TeX backslash survives a JavaScript string only when it is doubled.
       '\\;' is the string ';' and '\\text' is a tab, so an odd run is a lost escape.
       An odd run is legitimate only when it escapes a quote. No figure label
       carries a newline escape, so a lone backslash before n is a lost one too."""
    for m in re.finditer(r'\\+', s):
        if len(m.group()) % 2 == 0: continue
        if s[m.end():m.end()+1] in ("'", '"'): continue
        return True
    return False

def figure_labels(path):
    hits=[]
    for i, line in enumerate(open(path, encoding='utf-8'), 1):
        for kind, rx in LABEL_SITES:
            for m in rx.finditer(line):
                lab = m.group(1)
                if not lab: continue
                is_tex = kind in ALWAYS_TEX or tex_flagged(line, m.end())
                def bad(why): hits.append((i, f'{kind}/{why}', lab[:80]))
                for u in UNICODE_MATH:
                    if u in lab:
                        bad(f'unicode {u!r} — write it as LaTeX'); break
                if not is_tex:
                    if IS_MATH.search(lab):
                        bad('mathematics without tex:true')
                    continue
                if backslash_runs_odd(lab):
                    bad('lost backslash — a TeX macro needs \\\\ in a JS string')
                # A semicolon inside a parenthesised group is notation rather
                # than a lost thin space: I(X;Y) is the mutual information, and
                # module 6 writes it that way on every axis it appears on. The
                # groups are blanked out — keeping the positions, so the offset
                # test below is unaffected — and a genuinely lost \\; outside
                # the brackets is still caught.
                scan = re.sub(r'\(([^()]*)\)',
                              lambda m: '(' + ' ' * len(m.group(1)) + ')', lab)
                for s in re.finditer(r';', scan):
                    if not re.search(r'\\\\;$', lab[:s.end()]):
                        bad('bare ";" — a lost \\\\; thin space')
                        break
    return hits

# ---------------------------------------------------------------------------
# The textbook anchor. This course's chapter numbers and the textbook's do not
# agree, and in one place they disagree dangerously: this course reaches
# information theory in its chapter 10, and the textbook's chapter 10 is about
# transmission through bandlimited channels. A reader who follows a bare "CH10"
# into the book lands somewhere unrelated. So an anchor never reaches a reader
# as a bare address.
#
# Two shapes are wrong. A section mark of any kind is wrong outright: the
# artifact draws an open book instead and the notes spell `PS`, so a `§` on the
# page is left over from neither. A `CH` followed by a digit is wrong unless the
# `PS` marker stands in front of it, because this course numbers its own
# chapters the same way. Both render without complaint and read as this course's
# own address — the same class of damage as a lost backslash: silent, and wrong.
#
# One line is exempt by name: the sentence that introduces the convention has to
# show the reader the form it is describing.
# ---------------------------------------------------------------------------
MARK    = re.compile(r'(?:§|&sect;)')
CHREF   = re.compile(r'\bCH\s?\d')
ANCHOR_EXEMPT = 'such as <b>PS CH'

def bare_section_marks(path):
    hits, in_block = [], False
    for i, raw in enumerate(open(path, encoding='utf-8'), 1):
        line, in_block = strip_exempt(SRC_FIELD.sub('src:', raw), in_block)
        if ANCHOR_EXEMPT in line: continue
        if MARK.search(line):
            hits.append((i, 'section mark — the anchor is a book and "CH x.y"', raw.strip()[:110]))
            continue
        for m in CHREF.finditer(line):
            if not re.search(r'\bPS\b(?:</b>)?\s*$', line[:m.start()]):
                hits.append((i, 'textbook reference without its "PS" marker', raw.strip()[:110]))
                break
    return hits

# ---------------------------------------------------------------------------
# R10 prose. The material is written for a second-year undergraduate who may be
# reading in a second language, so the sentence is the unit that has to stay
# small. Three things are measured, and all three are mechanical:
#
#   1. A student-visible sentence carries at most MAX_WORDS words. Mathematics
#      inside $...$ counts as one word, because a formula is read as one object
#      and not as its tokens.
#   2. A heading names its topic and nothing else. "Uniform quantization",
#      "MAP rule", "Common error" pass; "What this really means", "Why this
#      matters", "The one reason" do not. A heading that opens with an
#      interrogative or a narrator's phrase is telling the reader what to feel
#      about the material instead of naming it.
#   3. No semicolon. A semicolon joins two independent clauses, and two
#      independent clauses are two sentences.
#
# None of the three can be satisfied by accident, and none of them needs a
# human to judge it, which is the point: the voice drifted once already.
# ---------------------------------------------------------------------------
MAX_WORDS = 25

# The fields a student reads. `keywords` is a word bag, `src`, `id`, `nav`,
# `go` and `k` are machinery, and none of the five is prose.
PROSE_SKIP = re.compile(r"\b(?:keywords|id|src|go|k|kind|color|dash|anchor|"
                        r"nav|ratio|tex|label|font|align)\s*:\s*$")
HEAD_FIELD = re.compile(r"\b(?:head|hd)\s*:\s*" + STR)
TITLE_FIELD = re.compile(r"\btitle\s*:\s*" + STR)

# A heading that opens with any of these is narrating rather than naming.
NARRATOR_OPEN = re.compile(
    r'^\s*(?:what|why|where|when|which|how|and\b|that\b|if\b|so\b|'
    r'the (?:one|whole|first|real|sentence|point|rule|thing|idea|move|price)\b)',
    re.I)
# ...and any heading carrying one of these is narrating wherever it sits.
NARRATOR_IN = re.compile(
    r'\b(?:really means|worth (?:remembering|carrying|the trouble|writing)|'
    r'keeps returning|survives the term|in one sentence|to take away|'
    r'matters more than|is the interesting part|bother)\b', re.I)

def prose_of(s):
    """The words a reader sees. Mathematics is one word (a formula is read as
       one object), an HTML tag is nothing, and an entity is its character."""
    s = re.sub(r'\$[^$]*\$', ' MATH ', s)
    s = re.sub(r'<[^>]*>', ' ', s)
    s = (s.replace('&mdash;', '—').replace('&ndash;', '–')
          .replace('&nbsp;', ' ').replace('&amp;', '&')
          .replace('&lt;', '<').replace('&gt;', '>'))
    s = s.replace("\\'", "'").replace('\\\\', '\\')
    return re.sub(r'\s+', ' ', s).strip()

def sentences(s):
    """Split on end punctuation that is followed by a new sentence. A decimal
       point and an abbreviation both fail the test, because neither is
       followed by a space and a capital."""
    return [x for x in re.split(r'(?<=[.!?:])\s+(?=[A-Z“"(])', s) if x.strip()]

def words(s):
    return [w for w in re.split(r'\s+', s) if re.search(r'[A-Za-z0-9]', w)]

def prose_hits(path):
    hits, in_block = [], False
    for i, raw in enumerate(open(path, encoding='utf-8'), 1):
        line, in_block = strip_exempt(SRC_FIELD.sub('src:', raw), in_block)
        if not line.strip(): continue
        if any(m in line for m in EXEMPT_MARKERS): continue

        for rx, what in ((HEAD_FIELD, 'head'), (TITLE_FIELD, 'title')):
            for m in rx.finditer(line):
                h = prose_of(m.group(1))
                if not h: continue
                if NARRATOR_OPEN.search(h) or NARRATOR_IN.search(h):
                    hits.append((i, f'{what} narrates instead of naming its topic', h[:80]))

        if 'keywords' in line: continue
        for m in re.finditer(STR, line):
            s = m.group(1)
            if len(s) < 45 or ' ' not in s: continue
            if PROSE_SKIP.search(line[:m.start()]): continue
            text = prose_of(s)
            if len(words(text)) < 6: continue
            # A semicolon that separates the items of a list is punctuation.
            # One that joins two independent clauses is a sentence boundary
            # written with the wrong mark, and only that one is a violation.
            for seg in text.split(';')[1:]:
                if len(words(seg)) >= 5:
                    hits.append((i, 'semicolon joining two clauses — write two sentences', text[:80]))
                    break
            for snt in sentences(text):
                n = len(words(snt))
                if n > MAX_WORDS:
                    hits.append((i, f'{n}-word sentence (limit {MAX_WORDS})', snt[:96]))
    return hits

targets = sys.argv[1:] or []
bad = 0
for t in targets:
    for f in (glob.glob(t) if any(c in t for c in '*?') else [t]):
        if not os.path.isfile(f): continue
        m = bare_section_marks(f)
        if m:
            bad += len(m)
            print(f'\n{f}: {len(m)} anchor hit(s)')
            for i, why, s in m[:40]: print(f'  L{i:<5} {why:<46}  {s}')
        h = scan(f)
        if h:
            bad += len(h)
            print(f'\n{f}: {len(h)} hit(s)')
            for i, b, s in h[:40]: print(f'  L{i:<5} /{b}/  {s}')
        g = figure_labels(f)
        if g:
            bad += len(g)
            print(f'\n{f}: {len(g)} figure-label hit(s)')
            for i, why, s in g[:40]: print(f'  L{i:<5} {why:<46}  {s}')
        p = prose_hits(f)
        if p:
            bad += len(p)
            print(f'\n{f}: {len(p)} prose hit(s)')
            for i, why, s in p[:40]: print(f'  L{i:<5} {why:<46}  {s}')
print(f'\nTOTAL VIOLATIONS: {bad}')
sys.exit(1 if bad else 0)
