// 樂譜檔案操作的後端端點。
//
// 為什麼需要它：R2 的金鑰不能放在前端（前端程式是公開的）。
// 這支 API 先驗證呼叫者確實是主領，才簽發一次性的上傳網址，
// 或代為刪除檔案。前端全程接觸不到金鑰。
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const ADMIN_UID = process.env.ADMIN_UID;

const ALLOWED = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
const MAX_BYTES = 25 * 1024 * 1024;

// 用 Firebase 的官方端點驗證 ID Token，避免自行處理 JWT 簽章
async function verifyAdmin(req) {
  const auth = req.headers.authorization || '';
  const idToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!idToken) return { ok: false, status: 401, error: '缺少身分憑證' };

  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
  );
  if (!r.ok) return { ok: false, status: 401, error: '憑證無效或已過期' };

  const data = await r.json();
  const user = data.users?.[0];
  if (!user) return { ok: false, status: 401, error: '憑證無效' };
  if (user.localId !== ADMIN_UID) return { ok: false, status: 403, error: '沒有管理權限' };
  return { ok: true, uid: user.localId };
}

function s3() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!FIREBASE_API_KEY || !ADMIN_UID || !process.env.R2_ACCOUNT_ID) {
    return res.status(500).json({ error: '伺服器環境變數尚未設定完成' });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { action, contentType, size, key } = req.body || {};
  const bucket = process.env.R2_BUCKET;

  try {
    if (action === 'upload') {
      const ext = ALLOWED[contentType];
      if (!ext) return res.status(400).json({ error: '只接受 PDF、JPG 或 PNG 檔' });
      if (!size || size > MAX_BYTES) return res.status(400).json({ error: '檔案不可超過 25 MB' });

      // 不可猜測的路徑
      const rand = () => [...crypto.getRandomValues(new Uint8Array(12))]
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const objectKey = `sheets/${rand()}/${rand().slice(0, 16)}.${ext}`;

      // 物件路徑是隨機的（避免被猜到），所以要另外指定下載時顯示的檔名，
      // 否則使用者存下來會看到一串雜湊。inline 讓瀏覽器直接預覽而非強制下載。
      const safe = String(filename || 'sheet').replace(/[\\/:*?"<>|\x00-\x1f]/g, '').slice(0, 80) || 'sheet';
      const withExt = safe.toLowerCase().endsWith(`.${ext}`) ? safe : `${safe}.${ext}`;
      const asciiName = withExt.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
      const disposition = `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(withExt)}`;

      const url = await getSignedUrl(s3(), new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: contentType,
        ContentDisposition: disposition,
        CacheControl: 'public, max-age=31536000, immutable',
      }), { expiresIn: 300 });

      return res.status(200).json({
        uploadUrl: url,
        key: objectKey,
        publicUrl: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${objectKey}`,
      });
    }

    if (action === 'delete') {
      if (!key || !key.startsWith('sheets/')) return res.status(400).json({ error: '無效的檔案路徑' });
      await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return res.status(200).json({ deleted: key });
    }

    return res.status(400).json({ error: '未知的操作' });
  } catch (e) {
    console.error('Sheet API error:', e);
    return res.status(500).json({ error: '伺服器處理失敗', details: e.message });
  }
}
