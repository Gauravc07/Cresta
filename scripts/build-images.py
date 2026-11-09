"""
Build the site's photography from free-licence source photos (Unsplash License:
free for commercial use, no attribution required — credits kept in public/img/CREDITS.md).

    python scripts/build-images.py <folder-of-source-jpgs>

Each source is named <unsplash-id>.jpg. For every entry in PHOTOS this writes
public/img/<dest>.webp (HD master) + <dest>-sm.webp (960 px, used on phones),
then regenerates src/data/images.json with intrinsic sizes (prevents layout shift).
Product illustrations (public/img/products/*.svg) are added to the manifest as-is.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
MANIFEST = ROOT / 'src' / 'data' / 'images.json'

# dest (under public/img, no extension) -> (unsplash id, max width, crop aspect w/h or None, focus x 0..1)
PHOTOS = {
    'site/hero-home':      ('AuWDRiprfXg', 2400, None, 0.5),
    'site/hero-night':     ('oVnKC7wiQjA', 2400, 3 / 2, 0.5),
    'site/hero-day':       ('CV-0pykUvew', 2400, None, 0.5),
    'site/about-hero':     ('JsfeReth73A', 2400, None, 0.5),
    'site/construction':   ('uiAIKictyTY', 1800, None, 0.5),
    'site/commercial':     ('xs9r8fPUats', 2000, None, 0.5),
    'site/pool-sunset':    ('L6-yKzsrJzE', 2400, None, 0.5),
    'site/pool-tiles':     ('ZYeYuqT2m0o', 1600, None, 0.5),
    'site/private':        ('AhLzIPJqI-8', 1800, None, 0.5),
    'site/renovation':     ('06wZNnwHQcc', 1600, None, 0.5),
    'site/turnkey':        ('xtfvGngzrO0', 1800, None, 0.5),
    'site/water-features': ('Pzzzv0gymKc', 1400, None, 0.5),
    'site/plant-room':     ('P9igDaOnlJ0', 1800, None, 0.5),
    'site/indoor':         ('NWyPgP3j63s', 2000, None, 0.5),
    'site/indoor-lanes':   ('5ZlxOhxbXHI', 2000, None, 0.5),
    'site/water':          ('vcbAkCXMq3Y', 2400, None, 0.5),
    'site/aerial-resort':  ('ue-jK87TLZk', 1400, None, 0.5),
    'site/vineyard':       ('ndyaPXPYWMs', 2000, None, 0.5),
    'frp/hero':            ('U7riPss-YD0', 2400, None, 0.5),
    'frp/readymade':       ('b99ZXcIUS-Q', 2000, None, 0.5),
    'frp/advantage-01':    ('ymlCgs7bHd0', 1800, 3 / 2, 0.5),
    'frp/advantage-02':    ('k02PWCO-Sao', 1600, 3 / 2, 0.5),
    'frp/advantage-03':    ('-LYwdBEJc6Y', 1600, 3 / 2, 0.5),
    'frp/advantage-04':    ('2sY3c572QXw', 1600, 3 / 2, 0.5),
    'frp/advantage-05':    ('QWs-xsZ0wBs', 1800, 3 / 2, 0.5),
    'products/hero':       ('wzcyEpk2eWw', 2400, None, 0.5),
    'wellness/hero':       ('T4fuKGw1ijM', 2400, None, 0.5),
    'wellness/jacuzzi-1':  ('xX0MKVVhHR4', 1800, None, 0.5),
    'wellness/jacuzzi-2':  ('KFPzb32Cqiw', 1400, 1, 0.5),
    'wellness/sauna':      ('i1wR9DiCABc', 1400, 1, 0.5),
    'wellness/steam':      ('9qYFu1NzpS8', 1400, 1, 0.5),
    'wellness/lounge':     ('FkB2CUuqU_c', 1800, None, 0.5),
    'wellness/adhesive-1': ('GmJ7m4wZ3fU', 1200, 1, 0.5),
    'wellness/adhesive-2': ('ECxMAmw_MJc', 1200, 1, 0.5),
    'wellness/adhesive-3': ('QLrFzHEqFE8', 1200, 1, 0.5),
    'wellness/adhesive-4': ('dujWQFlKE7c', 1200, 1, 0.5),
}
SM = 960


def crop(im, aspect, fx):
    if not aspect:
        return im
    w, h = im.size
    if w / h > aspect:  # too wide
        nw = round(h * aspect)
        x = round((w - nw) * fx)
        return im.crop((x, 0, x + nw, h))
    nh = round(w / aspect)
    y = round((h - nh) / 2)
    return im.crop((0, y, w, y + nh))


def save(im, path, width, quality):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=quality, method=6)
    return im.size


def main(src_dir):
    src_dir = Path(src_dir)
    img_dir = PUBLIC / 'img'
    # Remove every previous raster in public/img (the old photography is not reused).
    for old in img_dir.rglob('*'):
        if old.suffix.lower() in {'.webp', '.jpg', '.jpeg', '.png'}:
            old.unlink()

    manifest = {}
    for dest, (uid, max_w, aspect, fx) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(src_dir / f'{uid}.jpg')).convert('RGB')
        im = crop(im, aspect, fx)
        w, h = save(im, img_dir / f'{dest}.webp', max_w, 74)
        entry = {'w': w, 'h': h}
        if w > SM * 1.2:
            save(im, img_dir / f'{dest}-sm.webp', SM, 70)
            entry['sm'] = SM
        manifest[f'/img/{dest}.webp'] = entry

    for svg in sorted((img_dir / 'products').glob('*.svg')):
        m = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg.read_text(encoding='utf-8'))
        manifest[f'/img/products/{svg.name}'] = {'w': int(m[1]), 'h': int(m[2])}

    for brand in ['cresta-emblem.webp', 'cresta-wordmark.webp', 'cresta-logo-stacked.webp']:
        with Image.open(PUBLIC / 'brand' / brand) as b:
            manifest[f'/brand/{brand}'] = {'w': b.width, 'h': b.height}

    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=1) + '\n', encoding='utf-8')
    total = sum(p.stat().st_size for p in img_dir.rglob('*') if p.is_file())
    print(f'{len(PHOTOS)} photos, {len(manifest)} manifest entries, public/img = {total / 1e6:.1f} MB')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'sources')
