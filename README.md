# 運動訓練助手

一個專注於運動訓練輔助的多平台React應用程式。

## 功能特色

- 📋 **課表管理**：建立和管理你的訓練課表，自定義動作、組數、次數和休息時間
- 🏋️ **訓練執行**：從課表逐個進行訓練，記錄每次的重量或強度
- ⏱️ **智能計時**：運動時從0開始計時，休息時自動倒數計時
- 📊 **訓練記錄**：自動記錄每次訓練的詳細數據和結果
- 📱 **響應式設計**：完美適配手機和桌面設備

## 技術棧

- React 18
- React Router DOM
- Vite
- LocalStorage（本地數據存儲）

## 安裝

1. 安裝依賴：
```bash
npm install
```

2. 啟動開發伺服器：
```bash
npm run dev
```

3. 在瀏覽器中打開顯示的網址（通常是 `http://localhost:5173`）

## 使用方式

### 建立課表

1. 點擊「建立新課表」
2. 輸入課表名稱
3. 添加動作，設定：
   - 動作名稱（例如：深蹲、臥推、跑步）
   - 組數
   - 次數
   - 休息時間（例如：30秒、2分鐘、1分30秒）

### 開始訓練

1. 在課表列表中選擇要執行的課表
2. 點擊「開始訓練」
3. 在運動period：
   - 輸入本次的重量/強度（根據動作自動判斷單位）
   - 點擊「休息」進入休息period
   - 完成後點擊「完成這一組」
4. 在休息period：
   - 系統會自動倒數計時
   - 可以提前結束休息
5. 完成所有動作後，查看訓練總結

### 量詞自動判斷

系統會根據動作名稱自動判斷量詞：
- 重量訓練（深蹲、臥推等）→ kg
- 跑步相關 → km
- 腳踏車相關 → km/h
- 平板支撐等 → 秒
- 其他 → 次

## 開發

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 部署到 GitHub Pages

專案已配置好 GitHub Pages 自動部署。

### 首次設置

1. 在 GitHub repository 設定中啟用 Pages：
   - 前往 Settings → Pages
   - Source 選擇 "GitHub Actions"

2. 更新 base path（如果 repository 名稱不是 `username.github.io`）：
   - 編輯 `.github/workflows/deploy.yml`
   - 將 `VITE_BASE_PATH: /training_app/` 改為你的 repository 名稱
   - 例如：如果 repository 是 `my-training-app`，改為 `VITE_BASE_PATH: /my-training-app/`
   - 如果 repository 名稱是 `username.github.io`，改為 `VITE_BASE_PATH: /`

3. 推送代碼到 main 分支，GitHub Actions 會自動建置並部署

### 自動部署

每次推送到 `main` 分支時，GitHub Actions 會自動：
- 建置專案
- 部署到 GitHub Pages

部署完成後，你的應用會出現在：
- `https://username.github.io/repository-name/`（如果 repository 不是 `username.github.io`）
- `https://username.github.io/`（如果 repository 是 `username.github.io`）

## 專案結構

```
src/
├── components/          # React組件
│   ├── WorkoutList.jsx  # 課表列表
│   ├── WorkoutEditor.jsx # 課表編輯器
│   ├── TrainingSession.jsx # 訓練執行
│   └── TrainingSummary.jsx # 訓練總結
├── utils/               # 工具函數
│   ├── storage.js       # 本地存儲
│   ├── time.js          # 時間格式化
│   └── units.js         # 量詞判斷
├── App.jsx              # 主應用和路由
└── main.jsx             # 入口文件
```

## 授權

MIT License
