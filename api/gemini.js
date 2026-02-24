// 檔案路徑：api/gemini.js
export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 從 Vercel 環境變數讀取 (超安全，瀏覽器看不到)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: '伺服器缺少 GEMINI_API_KEY 環境變數' });

    // 使用最新穩定版 2.0-flash 解決 404 模型找不到的問題
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel API 錯誤:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}