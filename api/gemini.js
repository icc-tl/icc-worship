// 檔案路徑：api/gemini.js (這段程式碼只會在 Vercel 伺服器端執行)

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 從 Vercel 的環境變數中讀取您的 API Key (超級安全，前端絕對看不到)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: '伺服器缺少 GEMINI_API_KEY 環境變數' });
    }

    // 使用穩定的公開模型 1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 將前端傳來的資料 (req.body) 原封不動轉發給 Google
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // 將 Google 的回應傳回給前端
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("Vercel API 錯誤:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}