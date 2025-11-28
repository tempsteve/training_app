// 本地存儲工具函數
const STORAGE_KEYS = {
  WORKOUTS: 'training_app_workouts',
  TRAINING_HISTORY: 'training_app_history'
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
