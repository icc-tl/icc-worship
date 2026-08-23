#!/usr/bin/env python3
"""把轉好的 PDF 上傳到 R2，並輸出要寫入 Firestore 的 sheets 資料。"""
import json, os, sys, uuid, hashlib
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from concurrent.futures import ThreadPoolExecutor

HERE = Path(__file__).parent
OUT  = HERE / 'out'
ROOT = HERE.parent

env = {}
for line in (ROOT / '.env.local').read_text().splitlines():
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1); env[k] = v.strip()

s3 = boto3.client('s3',
    endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=env['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
    region_name='auto')
BUCKET = env['R2_BUCKET']
PUBLIC = env['R2_PUBLIC_URL'].rstrip('/')

sheets = json.load(open(HERE / 'match.json'))
sheets = [s for s in sheets if s.get('pdf')]

# 既有物件（支援中斷後續傳）
existing = set()
tok = None
while True:
    kw = {'Bucket': BUCKET, 'MaxKeys': 1000}
    if tok: kw['ContinuationToken'] = tok
    r = s3.list_objects_v2(**kw)
    existing.update(o['Key'] for o in r.get('Contents', []))
    if not r.get('IsTruncated'): break
    tok = r['NextContinuationToken']
print(f"R2 現有物件：{len(existing)}")

def obj_key(s):
    """不可猜測的路徑：隨機前綴 + 樂譜 ID"""
    rnd = hashlib.sha256((s['sheetId'] + env['R2_ACCOUNT_ID']).encode()).hexdigest()[:24]
    return f"sheets/{rnd}/{s['sheetId']}.pdf"

def put(s):
    key = obj_key(s)
    s['r2key'] = key
    s['url'] = f"{PUBLIC}/{key}"
    if key in existing:
        return 'skip'
    p = OUT / s['pdf']
    try:
        s3.upload_file(str(p), BUCKET, key, ExtraArgs={
            'ContentType': 'application/pdf',
            'CacheControl': 'public, max-age=31536000, immutable',
            'ContentDisposition': 'inline',
        })
        return 'ok'
    except ClientError as e:
        return f"fail:{e.response['Error']['Code']}"

done = {'ok': 0, 'skip': 0, 'fail': 0}
with ThreadPoolExecutor(max_workers=8) as ex:
    for i, r in enumerate(ex.map(put, sheets), 1):
        done['ok' if r == 'ok' else ('skip' if r == 'skip' else 'fail')] += 1
        if i % 100 == 0 or i == len(sheets):
            print(f"  {i}/{len(sheets)}  上傳 {done['ok']} / 已存在 {done['skip']} / 失敗 {done['fail']}", flush=True)

json.dump(sheets, open(HERE / 'uploaded.json', 'w'), ensure_ascii=False, indent=1)
mb = sum((OUT / s['pdf']).stat().st_size for s in sheets) / 1e6
print(f"\n完成：{done['ok']} 上傳 / {done['skip']} 已存在 / {done['fail']} 失敗")
print(f"總體積 {mb:.1f} MB（R2 免費額度 10240 MB，使用 {mb/10240*100:.1f}%）")
print(f"→ tools/uploaded.json")
