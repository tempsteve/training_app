import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import WorkoutList from './components/WorkoutList'
import WorkoutEditor from './components/WorkoutEditor'
import TrainingSession from './components/TrainingSession'
import TrainingSummary from './components/TrainingSummary'
import History from './components/History'
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
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  )
}

// 激勵訓練文字庫（來自網路資源）
const motivationalQuotes = [
  "擁有鋼鐵般的意志力，讓每一次的鍛鍊都成為成就更好自己的機會。",
  "天賦可以贏得比賽，但團隊合作和智慧可以贏得冠軍。",
  "能力讓你達到巔峰，品格讓你留在那裡。",
  "此刻打盹，你將做夢；而此刻訓練，你將圓夢。",
  "痛苦是暫時的，放棄是永遠的。",
  "沒有天生的強者，只有不斷努力的普通人。",
  "每一次的汗水，都是對未來的投資。",
  "不要等待機會，而要創造機會。",
  "成功不是終點，失敗也不是末日，繼續前進的勇氣才是最重要的。",
  "訓練不只是改變身體，更是改變心態。",
  "今天的努力，是明天實力的基礎。",
  "超越昨天的自己，就是最大的勝利。"
]

function Home() {
  const navigate = useNavigate()
  const [motivationalText, setMotivationalText] = useState('')
  
  useEffect(() => {
    // 隨機選擇一段激勵文字
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
    setMotivationalText(motivationalQuotes[randomIndex])
  }, [])
  
  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🏋️ 運動訓練助手</h1>
        {motivationalText && (
          <p className="motivational-text">{motivationalText}</p>
        )}
        
        <div className="home-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/workouts')}
          >
            查看課表
          </button>
          <button 
            className="btn btn-secondary btn-large"
            onClick={() => navigate('/history')}
          >
            訓練紀錄
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
