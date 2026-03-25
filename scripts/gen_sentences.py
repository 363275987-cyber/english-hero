#!/usr/bin/env python3
"""Generate sentence audio files (funSentence + example)."""
import asyncio
import re
import os
import json

import edge_tts

VOICE = 'en-US-JennyNeural'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'public', 'audio', 'sentences')
WORDS_JS = os.path.join(BASE_DIR, '..', 'src', 'data', 'words.js')
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def gen(text, filepath):
    try:
        c = edge_tts.Communicate(text, VOICE, rate='-5%', pitch='+0Hz')
        await c.save(filepath)
        return True
    except:
        return False

async def main():
    with open(WORDS_JS, 'r') as f:
        content = f.read()
    
    # Find all word blocks with id and funSentence/example
    pattern = r"\{\s*id:\s*'([^']+)',\s*module:\s*\d+.*?funSentence:\s*'([^']*?)'.*?example:\s*'([^']*?)'"
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    # Alternative: parse block by block
    blocks = re.split(r"(?=\{ id: 'm)", content)
    entries = []
    for block in blocks:
        id_m = re.search(r"id:\s*'([^']+)'", block)
        if not id_m: continue
        wid = id_m.group(1)
        fs_m = re.search(r"funSentence:\s*'([^']*?)'", block)
        ex_m = re.search(r"example:\s*'([^']*?)'", block)
        text = fs_m.group(1) if fs_m else (ex_m.group(1) if ex_m else None)
        if text:
            entries.append((wid, text))
    
    print(f"Generating {len(entries)} sentence audio files...")
    ok = 0
    for i, (wid, text) in enumerate(entries):
        fp = os.path.join(OUTPUT_DIR, f"{wid}.mp3")
        if os.path.exists(fp) and os.path.getsize(fp) > 2000:
            ok += 1
            continue
        success = await gen(text, fp)
        if success:
            ok += 1
        if (i + 1) % 20 == 0:
            print(f"  {i+1}/{len(entries)} ({ok} ok)")
    
    print(f"Done: {ok}/{len(entries)} sentences generated")
    
    index = {wid: f"/audio/sentences/{wid}.mp3" for wid, _ in entries}
    with open(os.path.join(BASE_DIR, '..', 'public', 'audio', 'sentences-index.json'), 'w') as f:
        json.dump(index, f)

asyncio.run(main())
