# 前端檔案結構說明 (HTML Directory)

本目錄存放 Google Apps Script 專案的所有前端頁面與組件。為了方便維護，原本龐大的單一 HTML 檔案已被拆分為多個模組。

## 檔案說明

### 主頁面 (Entry Points)
- **`line_type_form.html`**: LINE LIFF 回報表單的入口頁面。負責整體的 `<html>` 結構，包含內嵌的 CSS 樣式，並透過 GAS 的 `include()` 函數動態載入 JS 邏輯。

### 邏輯腳本 (Scripts)
- **`line_form_js.html`**: 通用 JavaScript 邏輯，包含 LIFF 初始化、身分驗證、表單提交等基礎功能。
- **`line_form_progress_js.html`**: 「週進度回報」專用的複雜邏輯，包含資料計算、圖表渲染 (`renderProgressCards`) 與互動功能。

## 如何使用

在 GAS 後端 (`.gs`) 中，請使用以下方式引入 JS 組件：

```javascript
// 範例：在主頁面中引入 JS
<?!= include('line_form_js'); ?>
```

這樣的結構能讓程式碼更清晰，且保持樣式載入的穩定性 (CSS 內嵌於主檔案)。
