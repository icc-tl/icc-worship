# 主領權限設定

> **重要：程式碼的修改本身不會讓資料變安全。**
> 真正把關的是 Firestore 安全規則。在完成下面第 4 步之前，
> 資料庫仍然維持原本的權限設定。

修改後的權限架構：

| 身分 | 怎麼來的 | 能做什麼 |
|---|---|---|
| 訪客 | 開啟網站自動匿名登入 | 讀取歌單與詩歌庫 |
| 主領 | 輸入共用密碼登入共用帳號 | 讀取 ＋ 新增／修改／刪除 |

密碼由 Firebase 伺服器驗證，**不存在於原始碼或打包檔中**。
前端的 `isAdmin` 只用來決定要不要顯示編輯按鈕；
即使有人竄改前端，寫入仍會被 Firestore 規則擋下。

---

## 一次性設定（在 Firebase Console 操作）

前往 [Firebase Console](https://console.firebase.google.com) → 專案 `icc-worship-hub`。

### 1. 啟用「電子郵件／密碼」登入

Authentication → Sign-in method → 啟用 **Email/Password**
（不需要啟用 Email link 那一項）

同時確認 **匿名 (Anonymous)** 也是啟用狀態 —— 訪客瀏覽需要它。

### 2. 建立主領共用帳號

Authentication → Users → Add user

- **Email**：`timlin.ty@gmail.com`
- **Password**：設一組新的共用密碼

> **請不要沿用 `ICCWS1025`。** 舊密碼曾經出現在公開的原始碼裡，
> 也永久留在 git 歷史中，必須視為已外洩。

這個信箱只是帳號的識別碼，**主領登入時不會看到、也不需要輸入**——
驗證視窗一樣只要求那一組共用密碼。

它唯一的作用是密碼忘記時，可以用「忘記密碼」寄重設信到這個信箱。
換句話說，重設密碼的權限只有你有。

要改成別的信箱，同步修改 `src/App.jsx` 的 `ADMIN_EMAIL` 常數即可。

### 3. 把該帳號加進管理員名單

先複製剛建立帳號的 **User UID**（Users 列表最右邊那一串）。

Firestore Database → 依序建立這個路徑的文件：

```
artifacts / icc-worship-hub / public / data / admin_uids / <貼上剛剛的 UID>
```

文件內容留空即可 —— 規則只檢查這份文件**存不存在**。

> 日後要新增主領帳號，就多建一個帳號、在這裡多加一份文件。
> 要停用某人，把對應文件刪掉即可，不需要改程式或重新部署。

### 4. 發布安全規則

把專案根目錄 [`firestore.rules`](./firestore.rules) 的內容，
貼到 Firestore Database → Rules，然後按 **發布**。

**完成這一步，資料庫才真正受到保護。**

---

## 驗證是否設定成功

1. 用**無痕視窗**開啟網站 → 應顯示「訪客模式」，且歌單正常顯示
2. 點「+ 預備歌單」→ 輸入新密碼 → 應變成「權限已解鎖」，旁邊出現「登出」
3. 隨意輸入錯誤密碼 → 應顯示「密碼錯誤。」
4. 訪客模式下開啟瀏覽器主控台，執行任何寫入 → 應被拒絕（`permission-denied`）

---

## 日常維運

| 需求 | 做法 | 要重新部署嗎 |
|---|---|---|
| 更換共用密碼 | Console → Authentication → 該帳號 → 重設密碼 | 不用 |
| 新增一位主領 | 建新帳號 ＋ 在 `admin_uids` 加一份文件 | 不用 |
| 停用一位主領 | 刪掉對應的 `admin_uids` 文件 | 不用 |
| 調整權限邏輯 | 修改 `firestore.rules` 並重新發布 | 不用 |

---

## 附註：`firebaseConfig` 裡的 apiKey 不是機密

`src/App.jsx` 中的 `apiKey` 公開是正常的 —— 它只是專案識別碼，
Google 設計上就是給前端使用的，不能用來繞過安全規則。
真正的防線一直都是這份 `firestore.rules`。
