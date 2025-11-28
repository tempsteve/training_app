import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import WorkoutList from './components/WorkoutList'
import WorkoutEditor from './components/WorkoutEditor'
import TrainingSession from './components/TrainingSession'
import TrainingSummary from './components/TrainingSummary'
import Settings from './components/Settings'
import { loadUserSettings } from './utils/storage'
import './App.css'

// 根據環境變數設置 basename，本地開發時為 '/'，部署到 GitHub Pages 時為 '/training_app/'
const basename = import.meta.env.VITE_BASE_PATH || '/'

// 簡單的主題管理器組件
function ThemeManager() {
  useEffect(() => {
    const applyTheme = () => {
      const settings = loadUserSettings()
      const theme = settings.theme || 'system'
      const root = document.documentElement

      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark')
      } else if (theme === 'light') {
        root.removeAttribute('data-theme')
      } else {
        // System default
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.setAttribute('data-theme', 'dark')
        } else {
          root.removeAttribute('data-theme')
        }
      }
    }

    // 初始應用
    applyTheme()

    // 監聽 storage 變化以跨分頁同步
    window.addEventListener('storage', applyTheme)
    
    // 監聽自定義事件以即時更新
    window.addEventListener('theme-change', applyTheme)

    // 監聽系統主題變化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      const settings = loadUserSettings()
      if (settings.theme === 'system') {
        applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handleSystemChange)

    return () => {
      window.removeEventListener('storage', applyTheme)
      window.removeEventListener('theme-change', applyTheme)
      mediaQuery.removeEventListener('change', handleSystemChange)
    }
  }, [])

  return null
}

function App() {
  return (
    <Router basename={basename}>
      <ThemeManager />
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workouts" element={<WorkoutList />} />
          <Route path="/workouts/new" element={<WorkoutEditor />} />
          <Route path="/workouts/edit/:id" element={<WorkoutEditor />} />
          <Route path="/train/:id" element={<TrainingSession />} />
          <Route path="/summary" element={<TrainingSummary />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  )
}

function Home() {
  const navigate = useNavigate()
  
  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🏋️ 運動訓練助手</h1>
        <p className="subtitle">建立你的專屬訓練課表，記錄每一次的進步</p>
        
        <div className="home-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/workouts')}
          >
            查看課表
          </button>
          <button 
            className="btn btn-secondary btn-large"
            onClick={() => navigate('/workouts/new')}
          >
            建立新課表
          </button>
          <button 
            className="btn btn-outline btn-large"
            onClick={() => navigate('/settings')}
          >
            ⚙️ 設定
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
