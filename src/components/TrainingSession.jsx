import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { loadWorkouts, saveWorkouts, loadUserSettings } from '../utils/storage'
import { parseRestTime, formatTime, formatRestTime } from '../utils/time'
import { getUnitForExercise } from '../utils/units'
import './TrainingSession.css'

const PERIOD_TYPES = {
  EXERCISE: 'exercise',
  REST: 'rest',
  EXERCISE_BREAK: 'exerciseBreak' // 項目間休息
}

function TrainingSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [period, setPeriod] = useState(PERIOD_TYPES.EXERCISE)
  const [exerciseTime, setExerciseTime] = useState(0)
  const [restTime, setRestTime] = useState(0)
  const [records, setRecords] = useState([])
  const [currentWeight, setCurrentWeight] = useState('')
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showTempExerciseDialog, setShowTempExerciseDialog] = useState(false)
  const [isLastExercise, setIsLastExercise] = useState(false) // 是否為最後一個項目
  const [userSettings, setUserSettings] = useState({ weightUnit: 'kg' })
  const [tempExercise, setTempExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    restTime: '60秒',
    startingWeight: ''
  })
  
  const exerciseTimerRef = useRef(null)
  const restTimerRef = useRef(null)
  const startTimeRef = useRef(null)
  const currentSetRef = useRef(1)
  const currentExerciseIndexRef = useRef(0)
  const workoutRef = useRef(null)
  const originalStartingWeightsRef = useRef({}) // 保存訓練開始時每個動作的原始起始重量
  const wakeLockRef = useRef(null) // Screen Wake Lock
  const audioContextRef = useRef(null) // AudioContext for sound effects
  const exerciseStartTimeRef = useRef(null) // 當前動作開始的時間戳
  const restEndTimeRef = useRef(null) // 休息結束的時間戳
  const lastVisibilityChangeRef = useRef(null) // 上次可見性變化的時間戳
  const hiddenPeriodRef = useRef(null) // 頁面隱藏時的 period 狀態

  useEffect(() => {
    const settings = loadUserSettings()
    setUserSettings(settings)

    const workouts = loadWorkouts()
    const found = workouts.find(w => w.id === id)
    if (!found) {
      navigate('/workouts')
      return
    }
    setWorkout(found)
    workoutRef.current = found
    startTimeRef.current = Date.now()
    // 保存每個動作的原始起始重量（訓練開始時的值）
    const originalWeights = {}
    found.exercises.forEach((exercise, index) => {
      originalWeights[index] = exercise.startingWeight || ''
    })
    originalStartingWeightsRef.current = originalWeights
    // 初始化第一個動作的起始重量
    if (found.exercises.length > 0) {
      if (found.exercises[0].startingWeight) {
        setCurrentWeight(found.exercises[0].startingWeight)
      }
    }
    startExerciseTimer()
    
    // 啟用螢幕保持恆亮
    requestWakeLock()
    
    return () => {
      // 組件卸載時釋放 Wake Lock
      releaseWakeLock()
    }
  }, [id, navigate])

  useEffect(() => {
    currentSetRef.current = currentSet
    currentExerciseIndexRef.current = currentExerciseIndex
  }, [currentSet, currentExerciseIndex])

  useEffect(() => {
    if (period === PERIOD_TYPES.EXERCISE) {
      startExerciseTimer()
      stopRestTimer()
    } else {
      stopExerciseTimer()
    }
  }, [period])
  
  // 監聽頁面可見性變化，確保背景計時正確
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 頁面變為不可見時，記錄時間戳和當前的 period 狀態
        lastVisibilityChangeRef.current = Date.now()
        hiddenPeriodRef.current = period
      } else {
        // 頁面重新可見時，補償時間
        if (lastVisibilityChangeRef.current && hiddenPeriodRef.current !== null) {
          const hiddenDuration = Math.floor((Date.now() - lastVisibilityChangeRef.current) / 1000)
          const hiddenPeriod = hiddenPeriodRef.current
          
          // 根據隱藏時的狀態來補償，而不是當前狀態
          // 這樣可以正確處理在隱藏期間 period 改變的情況
          
          // 如果隱藏時正在運動，補償運動時間
          if (hiddenPeriod === PERIOD_TYPES.EXERCISE && exerciseStartTimeRef.current) {
            // 更新開始時間，這樣下次計算時會自動包含背景時間
            exerciseStartTimeRef.current -= hiddenDuration * 1000
          }
          
          // 如果隱藏時正在休息，調整休息結束時間
          // 需要延長休息結束時間（使用 +=），這樣休息時間不會因為頁面隱藏而減少
          if ((hiddenPeriod === PERIOD_TYPES.REST || hiddenPeriod === PERIOD_TYPES.EXERCISE_BREAK) && restEndTimeRef.current) {
            restEndTimeRef.current += hiddenDuration * 1000
            // 立即更新休息時間顯示
            updateRestTimeDisplay()
          }
          
          lastVisibilityChangeRef.current = null
          hiddenPeriodRef.current = null
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [period])

  useEffect(() => {
    return () => {
      stopExerciseTimer()
      stopRestTimer()
      releaseWakeLock()
    }
  }, [])
  
  // Screen Wake Lock 功能
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        // 監聽 Wake Lock 釋放事件（例如用戶切換標籤頁）
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock 已釋放')
        })
      }
    } catch (err) {
      // 某些瀏覽器可能不支援或需要用戶互動
      console.log('Wake Lock 無法啟用:', err)
    }
  }
  
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch (err) {
        console.log('釋放 Wake Lock 時發生錯誤:', err)
      }
    }
  }
  
  // 音效播放功能
  const playBeepSound = (frequency = 800, duration = 200) => {
    // 從 storage 讀取最新設定，確保即時反映用戶的設定變更
    const settings = loadUserSettings()
    if (!settings.enableSound) return
    
    try {
      // 使用 Web Audio API 生成音效
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      
      // 如果 AudioContext 處於 suspended 狀態（需要用戶互動），嘗試恢復
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (err) {
      console.log('播放音效時發生錯誤:', err)
    }
  }

  const startExerciseTimer = () => {
    stopExerciseTimer()
    // 記錄當前動作開始的時間戳
    const now = Date.now()
    // 如果 exerciseStartTimeRef 為 null 或 exerciseTime 為 0，從當前時間開始
    // 否則，從當前時間減去已過時間（用於恢復計時）
    if (!exerciseStartTimeRef.current || exerciseTime === 0) {
      exerciseStartTimeRef.current = now
    } else {
      exerciseStartTimeRef.current = now - (exerciseTime * 1000)
    }
    
    const updateTimer = () => {
      if (exerciseStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - exerciseStartTimeRef.current) / 1000)
        setExerciseTime(elapsed)
      }
    }
    
    // 立即更新一次
    updateTimer()
    // 然後每秒更新
    exerciseTimerRef.current = setInterval(updateTimer, 1000)
  }

  const stopExerciseTimer = () => {
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current)
      exerciseTimerRef.current = null
    }
    // 不重置 exerciseStartTimeRef，因為我們需要保留它來計算總時間
  }

  const startRestTimer = (restSeconds, isExerciseBreak = false) => {
    stopRestTimer()
    // 記錄休息結束的時間戳
    restEndTimeRef.current = Date.now() + (restSeconds * 1000)
    let hasPlayedWarning = false // 標記是否已播放三秒警告音效
    
    const updateTimer = () => {
      if (!restEndTimeRef.current) return
      
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((restEndTimeRef.current - now) / 1000))
      
      // 休息結束前三秒播放音效
      if (remaining === 3 && !hasPlayedWarning) {
        hasPlayedWarning = true
        playBeepSound(600, 150) // 較低頻率的提示音
      }
      
      if (remaining <= 0) {
        stopRestTimer()
        setRestTime(0)
        if (isExerciseBreak) {
          // 項目間休息結束，等待用戶點擊「開始下一個項目」按鈕
          // 不需要自動處理，因為用戶會手動點擊按鈕
        } else {
          // 組間休息結束，進入下一組
          setPeriod(PERIOD_TYPES.EXERCISE)
        }
      } else {
        setRestTime(remaining)
      }
    }
    
    // 立即更新一次
    updateTimer()
    // 然後每秒更新
    restTimerRef.current = setInterval(updateTimer, 1000)
  }
  
  // 更新休息時間顯示（用於可見性變化時立即更新）
  const updateRestTimeDisplay = () => {
    if (!restEndTimeRef.current) return
    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((restEndTimeRef.current - now) / 1000))
    setRestTime(remaining)
  }

  const stopRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current)
      restTimerRef.current = null
    }
    restEndTimeRef.current = null
  }

  const handleRest = () => {
    if (period !== PERIOD_TYPES.EXERCISE) return
    
    const currentExercise = workout.exercises[currentExerciseIndex]
    
    // 判斷單位
    let unitType = getUnitForExercise(currentExercise.name)
    let unit = unitType
    if (unitType === 'weight' || unitType === 'weight_or_reps') {
      unit = userSettings.weightUnit
    }
    
    // 記錄當前組的數據
    const record = {
      exerciseName: currentExercise.name,
      targetReps: currentExercise.reps, // 記錄目標次數
      set: currentSet,
      weight: currentWeight || null,
      unit: unit,
      exerciseTime: exerciseTime
    }
    
    setRecords([...records, record])
    setExerciseTime(0)
    // 重置運動計時器的開始時間
    exerciseStartTimeRef.current = Date.now()

    // 更新課表中的起始重量（如果使用者有修改）
    if (currentWeight && currentWeight !== currentExercise.startingWeight) {
      const updatedExercises = [...workout.exercises]
      updatedExercises[currentExerciseIndex] = {
        ...currentExercise,
        startingWeight: currentWeight
      }
      
      const updatedWorkout = { ...workout, exercises: updatedExercises }
      setWorkout(updatedWorkout)
      workoutRef.current = updatedWorkout
      
      // 保存到 localStorage
      const allWorkouts = loadWorkouts()
      const workoutIndex = allWorkouts.findIndex(w => w.id === id)
      if (workoutIndex !== -1) {
        allWorkouts[workoutIndex] = updatedWorkout
        saveWorkouts(allWorkouts)
      }
    }
    
    // 檢查是否是最後一組
    const isLastSet = currentSet >= currentExercise.sets
    const isLastExerciseCheck = currentExerciseIndex === workout.exercises.length - 1
    const isLastSetOfLastExercise = isLastSet && isLastExerciseCheck
    
    // 如果是最後一個項目的最後一組，直接顯示完成對話框
    if (isLastSetOfLastExercise) {
      setShowCompletionDialog(true)
      return
    }
    
    // 檢查是否還有下一組
    if (!isLastSet) {
      setCurrentSet(currentSet + 1)
      // 下一組時，使用剛才更新過的 currentWeight (即為最新的 startingWeight)
      // 不需要特別做什麼，因為 currentWeight 已經是新的值了
    } else {
      // 這是最後一組但不是最後一個項目，進入項目間休息（5分鐘）
      setIsLastExercise(false)
      setPeriod(PERIOD_TYPES.EXERCISE_BREAK)
      const exerciseBreakSeconds = 5 * 60 // 5分鐘
      startRestTimer(exerciseBreakSeconds, true)
    }

    if (!isLastSetOfLastExercise && !isLastSet) {
      // 組間休息
      const restSeconds = parseRestTime(currentExercise.restTime)
      setPeriod(PERIOD_TYPES.REST)
      startRestTimer(restSeconds, false)
    }
  }

  const handleNextExercise = () => {
    stopRestTimer()
    setPeriod(PERIOD_TYPES.EXERCISE)
    
    if (currentExerciseIndex < workout.exercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1
      setCurrentExerciseIndex(nextIndex)
      setCurrentSet(1)
      setExerciseTime(0)
      exerciseStartTimeRef.current = null // 重置，讓 startExerciseTimer 重新設置
      setIsLastExercise(false)
      // 設定下一個動作的起始重量
      const nextExercise = workout.exercises[nextIndex]
      setCurrentWeight(nextExercise.startingWeight || '')
    } else {
      // 所有動作都完成了
      handleEndTraining()
    }
  }

  const handleEndTraining = () => {
    stopExerciseTimer()
    stopRestTimer()
    releaseWakeLock() // 結束訓練時釋放 Wake Lock
    
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const trainingData = {
      workoutId: workout.id,
      workoutName: workout.name,
      records: records,
      totalTime: totalTime,
      exerciseTime: exerciseTime
    }
    
    // 將數據存儲到sessionStorage，供Summary頁面使用
    sessionStorage.setItem('lastTraining', JSON.stringify(trainingData))
    navigate('/summary')
  }

  const handleAddTempExercise = () => {
    if (!tempExercise.name.trim()) {
      alert('請輸入動作名稱')
      return
    }

    const newExercise = {
      ...tempExercise,
      startingWeight: tempExercise.startingWeight
    }

    const updatedWorkout = {
      ...workout,
      exercises: [...workout.exercises, newExercise]
    }

    setWorkout(updatedWorkout)
    workoutRef.current = updatedWorkout
    
    // 不更新 localStorage，因為是臨時動作
    
    setShowTempExerciseDialog(false)
    setShowCompletionDialog(false)
    
    // 進入下一個動作（即剛新增的動作）
    // 這裡需要手動觸發類似 handleNextExercise 的邏輯，但因為我們已經在對話框狀態，
    // 直接更新索引和重置狀態即可
    
    const nextIndex = workout.exercises.length // 原本長度即為新動作索引
    // 保存臨時動作的原始起始重量
    originalStartingWeightsRef.current[nextIndex] = newExercise.startingWeight || ''
    setCurrentExerciseIndex(nextIndex)
    setCurrentSet(1)
    setExerciseTime(0)
    exerciseStartTimeRef.current = null // 重置，讓 startExerciseTimer 重新設置
    setCurrentWeight(newExercise.startingWeight || '')
    setIsLastExercise(false)
    setPeriod(PERIOD_TYPES.EXERCISE)
    startExerciseTimer()
  }

  if (!workout) {
    return <div>載入中...</div>
  }

  const currentExercise = workout.exercises[currentExerciseIndex]
  
  // 計算顯示單位
  let unitType = getUnitForExercise(currentExercise.name)
  let unit = unitType
  if (unitType === 'weight' || unitType === 'weight_or_reps') {
    unit = userSettings.weightUnit
  } else if (unitType === 'km' || unitType === 'km/h' || unitType === '秒') {
    // 保持原樣
  } else {
    unit = '次' // 預設
  }

  return (
    <div className="training-container">
      <div className="training-header">
        <h1>{workout.name}</h1>
        <div className="progress-info">
          動作 {currentExerciseIndex + 1} / {workout.exercises.length}
        </div>
      </div>

      <div className="training-content">
        {period === PERIOD_TYPES.EXERCISE ? (
          <div className="exercise-period">
            <div className="exercise-info">
              <h2 className="exercise-name">{currentExercise.name}</h2>
              <div className="set-info">
                第 {currentSet} / {currentExercise.sets} 組
              </div>
              <div className="reps-info">
                目標：{currentExercise.reps} 次
              </div>
            </div>

            <div className="timer-display exercise-timer">
              <div className="timer-label">運動時間</div>
              <div className="timer-value">{formatTime(exerciseTime)}</div>
            </div>

            <div className="weight-input-section">
              <label>本次重量/強度 ({unit})</label>
              {originalStartingWeightsRef.current[currentExerciseIndex] && (
                <div className="starting-weight-hint">
                  課表起始重量：{originalStartingWeightsRef.current[currentExerciseIndex]} {unit}
                </div>
              )}
              <div className="weight-input-wrapper">
                <button
                  className="weight-btn weight-btn-decrease"
                  onClick={() => {
                    const num = parseFloat(currentWeight) || parseFloat(currentExercise.startingWeight) || 0
                    setCurrentWeight(Math.max(0, num - 1).toString())
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder={currentExercise.startingWeight || `輸入${unit === '次' ? '次數' : unit}`}
                  className="weight-input"
                />
                <button
                  className="weight-btn weight-btn-increase"
                  onClick={() => {
                    const num = parseFloat(currentWeight) || parseFloat(currentExercise.startingWeight) || 0
                    setCurrentWeight((num + 1).toString())
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-large"
                onClick={handleRest}
              >
                休息
              </button>
            </div>
          </div>
        ) : period === PERIOD_TYPES.EXERCISE_BREAK ? (
          <div className="rest-period exercise-break">
            <div className="rest-info">
              <h2>項目間休息</h2>
              <div className="next-exercise-info">
                {isLastExercise ? (
                  <span>🎉 所有項目已完成</span>
                ) : (
                  <span>下一個項目：{workout.exercises[currentExerciseIndex + 1]?.name}</span>
                )}
              </div>
            </div>

            <div className="timer-display rest-timer">
              <div className="timer-label">剩餘時間</div>
              <div className="timer-value">{formatTime(restTime)}</div>
            </div>

            <div className="action-buttons">
              {!isLastExercise && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleNextExercise}
                >
                  開始下一個項目
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rest-period">
            <div className="rest-info">
              <h2>休息時間</h2>
              <div className="next-exercise-info">
                下一組：{currentExercise.name} - 第 {currentSet} 組
              </div>
            </div>

            <div className="timer-display rest-timer">
              <div className="timer-label">剩餘時間</div>
              <div className="timer-value">{formatTime(restTime)}</div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => {
                  stopRestTimer()
                  setPeriod(PERIOD_TYPES.EXERCISE)
                  setRestTime(0)
                }}
              >
                提前結束休息
              </button>
            </div>
          </div>
        )}

        <div className="end-training-section">
          <button 
            className="btn btn-danger btn-large"
            onClick={handleEndTraining}
          >
            結束訓練
          </button>
        </div>
      </div>

      {showCompletionDialog && (
        <div className="dialog-overlay" onClick={() => setShowCompletionDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 本次課表已完成</h2>
            <p>是否結束訓練？</p>
            <div className="dialog-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCompletionDialog(false)
                  setShowTempExerciseDialog(true)
                  setTempExercise({
                    name: '',
                    sets: 3,
                    reps: 10,
                    restTime: '60秒',
                    startingWeight: ''
                  })
                }}
              >
                新增臨時動作
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleEndTraining}
              >
                結束訓練
              </button>
            </div>
          </div>
        </div>
      )}

      {showTempExerciseDialog && (
        <div className="dialog-overlay">
          <div className="dialog-content temp-exercise-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>新增臨時動作</h2>
            <div className="temp-exercise-form">
              <div className="form-group">
                <label>動作名稱</label>
                <input
                  type="text"
                  value={tempExercise.name}
                  onChange={(e) => setTempExercise({...tempExercise, name: e.target.value})}
                  className="form-input"
                  placeholder="例如：伏地挺身"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>組數</label>
                  <input
                    type="number"
                    value={tempExercise.sets}
                    onChange={(e) => setTempExercise({...tempExercise, sets: parseInt(e.target.value) || 1})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>次數</label>
                  <input
                    type="number"
                    value={tempExercise.reps}
                    onChange={(e) => setTempExercise({...tempExercise, reps: parseInt(e.target.value) || 1})}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>重量 ({userSettings.weightUnit})</label>
                  <input
                    type="text"
                    value={tempExercise.startingWeight}
                    onChange={(e) => setTempExercise({...tempExercise, startingWeight: e.target.value})}
                    className="form-input"
                    placeholder="選填"
                  />
                </div>
                <div className="form-group">
                  <label>休息時間</label>
                  <input
                    type="text"
                    value={tempExercise.restTime}
                    onChange={(e) => setTempExercise({...tempExercise, restTime: e.target.value})}
                    className="form-input"
                    placeholder="例如：60秒"
                  />
                </div>
              </div>
            </div>
            <div className="dialog-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowTempExerciseDialog(false)
                  setShowCompletionDialog(true)
                }}
              >
                返回
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddTempExercise}
              >
                開始動作
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainingSession
