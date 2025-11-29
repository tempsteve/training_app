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

  useEffect(() => {
    return () => {
      stopExerciseTimer()
      stopRestTimer()
    }
  }, [])

  const startExerciseTimer = () => {
    stopExerciseTimer()
    exerciseTimerRef.current = setInterval(() => {
      setExerciseTime(prev => prev + 1)
    }, 1000)
  }

  const stopExerciseTimer = () => {
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current)
      exerciseTimerRef.current = null
    }
  }

  const startRestTimer = (restSeconds, isExerciseBreak = false) => {
    stopRestTimer()
    setRestTime(restSeconds)
    restTimerRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          stopRestTimer()
          if (isExerciseBreak) {
            // 項目間休息結束，等待用戶點擊「開始下一個項目」按鈕
            // 不需要自動處理，因為用戶會手動點擊按鈕
          } else {
            // 組間休息結束，進入下一組
            setPeriod(PERIOD_TYPES.EXERCISE)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current)
      restTimerRef.current = null
    }
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
