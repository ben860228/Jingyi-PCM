# 後端程式碼結構說明 (GAS Directory)

本目錄存放 Google Apps Script 專案的所有後端邏輯 (`.gs` 檔案)。

## 檔案說明

### 核心入口 (Core)
- **`App_Main.gs`**: 專案的入口點。
    - `doPost(e)`: 處理 LINE Webhook 事件。
    - `doGet(e)`: 處理 LIFF 網頁請求，並掛載 `line_type_form.html`。
    - `include(filename)`: 負責動態引入 HTML/JS/CSS 檔案的輔助函數。
- **`Config.gs`**: 存放全域設定與常數 (如 Sheet ID, LINE Token 等)。

### 服務層 (Services)
- **`Service_Line.gs`**: 封裝 LINE Messaging API 相關操作 (回覆訊息、推播、驗證簽章等)。
- **`Service_SheetDB.gs`**: 封裝與 Google Sheets 資料庫的互動邏輯 (讀取、寫入、更新工作表)。
- **`Service_Bulletin.gs`**: 專案回報與公佈欄的具體業務邏輯 (新增貼文、更新進度)。

### 視圖層 (Views)
- **`View_FlexMessages.gs`**: 定義 LINE Flex Message 的 JSON 模板與組裝邏輯。

## 開發注意事項

所有的 `.gs` 檔案在 GAS 線上編輯器中會被視為在同一個全域命名空間 (Global Scope) 下。因此：
- 不同檔案間可以直接呼叫函式，不需 import/export。
- 請避免全域變數名稱衝突。
