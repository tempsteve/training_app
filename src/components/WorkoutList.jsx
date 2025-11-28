import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loadWorkouts, saveWorkouts } from '../utils/storage'
import './WorkoutList.css'

function WorkoutList() {
  const [workouts, setWorkouts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setWorkouts(loadWorkouts())
  }, [])

  const handleDelete = (id) => {
    if (window.confirm('確定要刪除這個課表嗎？')) {
      const updated = workouts.filter(w => w.id !== id)
      setWorkouts(updated)
      saveWorkouts(updated)
    }
  }

  if (workouts.length === 0) {
    return (
      <div>
        <div className="nav-bar">
          <Link to="/" className="btn-nav">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            返回首頁
          </Link>
          <button className="btn btn-primary" onClick={() => navigate('/workouts/new')}>
            + 建立課表
          </button>
        </div>
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h2>還沒有課表</h2>
            <p>建立你的第一個訓練課表吧！</p>
            <button className="btn btn-primary" onClick={() => navigate('/workouts/new')}>
              建立新課表
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="nav-bar">
        <Link to="/" className="btn-nav">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回首頁
        </Link>
        <button className="btn btn-primary" onClick={() => navigate('/workouts/new')}>
          + 建立課表
        </button>
      </div>
      <div className="container">
        <h1 className="page-title">我的課表</h1>
        {workouts.map(workout => (
          <div key={workout.id} className="workout-card">
            <div className="workout-header">
              <h2>{workout.name}</h2>
              <div className="workout-actions">
                <button 
                  className="btn btn-success"
                  onClick={() => navigate(`/train/${workout.id}`)}
                >
                  開始訓練
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/workouts/edit/${workout.id}`)}
                >
                  編輯
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(workout.id)}
                >
                  刪除
                </button>
              </div>
            </div>
            <div className="workout-exercises">
              <h3>動作列表：</h3>
              <ul>
                {workout.exercises.map((exercise, idx) => (
                  <li key={idx}>
                    <strong>{exercise.name}</strong> - {exercise.sets}組 × {exercise.reps}次
                    {exercise.restTime && ` (休息: ${exercise.restTime})`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkoutList
