#!/usr/bin/env python3
"""Generate word audio files only (104 words)."""
import asyncio
import re
import os
import sys
import json

import edge_tts

VOICE = 'en-US-JennyNeural'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'public', 'audio', 'words')
WORDS_JS = os.path.join(BASE_DIR, '..', 'src', 'data', 'words.js')
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def gen(text, filepath):
    try:
        c = edge_tts.Communicate(text, VOICE, rate='+0%', pitch='+0Hz')
        await c.save(filepath)
        return True
    except:
        return False

async def main():
    with open(WORDS_JS, 'r') as f:
        content = f.read()
    
    pattern = r"\{\s*id:\s*'([^']+)',\s*module:\s*(\d+),\s*word:\s*'([^']+)'"
    words = [(m.group(1), int(m.group(2)), m.group(3)) for m in re.finditer(pattern, content)]
    
    print(f"Generating {len(words)} word audio files...")
    ok = 0
    for i, (wid, mod, word) in enumerate(words):
        fp = os.path.join(OUTPUT_DIR, f"{wid}.mp3")
        if os.path.exists(fp) and os.path.getsize(fp) > 1000:
            ok += 1
            continue
        success = await gen(word, fp)
        if success:
            ok += 1
        if (i + 1) % 10 == 0:
            print(f"  {i+1}/{len(words)} ({ok} ok)")
    
    print(f"Done: {ok}/{len(words)} words generated")
    
    # Generate index
    index = {wid: f"/audio/words/{wid}.mp3" for wid, _, _ in words}
    with open(os.path.join(BASE_DIR, '..', 'public', 'audio', 'words-index.json'), 'w') as f:
        json.dump(index, f)

asyncio.run(main())
