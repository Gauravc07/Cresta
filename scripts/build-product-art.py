"""
Original line-art illustrations for the equipment catalogue (placeholders until
Cresta's own studio photography is ready). Writes public/img/products/<id>.svg.

    python scripts/build-product-art.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public' / 'img' / 'products'
INK, BODY, SHADE, METAL, AZURE = '#2a2c2e', '#f6f5f2', '#dedcd6', '#b8bcc1', '#5e8cff'
SW = 3


def svg(*parts):
    body = '\n'.join(parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" fill="none" stroke="{INK}" '
            f'stroke-width="{SW}" stroke-linecap="round" stroke-linejoin="round">\n'
            f'<ellipse cx="300" cy="532" rx="190" ry="16" fill="{SHADE}" stroke="none" opacity=".7"/>\n{body}\n</svg>\n')


def rect(x, y, w, h, rx=0, fill=BODY, **kw):
    extra = ''.join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{extra}/>'


def ell(cx, cy, rx, ry, fill=BODY, **kw):
    extra = ''.join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{extra}/>'


def path(d, fill='none', **kw):
    extra = ''.join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<path d="{d}" fill="{fill}"{extra}/>'


def lines(*segs, **kw):
    return path(' '.join(f'M{a} {b}L{c} {d}' for a, b, c, d in segs), **kw)


def multiport(cx, top):
    """Six-way valve with handle, seen from the side."""
    return '\n'.join([
        rect(cx - 62, top + 26, 124, 34, 8, fill=SHADE),
        ell(cx, top + 26, 62, 16),
        rect(cx - 14, top - 30, 28, 46, 6, fill=METAL),
        rect(cx - 70, top - 44, 140, 18, 9, fill=INK),
        rect(cx + 62, top + 32, 38, 22, 4, fill=SHADE), rect(cx - 100, top + 32, 38, 22, 4, fill=SHADE),
        ell(cx - 34, top + 6, 10, 10, fill=METAL),
    ])


def tank(cx, top, bottom, r, legs=True):
    parts = [
        rect(cx - r, top, 2 * r, bottom - top, r * 0.7),
        path(f'M{cx - r + 22} {top + 60}Q{cx - r + 14} {(top + bottom) / 2} {cx - r + 22} {bottom - 60}', stroke=METAL, stroke_width=6),
        lines((cx - r, bottom - 90, cx + r, bottom - 90), stroke=SHADE),
        ell(cx + r * 0.42, bottom - 150, 16, 16, fill=SHADE),
        rect(cx + r * 0.42 - 6, bottom - 162, 12, 24, 3, fill=METAL),
    ]
    if legs:
        parts.insert(0, lines((cx - r * 0.7, bottom - 20, cx - r * 0.8, 520), (cx + r * 0.7, bottom - 20, cx + r * 0.8, 520),
                              (cx, bottom - 10, cx, 524), stroke_width=6))
    return '\n'.join(parts)


def motor(x, y, w, h, fins=6):
    parts = [rect(x, y, w, h, 18), rect(x + w - 16, y + 14, 30, h - 28, 10, fill=SHADE)]
    for i in range(1, fins):
        fx = x + 22 + i * (w - 50) / fins
        parts.append(lines((fx, y + 8, fx, y + h - 8), stroke=SHADE, stroke_width=4))
    parts.append(rect(x + w * 0.3, y - 26, w * 0.32, 28, 6, fill=SHADE))
    return '\n'.join(parts)


def basket(cx, top, w, h, flange=False):
    parts = [
        rect(cx - w / 2, top, w, h, 14, fill=AZURE, fill_opacity='.18'),
        rect(cx - w / 2 - 10, top - 18, w + 20, 22, 8, fill=INK),
        lines(*[(cx - w / 2 + 14 + i * (w - 28) / 5, top + 22, cx - w / 2 + 14 + i * (w - 28) / 5, top + h - 18) for i in range(6)],
              stroke=AZURE, stroke_width=2),
        rect(cx - 30, top + h - 4, 60, 40, 6, fill=SHADE),
    ]
    if flange:
        parts.append(rect(cx - w / 2 - 54, top + h * 0.45, 54, 44, 4, fill=SHADE))
        parts.append(rect(cx - w / 2 - 66, top + h * 0.45 - 12, 14, 68, 3, fill=METAL))
    else:
        parts.append(rect(cx - w / 2 - 46, top + h * 0.5, 46, 36, 6, fill=SHADE))
    return '\n'.join(parts)


def base_plate(x, w):
    return rect(x, 470, w, 26, 6, fill=SHADE) + '\n' + rect(x + 20, 496, w - 40, 22, 4, fill=METAL)


ART = {
    # Filtration
    'f-series': svg(tank(300, 150, 470, 120), multiport(300, 130)),
    'b-series': svg(
        lines((170, 420, 160, 520), (430, 420, 440, 520), (300, 440, 300, 524), stroke_width=6),
        rect(90, 250, 420, 190, 95),
        path('M140 300Q300 280 460 300', stroke=METAL, stroke_width=6),
        ell(170, 345, 26, 26, fill=SHADE), ell(430, 345, 26, 26, fill=SHADE),
        rect(276, 200, 48, 56, 6, fill=SHADE), ell(300, 200, 34, 10),
        rect(230, 400, 140, 26, 6, fill=SHADE)),
    'm-series': svg(tank(300, 200, 480, 108, legs=False), rect(200, 470, 200, 50, 10, fill=SHADE), multiport(300, 180)),
    'ms-series': svg(tank(280, 180, 480, 110, legs=False), rect(178, 470, 204, 50, 10, fill=SHADE),
                     rect(390, 250, 40, 34, 6, fill=SHADE), ell(450, 267, 34, 46, fill=SHADE),
                     rect(434, 200, 32, 22, 6, fill=METAL), rect(410, 186, 80, 16, 8, fill=INK)),
    # Pumps
    'mxb-series': svg(base_plate(110, 380), motor(250, 300, 210, 170), basket(185, 300, 120, 130)),
    'mrb-series': svg(base_plate(80, 440), motor(260, 270, 240, 200, fins=8),
                      rect(150, 300, 120, 170, 20, fill=SHADE), ell(210, 300, 60, 16),
                      rect(96, 360, 56, 60, 4, fill=SHADE), rect(84, 346, 14, 88, 3, fill=METAL),
                      rect(178, 230, 64, 56, 6, fill=SHADE), rect(166, 218, 88, 14, 3, fill=METAL)),
    'mtx-series': svg(base_plate(150, 300), motor(270, 340, 160, 130, fins=5), basket(220, 345, 96, 100)),
    # Water treatment
    'salt-chlorinator': svg(
        rect(330, 130, 170, 230, 14), rect(356, 166, 118, 62, 6, fill=INK),
        path('M372 200h20l8-14 10 28 8-14h40', stroke=AZURE, stroke_width=3),
        ell(380, 268, 12, 12, fill=SHADE), ell(415, 268, 12, 12, fill=SHADE), ell(450, 268, 12, 12, fill=AZURE),
        rect(80, 380, 300, 70, 35, fill=AZURE, fill_opacity='.16'),
        lines(*[(120 + i * 34, 392, 120 + i * 34, 438) for i in range(7)], stroke=METAL, stroke_width=4),
        rect(60, 390, 34, 50, 6, fill=SHADE), rect(366, 390, 34, 50, 6, fill=SHADE),
        rect(28, 398, 34, 34, 4, fill=METAL), rect(398, 398, 34, 34, 4, fill=METAL),
        path('M250 380Q250 330 340 330', stroke_width=4)),
    'tablet-feeder': svg(
        rect(210, 170, 180, 320, 30), rect(196, 140, 208, 46, 14, fill=INK),
        rect(210, 300, 180, 130, 0, fill=AZURE, fill_opacity='.15', stroke='none'),
        ell(255, 330, 22, 10, fill=BODY), ell(300, 345, 22, 10, fill=BODY), ell(345, 325, 22, 10, fill=BODY),
        ell(275, 372, 22, 10, fill=BODY), ell(325, 380, 22, 10, fill=BODY),
        rect(130, 440, 80, 36, 6, fill=SHADE), rect(390, 440, 80, 36, 6, fill=SHADE),
        ell(300, 250, 28, 28, fill=SHADE), path('M300 230v20l12 10')),
    'dosingstar': svg(
        rect(330, 360, 150, 160, 18, fill=AZURE, fill_opacity='.14'), rect(360, 340, 90, 26, 6, fill=SHADE),
        lines((340, 420, 470, 420), stroke=AZURE, stroke_width=2),
        rect(120, 190, 190, 230, 18), rect(144, 216, 142, 54, 6, fill=INK),
        path('M160 244h110', stroke=AZURE, stroke_width=3),
        ell(215, 340, 44, 44, fill=SHADE), path('M215 340l22-22', stroke_width=5), ell(215, 340, 8, 8, fill=INK),
        rect(150, 420, 130, 20, 6, fill=SHADE),
        path('M310 300C360 300 380 300 400 340', stroke_width=4)),
    'bp-series': svg(
        rect(150, 230, 300, 200, 24), ell(300, 330, 62, 62, fill=SHADE), ell(300, 330, 30, 30, fill=AZURE, fill_opacity='.25'),
        rect(390, 260, 40, 40, 6, fill=INK), rect(170, 260, 60, 22, 4, fill=INK),
        rect(176, 430, 248, 40, 8, fill=SHADE), rect(110, 312, 40, 36, 6, fill=METAL), rect(450, 312, 40, 36, 6, fill=METAL)),
    'hydrosmart': svg(
        rect(130, 110, 340, 390, 22), rect(162, 146, 276, 150, 10, fill=INK),
        path('M186 250l40-36 34 22 46-58 40 30 44-26', stroke=AZURE, stroke_width=4),
        rect(162, 318, 126, 64, 8, fill=SHADE), rect(312, 318, 126, 64, 8, fill=SHADE),
        path('M182 350h40M332 350h60', stroke_width=4),
        ell(195, 430, 14, 14, fill=AZURE), ell(245, 430, 14, 14, fill=SHADE), ell(295, 430, 14, 14, fill=SHADE),
        rect(380, 414, 58, 32, 6, fill=SHADE)),
    # Cleaning & maintenance
    'pool-vacuum': svg(
        rect(130, 380, 340, 90, 30), ell(170, 478, 28, 28, fill=SHADE), ell(430, 478, 28, 28, fill=SHADE),
        lines(*[(170 + i * 26, 470, 170 + i * 26, 492) for i in range(11)], stroke=METAL, stroke_width=3),
        rect(270, 300, 60, 84, 10, fill=SHADE), path('M300 300L370 120', stroke_width=14, stroke=METAL),
        path('M220 380C200 300 140 300 110 230', stroke_width=12)),
    'ss-vacuum-head': svg(
        rect(90, 390, 420, 70, 10, fill=METAL), rect(90, 380, 420, 20, 4),
        lines(*[(110 + i * 25, 460, 110 + i * 25, 490) for i in range(17)], stroke=INK, stroke_width=2.5),
        ell(130, 470, 20, 20, fill=SHADE), ell(470, 470, 20, 20, fill=SHADE),
        rect(272, 300, 56, 90, 8, fill=SHADE), path('M300 300L360 110', stroke_width=12, stroke=METAL)),
    'aluminium-vacuum-head': svg(
        path('M120 460L170 380H430L480 460Z', fill=METAL), rect(110, 456, 380, 24, 6, fill=SHADE),
        ell(160, 488, 18, 18, fill=BODY), ell(440, 488, 18, 18, fill=BODY), ell(300, 488, 18, 18, fill=BODY),
        rect(272, 300, 56, 84, 8, fill=SHADE), path('M300 300L250 110', stroke_width=12, stroke=METAL)),
    'side-brush-head': svg(
        rect(120, 390, 360, 70, 16, fill=SHADE),
        lines(*[(138 + i * 20, 460, 138 + i * 20, 494) for i in range(17)], stroke=AZURE, stroke_width=3),
        lines(*[(120, 400 + i * 12, 96, 400 + i * 12) for i in range(5)], *[(480, 400 + i * 12, 504, 400 + i * 12) for i in range(5)],
              stroke=AZURE, stroke_width=3),
        rect(272, 304, 56, 90, 8), path('M300 304L380 116', stroke_width=12, stroke=METAL)),
    'algae-brushes': svg(
        path('M110 420Q300 380 490 420L480 452Q300 414 120 452Z', fill=SHADE),
        lines(*[(126 + i * 18, 448 - (abs(i - 10) * -0.6), 126 + i * 18, 492) for i in range(21)], stroke=METAL, stroke_width=3),
        rect(268, 330, 64, 70, 10), path('M300 330L230 120', stroke_width=12, stroke=METAL)),
    'telescopic-poles': svg(
        path('M90 470L470 130', stroke_width=20, stroke=METAL),
        path('M90 470L290 291', stroke_width=26, stroke=SHADE),
        rect(272, 266, 40, 52, 8, fill=INK, transform='rotate(-41.8 292 292)'),
        rect(452, 108, 40, 44, 8, fill=INK, transform='rotate(-41.8 472 130)'),
        ell(84, 476, 16, 16, fill=INK)),
    'pool-hose': svg(
        ell(300, 330, 190, 150, fill='none', stroke_width=26, stroke=AZURE, stroke_opacity='.35'),
        ell(300, 330, 150, 112, fill='none', stroke_width=26, stroke=AZURE, stroke_opacity='.35'),
        ell(300, 330, 110, 76, fill='none', stroke_width=26, stroke=AZURE, stroke_opacity='.35'),
        ell(300, 330, 190, 150, fill='none'), ell(300, 330, 110, 76, fill='none'),
        path('M490 330C520 420 470 470 420 500', stroke_width=26, stroke=SHADE),
        rect(396, 486, 48, 34, 6, fill=INK)),
    # Ladders & fittings
    'ss-ladders': svg(
        path('M170 520V250C170 160 230 130 270 130S350 170 350 230', stroke_width=16, stroke=METAL),
        path('M290 520V250C290 160 350 130 390 130S470 170 470 230', stroke_width=16, stroke=METAL),
        rect(150, 300, 160, 24, 6, fill=SHADE), rect(150, 380, 160, 24, 6, fill=SHADE), rect(150, 460, 160, 24, 6, fill=SHADE),
        lines((350, 230, 350, 276), (470, 230, 470, 276), stroke_width=16, stroke=METAL),
        rect(332, 274, 36, 16, 4, fill=INK), rect(452, 274, 36, 16, 4, fill=INK)),
    'plastic-fittings': svg(
        path('M100 380H226Q254 380 254 408V520H206V428H100Z', fill=BODY),
        rect(84, 372, 40, 64, 6, fill=SHADE), rect(198, 498, 64, 36, 6, fill=SHADE),
        rect(320, 360, 200, 52, 8), rect(394, 412, 52, 110, 8), rect(380, 500, 80, 30, 6, fill=SHADE),
        rect(300, 352, 36, 68, 6, fill=SHADE), rect(504, 352, 36, 68, 6, fill=SHADE),
        rect(230, 170, 140, 52, 26, fill=SHADE), rect(214, 160, 36, 72, 8), rect(350, 160, 36, 72, 8),
        ell(150, 230, 46, 46), ell(150, 230, 24, 24, fill=SHADE)),
    'pool-accessories': svg(
        rect(110, 300, 380, 210, 16, fill=SHADE), rect(110, 280, 380, 40, 10),
        rect(160, 180, 54, 250, 22, fill=AZURE, fill_opacity='.25'), rect(160, 340, 54, 90, 0, fill='#f2d14b', fill_opacity='.6', stroke='none'),
        rect(160, 180, 54, 250, 22), rect(152, 160, 70, 30, 8, fill=INK),
        rect(250, 180, 54, 250, 22, fill=AZURE, fill_opacity='.25'), rect(250, 330, 54, 100, 0, fill='#e2667a', fill_opacity='.5', stroke='none'),
        rect(250, 180, 54, 250, 22), rect(242, 160, 70, 30, 8, fill=INK),
        rect(350, 220, 100, 200, 10), lines((370, 260, 430, 260), (370, 290, 430, 290), (370, 320, 430, 320)),
        ell(380, 370, 12, 12, fill='#f2d14b'), ell(420, 370, 12, 12, fill='#e2667a')),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, art in ART.items():
        (OUT / f'{name}.svg').write_text(art, encoding='utf-8')
    print(f'{len(ART)} illustrations written to {OUT}')


if __name__ == '__main__':
    main()
