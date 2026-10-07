#!/usr/bin/env python3
"""Generates the grip catalog seed SQL (inserts for grip_line and grip_size).

The catalog is platform data maintained by us. Sources: VISE's 2026 order
form, Turbo's finger insert chart and product pages, JoPo's order lists
(docs/data-model.md, "Grip catalog"). Run it and paste the output into the
migration that changes the catalog:

    python3 db/seed/grip_catalog.py > /tmp/grip_catalog.sql

With --json it writes the same catalog as the API returns it, for the
frontend's mock data (src/data/mockGripCatalog.json):

    python3 db/seed/grip_catalog.py --json > src/data/mockGripCatalog.json
"""
import json
import sys
from fractions import Fraction

TEN = ['Black', 'White', 'Ice/Clear', 'Yellow', 'Red', 'Blue', 'Green', 'Orange', 'Purple', 'Pink']
JOPO = ['Black', 'Blue', 'Green', 'Orange', 'Pink', 'Purple', 'Red', 'White', 'Yellow']
VISE_PO = ['Yellow', 'White', 'Black', 'Clear', 'Neon', 'Green', 'Orange', 'Blue', 'Purple', 'Pink', 'Red', 'Grape']
VISE_PS = [c for c in VISE_PO if c != 'Grape']
VISE_78_PO = ['Yellow', 'White', 'Black', 'Green', 'Orange', 'Blue', 'Purple', 'Pink', 'Red']
VISE_78_PS = ['Yellow', 'White', 'Black', 'Clear', 'Green', 'Orange', 'Pink']
VISE_SLUG = ['Yellow', 'White', 'Black', 'Green', 'Orange', 'Blue', 'Purple', 'Pink', 'Red']
VISE_EASY = ['Yellow', 'White', 'Black', 'Neon', 'Green', 'Orange', 'Blue', 'Purple', 'Pink', 'Red', 'Grape', 'Clear']
VISE_DUAL = ['White/Black', 'Green/Orange', 'Yellow/Grape', 'Neon/Red', 'Pink/Blue']
TURBO_SOLID = ['Black/White', 'Orange/Yellow', 'Blue/Purple', 'Green/Red', 'Pink/White', 'White', 'Black']
SWITCH = ['Black', 'Orange', 'Yellow', 'Green', 'Blue', 'Red', 'Pink', 'Purple']


def fraction(size64: int) -> str:
    whole, part = divmod(size64, 64)
    f = Fraction(part, 64)
    text = f'{f.numerator}/{f.denominator}' if part else ''
    if whole and text:
        return f'{whole}-{text}'
    return text or str(whole)


def size_number(size64: int) -> str:
    """The VISE/Turbo size number: size n = (36 + 2n)/64."""
    n = Fraction(size64 - 36, 2)
    return str(int(n)) if n.denominator == 1 else str(float(n))


def finger_od(size64: int) -> int:
    """Standard finger inserts: 31/32 up to 13/16, 1-1/32 above."""
    return 62 if size64 <= 52 else 66


# VISE thumb insert labels: "51" = 51/64, "13" = 13/16, "1/6" = 1-1/64, "3/3" = 1-3/32 ...
def vise_thumb_label(size64: int) -> str:
    if size64 < 64:
        f = Fraction(size64, 64)
        return str(f.numerator)
    f = Fraction(size64 - 64, 64)
    return '1' if size64 == 64 else f'{f.numerator}/{str(f.denominator)[0]}'


lines = []  # (manufacturer, name, kind, colors, styles, [(size64, label, od_choices, collar)])


def line(manufacturer, name, kind, colors, sizes, styles=()):
    """styles: the ways the insert can be installed (a two-way insert has two), chosen on the drill sheet."""
    lines.append((manufacturer, name, kind, colors, list(styles), sizes))


def standard(sizes, label=size_number, od=finger_od):
    return [(s, label(s), [od(s)], False) for s in sizes]


# ---------- VISE ----------
vise_std = list(range(36, 59))                                   # 0 .. 11, every half size
line('VISE', 'P/O Power Lift & Oval', 'FINGER_INSERT', VISE_PO, standard(vise_std), ['Power Lift', 'Oval'])
line('VISE', 'P/S Power Lift & Semi', 'FINGER_INSERT', VISE_PS, standard(vise_std), ['Power Lift', 'Semi'])
line('VISE', 'O/PO Oval & Power Lift Oval', 'FINGER_INSERT', VISE_PS, standard(vise_std), ['Oval', 'Power Lift Oval'])
line('VISE', 'P/O 7/8″ O.D.', 'FINGER_INSERT', VISE_78_PO, standard(range(34, 49, 2), od=lambda s: 56), ['Power Lift', 'Oval'])   # -1 .. 6, whole sizes
line('VISE', 'P/S 7/8″ O.D.', 'FINGER_INSERT', VISE_78_PS, standard(range(34, 50), od=lambda s: 56), ['Power Lift', 'Semi'])     # -1 .. 6.5
line('VISE', 'O/PO 7/8″ O.D.', 'FINGER_INSERT', VISE_78_PS, standard(range(34, 50), od=lambda s: 56), ['Oval', 'Power Lift Oval'])
line('VISE', 'Vinyl Oval with Nubs', 'FINGER_INSERT', ['Grape'], standard(range(37, 59)))                # 0.5 .. 11
for style in ['Round with Nubs', 'Oval with Nubs', 'Power Lift', 'Smooth Oval', 'Semi Grip']:
    line('VISE', f'Blue Silicone {style}', 'FINGER_INSERT', ['Blue'], standard(range(36, 59, 2)), [style])       # 0 .. 11, whole sizes
line('VISE', 'Urethane Finger Slugs', 'FINGER_SLUG', ['Black'], [(s, fraction(s), [s], False) for s in (62, 72, 80)])
for name in ['Pro V2 Vinyl Oval Thumb', 'Tapered Vinyl Oval Thumb', 'Tapered Vinyl Round Thumb']:
    line('VISE', name, 'THUMB_INSERT', ['White', 'Black'],
         [(s, vise_thumb_label(s), [72 if s < 64 else 80], False) for s in range(51, 72)])              # 51/64 .. 1-7/64
line('VISE', 'Vinyl Thumb Slugs', 'THUMB_SLUG', VISE_SLUG, [(s, fraction(s), [s], False) for s in (72, 80, 88)])
line('VISE', 'Easy Urethane Thumb Slugs', 'THUMB_SLUG', VISE_EASY, [(s, fraction(s), [s], False) for s in (72, 80, 88, 96)])
line('VISE', 'Dual Easy Urethane Thumb Slugs', 'THUMB_SLUG', VISE_DUAL, [(s, fraction(s), [s], False) for s in (72, 80, 88)])
# IT: each slug size has its own collar bit, 1/16" larger.
line('VISE', 'IT Interchangeable Thumb', 'INTERCHANGEABLE_THUMB', VISE_EASY + ['Black XL'],
     [(s, fraction(s), [s + 4], True) for s in (72, 80, 88, 96)])

# ---------- Turbo ----------
turbo_std = list(range(38, 53)) + [53, 54, 56, 58]                 # 1 .. 8, then 8.5, 9, 10, 11
# Quad (the name: 4 ways): each side is half smooth, half mesh, and each half installs on its own.
# The Power Oval's mesh half is rarely used, so it's listed last.
QUAD_STYLES = ['Perfect Oval Smooth', 'Perfect Oval Mesh', 'Power Oval', 'Power Oval Mesh']
line('TURBO', 'Quad', 'FINGER_INSERT', TEN, standard(turbo_std), QUAD_STYLES)
line('TURBO', 'Classic', 'FINGER_INSERT', TEN, standard(turbo_std), ['Perfect Oval', 'Power Lift 1/4″'])
line('TURBO', 'Classic Pro', 'FINGER_INSERT', ['Black', 'Blue'], standard(turbo_std), ['Perfect Oval', 'Power Lift 1/4″'])
line('TURBO', 'Quad 2', 'FINGER_INSERT', ['Black', 'Ice/Clear'], standard(turbo_std), ['Power Nub', 'Semi-Super Bump'])
line('TURBO', 'Power-SB', 'FINGER_INSERT', ['Black', 'Ice/Clear'], standard(turbo_std), ['Power Lift 1/4″', 'Semi-Super Bump'])
line('TURBO', 'Ms. Quad', 'FINGER_INSERT', ['Black', 'White', 'Ice/Clear', 'Yellow', 'Pink'],
     standard(range(34, 49), od=lambda s: 56), QUAD_STYLES)                                             # -1 .. 6
line('TURBO', 'Urethane Finger Solids', 'FINGER_SLUG', ['Black'], [(s, fraction(s), [s], False) for s in (62, 72)])
for style in ['Round', 'Oval']:
    line('TURBO', f'Xcel Thumb {style}', 'THUMB_INSERT', ['Black'],
         [(s, fraction(s), [72], False) for s in range(51, 62)] + [(s, fraction(s), [80], False) for s in range(62, 69)])
line('TURBO', 'Urethane Thumb Solids', 'THUMB_SLUG', TURBO_SOLID, [(s, fraction(s), [s], False) for s in (72, 80, 88, 96)])
line('TURBO', 'Switch Grip', 'INTERCHANGEABLE_THUMB', SWITCH, [(96, 'Outer sleeve', [96], True)])
line('TURBO', 'Switch Grip NX', 'INTERCHANGEABLE_THUMB', ['Black', 'Red'], [(96, 'Outer sleeve', [96], True)])

# ---------- JoPo ----------
line('JOPO', 'Power Flat / Oval', 'FINGER_INSERT', JOPO, standard(range(38, 53), label=fraction), ['Power Flat', 'Oval'])     # 19/32 .. 13/16
line('JOPO', 'Oval / Oval Dots', 'FINGER_INSERT', JOPO, standard(range(38, 53), label=fraction), ['Oval', 'Oval Dots'])
line('JOPO', 'Thumb Slugs', 'THUMB_SLUG', JOPO, [(s, fraction(s), [s], False) for s in (72, 80, 88, 96)])
line('JOPO', 'Twist', 'INTERCHANGEABLE_THUMB', JOPO + ['Twisted'], [(96, 'Outer', [96], True)])


if '--json' in sys.argv:
    import uuid
    mock_id = lambda *parts: str(uuid.uuid5(uuid.NAMESPACE_URL, 'drilld-mock-grip/' + '/'.join(map(str, parts))))
    catalog = [{
        'id': mock_id(manufacturer, name),
        'manufacturer': manufacturer, 'name': name, 'kind': kind, 'colors': colors, 'installStyles': styles,
        'sizes': [{'id': mock_id(manufacturer, name, s), 'size64': s, 'label': label, 'od64Choices': od, 'collar': collar}
                  for s, label, od, collar in sizes]
    } for manufacturer, name, kind, colors, styles, sizes in lines]
    catalog.sort(key=lambda line: (line['manufacturer'], line['name']))
    print(json.dumps(catalog, ensure_ascii=False, indent=1))
    sys.exit(0)


def q(text: str) -> str:
    return "'" + text.replace("'", "''") + "'"


def array_text(items) -> str:
    return 'array[' + ', '.join(q(i) for i in items) + ']::text[]' if items else "'{}'::text[]"


out = []
for manufacturer, name, kind, colors, styles, sizes in lines:
    out.append(f"insert into grip_line (manufacturer, name, kind, colors, install_styles) values ({q(manufacturer)}, {q(name)}, {q(kind)}, {array_text(colors)}, {array_text(styles)});")
    values = ',\n    '.join(
        f"({s}, {q(label)}, array[{', '.join(map(str, od))}]::smallint[], {'true' if collar else 'false'})"
        for s, label, od, collar in sizes)
    out.append(
        "insert into grip_size (line_id, size64, label, od64_choices, collar)\n"
        f"select l.id, v.size64, v.label, v.od64_choices, v.collar\n"
        f"from grip_line l, (values\n    {values}\n) as v(size64, label, od64_choices, collar)\n"
        f"where l.manufacturer = {q(manufacturer)} and l.name = {q(name)};")
print('\n\n'.join(out))
