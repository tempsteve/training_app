import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loadUserSettings, saveUserSettings } from '../utils/storage'
import CustomSelect from './CustomSelect'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    height: '',
    weight: '',
    weightUnit: 'kg',
    gender: 'unknown',
    birthYear: '',
    enableSound: true,
    theme: 'system'
  })
  
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    const loaded = loadUserSettings()
    setSettings(loaded)
  }, [])

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveStatus('') // Clear status on change
  }

  const handleSave = () => {
    saveUserSettings(settings)
    setSaveStatus('success')
    
    // 觸發自定義事件通知 App 更新主題
    window.dispatchEvent(new Event('theme-change'))
    
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  return (
    <div>
      <div className="nav-bar">
        <Link to="/" className="btn-nav">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回首頁
        </Link>
      </div>
      
      <div className="container">
        <div className="card settings-card">
          <h1 className="card-title">使用者設定</h1>
          
          <div className="settings-section">
            <h2>外觀與顯示</h2>
            <div className="form-group">
              <label>色彩主題</label>
              <div className="radio-group">
                <label className={`radio-label ${settings.theme === 'light' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={settings.theme === 'light'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                  />
                  ☀️ 亮色
                </label>
                <label className={`radio-label ${settings.theme === 'dark' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={settings.theme === 'dark'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                  />
                  🌙 暗色
                </label>
                <label className={`radio-label ${settings.theme === 'system' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={settings.theme === 'system'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                  />
                  🖥️ 系統
                </label>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>基本資料</h2>
            
            <div className="form-group">
              <label>身高 (cm)</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="例如：175"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>體重 ({settings.weightUnit})</label>
              <input
                type="number"
                value={settings.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="例如：70"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>重量單位</label>
              <div className="radio-group">
                <label className={`radio-label ${settings.weightUnit === 'kg' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="weightUnit"
                    value="kg"
                    checked={settings.weightUnit === 'kg'}
                    onChange={(e) => handleChange('weightUnit', e.target.value)}
                  />
                  公制 (kg/cm)
                </label>
                <label className={`radio-label ${settings.weightUnit === 'lbs' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="weightUnit"
                    value="lbs"
                    checked={settings.weightUnit === 'lbs'}
                    onChange={(e) => handleChange('weightUnit', e.target.value)}
                  />
                  英制 (lbs/ft)
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>性別</label>
              <CustomSelect 
                value={settings.gender}
                onChange={(val) => handleChange('gender', val)}
                options={[
                  { value: 'unknown', label: '未選擇' },
                  { value: 'male', label: '男' },
                  { value: 'female', label: '女' },
                  { value: 'other', label: '其他' }
                ]}
              />
              <div className="hint-text">用於計算基礎代謝率與熱量消耗參考</div>
            </div>

            <div className="form-group">
              <label>出生年份</label>
              <CustomSelect 
                value={settings.birthYear}
                onChange={(val) => handleChange('birthYear', val)}
                options={[
                  { value: '', label: '選擇年份' },
                  ...years.map(year => ({ value: year.toString(), label: year.toString() }))
                ]}
                placeholder="選擇年份"
              />
              <div className="hint-text">用於計算年齡與心率區間</div>
            </div>
          </div>

          <div className="settings-section">
            <h2>應用程式偏好</h2>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.enableSound}
                  onChange={(e) => handleChange('enableSound', e.target.checked)}
                />
                <span className="checkbox-text">啟用倒數音效</span>
              </label>
              <div className="hint-text">休息時間結束前 3 秒播放提示音</div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {saveStatus === 'success' ? '已儲存！' : '儲存設定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

