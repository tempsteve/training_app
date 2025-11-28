import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署時需要設置 base path
// 如果 repository 名稱是 username.github.io，base 應該是 '/'
// 如果 repository 名稱是其他（例如 training_app），base 應該是 '/training_app/'
// 可以通過環境變數 VITE_BASE_PATH 來設置，預設為 '/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
