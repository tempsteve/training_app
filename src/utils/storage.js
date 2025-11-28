// 本地存儲工具函數
const STORAGE_KEYS = {
  WORKOUTS: 'training_app_workouts',
  TRAINING_HISTORY: 'training_app_history',
  USER_SETTINGS: 'training_app_user_settings'
}

export const saveWorkouts = (workouts) => {
  localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts))
}

export const loadWorkouts = () => {
  const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS)
  return data ? JSON.parse(data) : []
}

export const saveTrainingHistory = (history) => {
  localStorage.setItem(STORAGE_KEYS.TRAINING_HISTORY, JSON.stringify(history))
}

export const loadTrainingHistory = () => {
  const data = localStorage.getItem(STORAGE_KEYS.TRAINING_HISTORY)
  return data ? JSON.parse(data) : []
}

export const addTrainingRecord = (record) => {
  const history = loadTrainingHistory()
  history.unshift({
    ...record,
    id: Date.now().toString(),
    date: new Date().toISOString()
  })
  saveTrainingHistory(history)
  return history
}

export const saveUserSettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))
}

export const loadUserSettings = () => {
  const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
  const defaultSettings = {
    height: '',
    weight: '',
    weightUnit: 'kg',
    gender: 'unknown',
    birthYear: '',
    enableSound: true,
    theme: 'system' // 'light', 'dark', 'system'
  }
  
  if (!data) return defaultSettings
  
  // 合併載入的設定與預設值，確保新欄位 (theme) 存在
  return { ...defaultSettings, ...JSON.parse(data) }
}
