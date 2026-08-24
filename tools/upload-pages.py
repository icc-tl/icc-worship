#!/usr/bin/env python3
"""把逐頁圖片上傳到 R2，並把網址寫進 uploaded.json。"""
import json
from pathlib import Path
from urllib.parse import quote
import re, hashlib
import boto3
from concurrent.futures import ThreadPoolExecutor

HERE = Path(__file__).parent
IMGS = HERE / 'pages'
env = {}
for line in (HERE.parent / '.env.local').read_text().splitlines():
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1); env[k] = v.strip()

s3 = boto3.client('s3',
    endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=env['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'], region_name='auto')
BUCKET = env['R2_BUCKET']
PUBLIC = env['R2_PUBLIC_URL'].rstrip('/')

sheets = json.load(open(HERE / 'uploaded.json'))

existing = set(); tok = None
while True:
    kw = {'Bucket': BUCKET, 'MaxKeys': 1000, 'Prefix': 'pages/'}
    if tok: kw['ContinuationToken'] = tok
    r = s3.list_objects_v2(**kw)
    existing.update(o['Key'] for o in r.get('Contents', []))
    if not r.get('IsTruncated'): break
    tok = r['NextContinuationToken']
print(f"R2 現有頁圖：{len(existing)}")

def safe(t):
    t = re.sub(r'[\\/:*?"<>|\x00-\x1f]', '', str(t)).strip()
    return re.sub(r'\s+', ' ', t)[:70] or 'sheet'

jobs = []
for s in sheets:
    if not s.get('pageImages'): continue
    # 與 PDF 相同的不可猜測前綴，方便對應
    rnd = hashlib.sha256((s['sheetId'] + env['R2_ACCOUNT_ID']).encode()).hexdigest()[:24]
    urls = []
    for n, name in enumerate(s['pageImages'], 1):
        key = f"pages/{rnd}/{name}"
        urls.append(f"{PUBLIC}/{key}")
        if key not in existing:
            label = safe(s['title']) + (f"_{s['key']}" if s.get('key') else '') + f"_p{n}.jpg"
            ascii_name = re.sub(r'[^\x20-\x7e]', '_', label).replace('"', '')
            jobs.append((IMGS / name, key,
                f"inline; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(label)}"))
    s['pageImageUrls'] = urls

print(f"待上傳：{len(jobs)} 張")

def put(job):
    path, key, disp = job
    try:
        s3.upload_file(str(path), BUCKET, key, ExtraArgs={
            'ContentType': 'image/jpeg',
            'CacheControl': 'public, max-age=31536000, immutable',
            'ContentDisposition': disp,
        })
        return 'ok'
    except Exception as e:
        return f'fail:{e}'

ok = fail = 0
with ThreadPoolExecutor(max_workers=10) as ex:
    for i, r in enumerate(ex.map(put, jobs), 1):
        if r == 'ok': ok += 1
        else: fail += 1
        if i % 200 == 0 or i == len(jobs):
            print(f"  {i}/{len(jobs)}  成功 {ok} / 失敗 {fail}", flush=True)

json.dump(sheets, open(HERE / 'uploaded.json', 'w'), ensure_ascii=False, indent=1)
print(f"\n完成：上傳 {ok} / 失敗 {fail}")
