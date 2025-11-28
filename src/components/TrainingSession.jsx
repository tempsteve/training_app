import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { loadWorkouts } from '../utils/storage'
import { parseRestTime, formatTime, formatRestTime } from '../utils/time'
import { getUnitForExercise } from '../utils/units'
import './TrainingSession.css'

const PERIOD_TYPES = {
  EXERCISE: 'exercise',
  REST: 'rest'
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
  
  const exerciseTimerRef = useRef(null)
  const restTimerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const workouts = loadWorkouts()
    const found = workouts.find(w => w.id === id)
    if (!found) {
      navigate('/workouts')
      return
    }
    setWorkout(found)
    startTimeRef.current = Date.now()
    startExerciseTimer()
  }, [id, navigate])

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

  const startRestTimer = (restSeconds) => {
    stopRestTimer()
    setRestTime(restSeconds)
    restTimerRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          stopRestTimer()
          setPeriod(PERIOD_TYPES.EXERCISE)
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
    const restSeconds = parseRestTime(currentExercise.restTime)
    setPeriod(PERIOD_TYPES.REST)
    startRestTimer(restSeconds)
  }

  const handleNextSet = () => {
    if (period !== PERIOD_TYPES.EXERCISE) return
    
    const currentExercise = workout.exercises[currentExerciseIndex]
    const unit = getUnitForExercise(currentExercise.name)
    
    // 記錄當前組的數據
    const record = {
      exerciseName: currentExercise.name,
      set: currentSet,
      weight: currentWeight || null,
      unit: unit,
      exerciseTime: exerciseTime
    }
    
    setRecords([...records, record])
    setExerciseTime(0)
    setCurrentWeight('')
    
    // 檢查是否還有下一組
    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1)
      // 自動進入休息
      const restSeconds = parseRestTime(currentExercise.restTime)
      setPeriod(PERIOD_TYPES.REST)
      startRestTimer(restSeconds)
    } else {
      // 這個動作完成了，進入下一個動作
      handleNextExercise()
    }
  }

  const handleNextExercise = () => {
    stopRestTimer()
    setPeriod(PERIOD_TYPES.EXERCISE)
    
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setCurrentSet(1)
      setExerciseTime(0)
      setCurrentWeight('')
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

  if (!workout) {
    return <div>載入中...</div>
  }

  const currentExercise = workout.exercises[currentExerciseIndex]
  const unit = getUnitForExercise(currentExercise.name)
  const isLastSet = currentSet === currentExercise.sets
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1

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
              <input
                type="text"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder={`輸入${unit === '次' ? '次數' : unit}`}
                className="weight-input"
              />
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-large"
                onClick={handleRest}
              >
                休息
              </button>
              <button 
                className="btn btn-success btn-large"
                onClick={handleNextSet}
              >
                {isLastSet ? (isLastExercise ? '完成訓練' : '下一個動作') : '完成這一組'}
              </button>
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
    </div>
  )
}

export default TrainingSession
