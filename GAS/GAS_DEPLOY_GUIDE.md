# 🚀 Google Apps Script (GAS) 部署指南

本專案已採用模組化架構，並支援使用 `clasp` 工具進行部署。

## 專案結構
```
GAS/
├── gs/                      # 後端邏輯 (Server-side)
│   ├── App_Main.gs          # 核心入口 (doGet, doPost, include)
│   ├── Config.gs            # 設定檔
│   └── ... (Service_*.gs)
└── html/                    # 前端頁面 (Client-side)
    ├── line_type_form.html  # 主頁面 (含 CSS 與全域變數)
    ├── line_form_js.html    # 通用 JS 邏輯
    └── line_form_progress_js.html # 週進度 JS 邏輯
```

## 部署方法 (推薦)

建議使用 [clasp](https://github.com/google/clasp) 進行指令列部署，這是最快且最不容易出錯的方式。

1.  **確認環境**：確保已安裝 Node.js 與 Clasp (`npm install -g @google/clasp`)。
2.  **登入**：`clasp login`
3.  **推送到 GAS**：
    在專案根目錄執行：
    ```bash
    clasp push
    ```
    Clasp 會自動將 `GAS/gs/` 與 `GAS/html/` 內的檔案上傳至 Google Apps Script 專案根目錄 (自動攤平檔案結構)。

## 手動部署 (不推薦)

若無法使用 Clasp，需手動在 GAS 線上編輯器建立檔案。請注意 **GAS 線上編輯器不支援資料夾**，所有檔案名稱將會直接攤平。

1.  **後端檔案 (.gs)**：
    *   建立 `App_Main.gs`，複製 `GAS/gs/App_Main.gs` 的內容。
    *   建立 `Config.gs`，複製 `GAS/gs/Config.gs` 的內容。
    *   依此類推，建立其他所有 `.gs` 檔案。

2.  **前端檔案 (.html)**：
    *   建立 HTML 檔案時，請使用 **純檔名** (不含路徑)。例如：
        *   建立 `line_type_form.html` (複製 `GAS/html/line_type_form.html`)
        *   建立 `line_form_js.html` (複製 `GAS/html/line_form_js.html`)
        *   建立 `line_form_progress_js.html` (複製 `GAS/html/line_form_progress_js.html`)

3.  **發布版本**：
    *   點擊「部署」 -> 「管理部署」。
    *   編輯現有的 Web App 部署 -> 選擇「新版本」 -> 點擊「部署」。

## 常見問題
*   **找不到檔案?** GAS 線上編輯器會把 `GAS/html/line_type_form.html` 顯示為 `line_type_form` (HTML檔)。
*   **背景全白?** 請確認 `line_type_form.html` 中的 CSS 樣式是否正確載入 (新版已內嵌 CSS 於主檔案中，應無此問題)。
*   **需要重新登入?** 若發生 LIFF 登入迴圈，請確認 `line_type_form.html` 中的 `MAGIC_UID` 變數是否正確被伺服器注入。
