#!/usr/bin/env python3
"""替 R2 上的樂譜補上正確的顯示檔名與 inline 預覽設定（不重傳檔案內容）。"""
import json, re, sys
from pathlib import Path
from urllib.parse import quote
import boto3
from concurrent.futures import ThreadPoolExecutor

HERE = Path(__file__).parent
env = {}
for line in (HERE.parent / '.env.local').read_text().splitlines():
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1); env[k] = v.strip()

s3 = boto3.client('s3',
    endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=env['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
    region_name='auto')
BUCKET = env['R2_BUCKET']

sheets = json.load(open(HERE / 'uploaded.json'))

def safe_name(s):
    s = re.sub(r'[\\/:*?"<>|\x00-\x1f]', '', s).strip()
    s = re.sub(r'\s+', ' ', s)
    return s[:80] or 'sheet'

def disposition(s):
    parts = [safe_name(s['title'])]
    if s.get('key'): parts.append(s['key'])
    if s.get('label'): parts.append(safe_name(s['label']))
    name = '_'.join(parts) + '.pdf'
    # ASCII 後備名 + RFC 5987 的 UTF-8 檔名，兼顧各家瀏覽器
    ascii_fallback = re.sub(r'[^\x20-\x7e]', '_', name).replace('"', '')
    return f"inline; filename=\"{ascii_fallback}\"; filename*=UTF-8''{quote(name)}", name

def fix(s):
    key = s.get('r2key')
    if not key: return 'skip'
    cd, name = disposition(s)
    try:
        s3.copy_object(
            Bucket=BUCKET, Key=key, CopySource={'Bucket': BUCKET, 'Key': key},
            MetadataDirective='REPLACE',
            ContentType='application/pdf',
            ContentDisposition=cd,
            CacheControl='public, max-age=31536000, immutable',
        )
        return 'ok'
    except Exception as e:
        return f'fail:{e}'

done = {'ok': 0, 'skip': 0, 'fail': 0}
fails = []
with ThreadPoolExecutor(max_workers=10) as ex:
    for i, r in enumerate(ex.map(fix, sheets), 1):
        k = r if r in ('ok', 'skip') else 'fail'
        done[k] += 1
        if k == 'fail' and len(fails) < 5: fails.append(r)
        if i % 150 == 0 or i == len(sheets):
            print(f"  {i}/{len(sheets)}  成功 {done['ok']} / 略過 {done['skip']} / 失敗 {done['fail']}", flush=True)

print(f"\n完成：{done['ok']} 個物件已補上檔名")
if fails: print("失敗範例:", *fails, sep="\n  ")
print("\n範例檔名：")
for s in sheets[:5]:
    print("  ", disposition(s)[1])
