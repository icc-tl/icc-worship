// 字型堆疊：Tailwind 預設的 serif 只列了 Georgia、Times 這些拉丁字型，
// 中文會掉到系統的明體（宋體），跟全站其他地方的黑體並排就顯得很老派。
// 這裡讓標題的拉丁字仍是 Georgia，中文則統一走現代黑體。
const CJK = ['PingFang TC', 'PingFang SC', 'Hiragino Sans CNS', 'Microsoft JhengHei', 'Noto Sans TC', 'Noto Sans CJK TC'];

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', ...CJK, 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', ...CJK, 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', ...CJK, 'monospace'],
      },
    },
  },
  plugins: [],
}
