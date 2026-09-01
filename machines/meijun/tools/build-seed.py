#!/usr/bin/env python3
"""Turn a Taste of Home backup file into the project's built-in content.

Usage:  python3 tools/build-seed.py <backup.json> [--order "Orh,Fried,Hainanese,Tang"]

--order takes a comma-separated list of dish-name beginnings and puts the
recipes in that sequence. Without it, the order saved in the backup is kept.

Reads a backup exported with the site's "Back up" button and rewrites
./media/ and ./recipes-seed.js so the recipes, their order, their photos,
videos, voice recordings and the glossary all ship inside the project folder.
Photos are resized to 1600px JPEGs so the folder stays small enough to zip;
video and audio are copied through untouched, so keep an eye on their size.
"""

import base64
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_DIR = os.path.join(ROOT, 'media')
THUMB_DIR = os.path.join(MEDIA_DIR, 'thumbs')
SEED_FILE = os.path.join(ROOT, 'recipes-seed.js')

IMAGE_EXT = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/heic': 'heic', 'image/webp': 'webp'}
VIDEO_EXT = {'video/quicktime': 'mov', 'video/mp4': 'mp4', 'video/webm': 'webm'}
AUDIO_EXT = {
    'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/mpeg': 'mp3',
    'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/webm': 'webm', 'audio/ogg': 'ogg',
}


def make_poster(video_path, out_name):
    """Grab a still from a video with Quick Look, so cards have something to show."""
    tmp_dir = os.path.join(MEDIA_DIR, '.posters')
    os.makedirs(tmp_dir, exist_ok=True)
    try:
        subprocess.run(['qlmanage', '-t', '-s', '1200', '-o', tmp_dir, video_path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shot = os.path.join(tmp_dir, os.path.basename(video_path) + '.png')
        if not os.path.exists(shot):
            return None
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
                        '-Z', '960', shot, '--out', os.path.join(MEDIA_DIR, out_name)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return out_name
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:24].strip('-')


def main():
    args = sys.argv[1:]
    order_names = None
    if '--order' in args:
        at = args.index('--order')
        order_names = [n.strip() for n in args[at + 1].split(',') if n.strip()]
        del args[at:at + 2]

    if len(args) != 1:
        sys.exit('Usage: python3 tools/build-seed.py <backup.json> [--order "A,B,C"]')

    backup_path = os.path.expanduser(args[0])
    with open(backup_path) as f:
        data = json.load(f)

    if data.get('app') != 'tasteOfHome':
        sys.exit('That file does not look like a Taste of Home backup.')

    # Start from a clean media folder so deleted photos don't linger in the zip.
    if os.path.isdir(MEDIA_DIR):
        shutil.rmtree(MEDIA_DIR)
    os.makedirs(MEDIA_DIR)
    os.makedirs(THUMB_DIR)

    recipes = sorted(data['recipes'], key=lambda r: r.get('order', 0))

    if order_names:
        chosen = []
        for name in order_names:
            match = next((r for r in recipes if r['nameEn'].lower().startswith(name.lower())), None)
            if match is None:
                sys.exit(f'No recipe starts with "{name}".')
            chosen.append(match)
        # Anything not named keeps its place at the end.
        recipes = chosen + [r for r in recipes if r not in chosen]
    out = []

    for position, recipe in enumerate(recipes):
        name = slug(recipe['nameEn'])
        media_out = []

        for index, item in enumerate(recipe.get('media', []), 1):
            poster = None
            header, encoded = item['dataUrl'].split(',', 1)
            mime = header[5:].split(';')[0]
            raw_ext = IMAGE_EXT.get(mime) or VIDEO_EXT.get(mime) or AUDIO_EXT.get(mime) or 'bin'
            raw_path = os.path.join(MEDIA_DIR, f'raw-{name}-{index}.{raw_ext}')
            with open(raw_path, 'wb') as f:
                f.write(base64.b64decode(encoded))

            # Only photos get resized; video and audio are copied through as they are.
            if mime in VIDEO_EXT or mime in AUDIO_EXT:
                final_name = f'{name}-{index}.{raw_ext}'
                final_path = os.path.join(MEDIA_DIR, final_name)
                os.rename(raw_path, final_path)
                if mime in VIDEO_EXT:
                    poster = make_poster(final_path, f'{name}-{index}-poster.jpg')
            else:
                final_name = f'{name}-{index}.jpg'
                subprocess.run(
                    ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80',
                     '-Z', '1600', raw_path, '--out', os.path.join(MEDIA_DIR, final_name)],
                    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                os.remove(raw_path)
                thumb_name = f'{name}-{index}.webp'
                thumb_source = os.path.join(MEDIA_DIR, f'.thumb-{name}-{index}.jpg')
                subprocess.run(
                    ['sips', '-Z', '480', os.path.join(MEDIA_DIR, final_name), '--out', thumb_source],
                    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                subprocess.run(
                    ['cwebp', '-quiet', '-q', '80', thumb_source,
                     '-o', os.path.join(THUMB_DIR, thumb_name)],
                    check=True,
                )
                os.remove(thumb_source)

            media_out.append({
                **({'poster': f'./media/{poster}'} if poster else {}),
                'id': f'{name}-{index}',
                'type': item.get('type', 'image'),
                # What it was called in the browser, not what the file is called.
                'name': item.get('name') or final_name,
                'description': item.get('description', ''),
                'src': f'./media/{final_name}',
            })

        out.append({
            'id': recipe['id'],
            'nameEn': recipe['nameEn'],
            'nameCn': recipe.get('nameCn', ''),
            'story': recipe.get('story', ''),
            'ingredients': recipe.get('ingredients', []),
            'steps': recipe.get('steps', []),
            'order': position,
            'createdAt': recipe.get('createdAt'),
            'media': media_out,
        })

    glossary = [{'term': e['term'], 'meaning': e['meaning']} for e in data.get('glossary', [])]

    header = """/* ---------- Built-in content ----------
   Generated by tools/build-seed.py from a backup file. Don't hand-edit:
   change things in the browser, hit "Back up", and run the script again.

   These are the recipes and glossary the site loads on first open in any
   browser, in this exact order. Photos are real files in ./media/, linked by
   relative path. Anything added, edited, reordered or deleted in a browser
   after that lives in IndexedDB and takes precedence over what's here. */

const SEED_RECIPES = """

    body = json.dumps(out, ensure_ascii=False, indent=2)
    gloss = json.dumps(glossary, ensure_ascii=False, indent=2)

    with open(SEED_FILE, 'w') as f:
        f.write(header + body + ';\n\nconst SEED_GLOSSARY = ' + gloss + ';\n')

    total_media = sum(len(r['media']) for r in out)
    size_mb = sum(
        os.path.getsize(os.path.join(folder, filename))
        for folder, _, filenames in os.walk(MEDIA_DIR)
        for filename in filenames
    ) / 1024 / 1024

    print(f'{len(out)} recipes, {len(glossary)} glossary entries, {total_media} media files ({size_mb:.1f} MB)')
    for r in out:
        print(f"  {r['order'] + 1}. {r['nameEn']} — {len(r['ingredients'])} ingredients, "
              f"{len(r['steps'])} steps, {len(r['media'])} photos")


if __name__ == '__main__':
    main()
