#!/usr/bin/env python3
"""把每份樂譜的來源檔（PDF/圖片/Word）統一轉成單一 PDF，輸出到 tools/out/。"""
import hashlib, json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image
from pypdf import PdfWriter, PdfReader

SRC  = Path('/Users/timlin/Desktop/ICCSongs')
HERE = Path(__file__).parent
OUT  = HERE / 'out'; OUT.mkdir(exist_ok=True)
TMP  = HERE / '.tmp'; TMP.mkdir(exist_ok=True)
SOFFICE = '/Applications/LibreOffice.app/Contents/MacOS/soffice'

sheets = json.load(open(HERE / 'match.json'))

def sheet_id(s):
    raw = f"{s['norm']}|{s['key'] or ''}|{s['label'] or ''}"
    return hashlib.sha1(raw.encode()).hexdigest()[:16]

def img_to_pdf(src, dst):
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', im.size, 'white')
        im = im.convert('RGBA')
        bg.paste(im, mask=im.split()[-1] if im.mode == 'RGBA' else None)
        im = bg
    else:
        im = im.convert('RGB')
    # 過大的掃描圖降解析度，控制檔案大小（長邊上限 2200px，足夠列印閱讀）
    if max(im.size) > 2200:
        r = 2200 / max(im.size)
        im = im.resize((int(im.width * r), int(im.height * r)), Image.LANCZOS)
    im.save(dst, 'PDF', resolution=150.0)
    return dst

def doc_to_pdf(src, outdir):
    subprocess.run([SOFFICE, '--headless', '--convert-to', 'pdf',
                    '--outdir', str(outdir), str(src)],
                   capture_output=True, timeout=120)
    cand = outdir / (Path(src).stem + '.pdf')
    return cand if cand.exists() else None

def build(s, idx):
    sid = sheet_id(s)
    dst = OUT / f"{sid}.pdf"
    if dst.exists():
        return sid, 'cached', None
    parts = []
    with tempfile.TemporaryDirectory(dir=TMP) as td:
        td = Path(td)
        for i, rel in enumerate(s['pages']):
            src = SRC / rel
            ext = src.suffix.lower()
            try:
                if ext == '.pdf':
                    parts.append(src)
                elif ext in {'.doc', '.docx'}:
                    p = doc_to_pdf(src, td)
                    if p: parts.append(p)
                    else: return sid, 'fail', f"Word 轉檔失敗: {rel}"
                else:
                    parts.append(img_to_pdf(src, td / f"{i}.pdf"))
            except Exception as e:
                return sid, 'fail', f"{rel}: {e}"
        if not parts:
            return sid, 'fail', '無可用來源'
        w = PdfWriter()
        for p in parts:
            try:
                for page in PdfReader(str(p)).pages:
                    w.add_page(page)
            except Exception as e:
                return sid, 'fail', f"合併失敗 {Path(p).name}: {e}"
        with open(dst, 'wb') as f:
            w.write(f)
    return sid, 'ok', None

def main():
    ok = cached = fail = 0
    errors = []
    total = len(sheets)
    for i, s in enumerate(sheets, 1):
        sid, status, err = build(s, i)
        s['sheetId'] = sid
        s['pdf'] = f"{sid}.pdf" if status in ('ok', 'cached') else None
        if status == 'ok': ok += 1
        elif status == 'cached': cached += 1
        else:
            fail += 1
            errors.append(f"《{s['title']}》 {err}")
        if i % 50 == 0 or i == total:
            print(f"  {i}/{total}  新轉 {ok} / 快取 {cached} / 失敗 {fail}", flush=True)
    json.dump(sheets, open(HERE / 'match.json', 'w'), ensure_ascii=False, indent=1)
    size = sum(f.stat().st_size for f in OUT.glob('*.pdf'))
    print(f"\n完成：成功 {ok+cached} / 失敗 {fail}")
    print(f"輸出：{len(list(OUT.glob('*.pdf')))} 個 PDF，共 {size/1e6:.1f} MB → {OUT}")
    if errors:
        print(f"\n失敗清單（{len(errors)}）:")
        for e in errors[:40]: print("  " + e)

main()
