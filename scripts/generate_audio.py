#!/usr/bin/env python3
"""Batch generate audio files for English Hero using Edge TTS."""
import asyncio
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'data'))

import edge_tts

VOICE = 'en-US-JennyNeural'  # Natural female voice, good for kids
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Import word data
# Read words.js and parse the word list
words_js = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'words.js')
content_js = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'content.js')

generated = []
failed = []

async def generate_audio(text, filepath, label=""):
    """Generate a single audio file."""
    try:
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(filepath)
        size = os.path.getsize(filepath)
        generated.append((label, size))
        return True
    except Exception as e:
        failed.append((label, str(e)))
        return False

def extract_words():
    """Extract word list from words.js (simple parser)."""
    words = []
    with open(words_js, 'r') as f:
        content = f.read()
    # Find all word definitions: { id: 'm1_w01', word: 'cook', ... }
    import re
    pattern = r"\{\s*id:\s*'([^']+)',\s*module:\s*(\d+),\s*word:\s*'([^']+)'"
    for match in re.finditer(pattern, content):
        word_id, module, word = match.groups()
        # Also find meaning and funSentence
        # Look for the block containing this id
        block_start = content.find(match.group(0))
        block_end = content.find('},', block_start + 10)
        block = content[block_start:block_end]
        
        meaning_match = re.search(r"meaning:\s*'([^']+)'", block)
        example_match = re.search(r"example:\s*'([^']+)'", block)
        fun_sentence_match = re.search(r"funSentence:\s*'([^']+)'", block)
        
        meaning = meaning_match.group(1) if meaning_match else ''
        example = example_match.group(1) if example_match else ''
        fun_sentence = fun_sentence_match.group(1) if fun_sentence_match else ''
        
        words.append({
            'id': word_id,
            'module': int(module),
            'word': word,
            'meaning': meaning,
            'example': example,
            'funSentence': fun_sentence,
        })
    return words

def extract_chants():
    """Extract chant text from content.js."""
    chants = {}
    with open(content_js, 'r') as f:
        content = f.read()
    import re
    # Find chant fields
    pattern = r"(\d+):\s*\{\s*grammarPoint:.*?chant:\s*`([^`]*)`"
    for match in re.finditer(pattern, content, re.DOTALL):
        mod_id = int(match.group(1))
        chant_text = match.group(2)
        # Extract only English lines (before Chinese translation)
        eng_lines = []
        for line in chant_text.split('\n'):
            line = line.strip()
            if not line or line.startswith('（') or line.startswith('('):
                break
            if line.startswith('::') or line.startswith('💬') or line.startswith('🎵'):
                continue
            eng_lines.append(line)
        if eng_lines:
            chants[mod_id] = '\n'.join(eng_lines)
    return chants

async def main():
    print("=" * 50)
    print("English Hero Audio Generator (Edge TTS)")
    print(f"Voice: {VOICE}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 50)
    
    # 1. Generate word pronunciations (104 words)
    print("\n📦 [1/4] Generating word pronunciations...")
    words = extract_words()
    print(f"   Found {len(words)} words")
    
    for i, w in enumerate(words):
        word_dir = os.path.join(OUTPUT_DIR, 'words')
        os.makedirs(word_dir, exist_ok=True)
        filepath = os.path.join(word_dir, f"{w['id']}.mp3")
        await generate_audio(w['word'], filepath, f"word/{w['id']}")
        if (i + 1) % 20 == 0:
            print(f"   ... {i + 1}/{len(words)}")
    print(f"   ✅ Words: {len(generated)} OK, {len(failed)} failed")
    
    # Reset counters
    word_done = len(generated)
    word_fail = len(failed)
    generated.clear()
    failed.clear()
    
    # 2. Generate example sentences (104 sentences)
    print("\n📝 [2/4] Generating example sentences...")
    sent_count = 0
    for i, w in enumerate(words):
        text = w.get('funSentence') or w.get('example') or ''
        if not text:
            continue
        sent_dir = os.path.join(OUTPUT_DIR, 'sentences')
        os.makedirs(sent_dir, exist_ok=True)
        filepath = os.path.join(sent_dir, f"{w['id']}.mp3")
        await generate_audio(text, filepath, f"sent/{w['id']}")
        sent_count += 1
        if sent_count % 20 == 0:
            print(f"   ... {sent_count}/{len(words)}")
    print(f"   ✅ Sentences: {len(generated)} OK, {len(failed)} failed")
    
    sent_done = len(generated)
    sent_fail = len(failed)
    generated.clear()
    failed.clear()
    
    # 3. Generate chants (6 modules)
    print("\n🎵 [3/4] Generating chants...")
    chants = extract_chants()
    print(f"   Found {len(chants)} chants")
    
    for mod_id, text in chants.items():
        chant_dir = os.path.join(OUTPUT_DIR, 'chants')
        os.makedirs(chant_dir, exist_ok=True)
        filepath = os.path.join(chant_dir, f"m{mod_id}.mp3")
        await generate_audio(text, filepath, f"chant/m{mod_id}")
    print(f"   ✅ Chants: {len(generated)} OK, {len(failed)} failed")
    
    chant_done = len(generated)
    chant_fail = len(failed)
    generated.clear()
    failed.clear()
    
    # 4. Generate stories (6 modules)
    print("\n📖 [4/4] Generating stories...")
    # Read stories from words.js
    with open(words_js, 'r') as f:
        wjs = f.read()
    
    import re
    story_pattern = r"const module(\d)Story = '(.*?)';"
    story_count = 0
    for match in re.finditer(story_pattern, wjs, re.DOTALL):
        mod_id = int(match.group(1))
        story_text = match.group(2).strip()
        # Clean up: remove emoji-only lines, keep actual sentences
        sentences = []
        for line in story_text.split('。'):
            line = line.strip().strip('，')
            if len(line) > 2:
                sentences.append(line)
        if not sentences:
            continue
        
        # Split into chunks of ~3 sentences for better TTS quality
        full_text = '。'.join(sentences[:15]) + '。'  # Take first 15 sentences max
        story_dir = os.path.join(OUTPUT_DIR, 'stories')
        os.makedirs(story_dir, exist_ok=True)
        filepath = os.path.join(story_dir, f"m{mod_id}.mp3")
        await generate_audio(full_text, filepath, f"story/m{mod_id}")
        story_count += 1
    print(f"   ✅ Stories: {len(generated)} OK, {len(failed)} failed")
    
    story_done = len(generated)
    story_fail = len(failed)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print(f"   Words:      {word_done} OK, {word_fail} failed")
    print(f"   Sentences:  {sent_done} OK, {sent_fail} failed")
    print(f"   Chants:     {chant_done} OK, {chant_fail} failed")
    print(f"   Stories:    {story_done} OK, {story_fail} failed")
    
    # Calculate total size
    total_size = 0
    for root, dirs, files in os.walk(OUTPUT_DIR):
        if 'test' in root:
            continue
        for f in files:
            total_size += os.path.getsize(os.path.join(root, f))
    print(f"   Total size: {total_size / 1024:.0f} KB ({total_size / 1024 / 1024:.1f} MB)")
    print("=" * 50)
    
    # Write audio manifest for the frontend
    manifest = {
        "voice": VOICE,
        "generated_at": "2026-03-25",
        "categories": {
            "words": word_done,
            "sentences": sent_done,
            "chants": chant_done,
            "stories": story_done,
        }
    }
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"\n📝 Manifest saved to {manifest_path}")

if __name__ == '__main__':
    asyncio.run(main())
