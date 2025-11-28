import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { addTrainingRecord } from '../utils/storage'
import { formatTime } from '../utils/time'
import './TrainingSummary.css'

function TrainingSummary() {
  const navigate = useNavigate()
  const [trainingData, setTrainingData] = useState(null)

  useEffect(() => {
    const data = sessionStorage.getItem('lastTraining')
    if (data) {
      const parsed = JSON.parse(data)
      setTrainingData(parsed)
      // 保存到歷史記錄
      addTrainingRecord(parsed)
      // 清除sessionStorage
      sessionStorage.removeItem('lastTraining')
    } else {
      navigate('/workouts')
    }
  }, [navigate])

  if (!trainingData) {
    return <div>載入中...</div>
  }

  // 統計數據
  const totalSets = trainingData.records.length
  const exercisesCompleted = new Set(trainingData.records.map(r => r.exerciseName)).size
  const totalExerciseTime = trainingData.records.reduce((sum, r) => sum + (r.exerciseTime || 0), 0)

  // 按動作分組
  const groupedRecords = trainingData.records.reduce((acc, record) => {
    if (!acc[record.exerciseName]) {
      acc[record.exerciseName] = []
    }
    acc[record.exerciseName].push(record)
    return acc
  }, {})

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h1>訓練完成！</h1>
        <h2>{trainingData.workoutName}</h2>
      </div>

      <div className="summary-content">
        <div className="stats-card">
          <h3>訓練統計</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{formatTime(trainingData.totalTime)}</div>
              <div className="stat-label">總訓練時間</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatTime(totalExerciseTime)}</div>
              <div className="stat-label">運動時間</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{exercisesCompleted}</div>
              <div className="stat-label">完成動作數</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalSets}</div>
              <div className="stat-label">總組數</div>
            </div>
          </div>
        </div>

        <div className="records-card">
          <h3>訓練記錄</h3>
          {Object.entries(groupedRecords).map(([exerciseName, records]) => (
            <div key={exerciseName} className="exercise-group">
              <h4>{exerciseName}</h4>
              <div className="sets-list">
                {records.map((record, idx) => (
                  <div key={idx} className="set-record">
                    <span className="set-number">第 {record.set} 組</span>
                    {record.weight && (
                      <span className="set-weight">
                        {record.weight} {record.unit}
                      </span>
                    )}
                    {record.exerciseTime > 0 && (
                      <span className="set-time">
                        時間: {formatTime(record.exerciseTime)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="summary-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/workouts')}
          >
            返回課表列表
          </button>
          <Link to="/" className="btn btn-secondary btn-large">
            回到首頁
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TrainingSummary
