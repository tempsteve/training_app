import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { loadWorkouts, saveWorkouts } from '../utils/storage'
import './WorkoutEditor.css'

function WorkoutEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const [workout, setWorkout] = useState({
    name: '',
    exercises: []
  })

  useEffect(() => {
    if (isEditing) {
      const workouts = loadWorkouts()
      const found = workouts.find(w => w.id === id)
      if (found) {
        setWorkout(found)
      } else {
        navigate('/workouts')
      }
    }
  }, [id, isEditing, navigate])

  const handleNameChange = (e) => {
    setWorkout({ ...workout, name: e.target.value })
  }

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, {
        name: '',
        sets: 3,
        reps: 10,
        restTime: '30秒'
      }]
    })
  }

  const updateExercise = (index, field, value) => {
    const updated = [...workout.exercises]
    updated[index] = { ...updated[index], [field]: value }
    setWorkout({ ...workout, exercises: updated })
  }

  const removeExercise = (index) => {
    const updated = workout.exercises.filter((_, i) => i !== index)
    setWorkout({ ...workout, exercises: updated })
  }

  const handleSave = () => {
    if (!workout.name.trim()) {
      alert('請輸入課表名稱')
      return
    }

    if (workout.exercises.length === 0) {
      alert('請至少添加一個動作')
      return
    }

    if (workout.exercises.some(ex => !ex.name.trim())) {
      alert('請填寫所有動作名稱')
      return
    }

    const workouts = loadWorkouts()
    
    if (isEditing) {
      const updated = workouts.map(w => 
        w.id === id ? { ...workout, id } : w
      )
      saveWorkouts(updated)
    } else {
      const newWorkout = {
        ...workout,
        id: Date.now().toString()
      }
      saveWorkouts([...workouts, newWorkout])
    }

    navigate('/workouts')
  }

  return (
    <div>
      <div className="nav-bar">
        <Link to="/workouts" className="nav-title">← 返回課表列表</Link>
      </div>
      <div className="container">
        <div className="card">
          <h1 className="card-title">{isEditing ? '編輯課表' : '建立新課表'}</h1>
          
          <div className="form-group">
            <label>課表名稱</label>
            <input
              type="text"
              value={workout.name}
              onChange={handleNameChange}
              placeholder="例如：胸肌訓練"
              className="form-input"
            />
          </div>

          <div className="exercises-section">
            <div className="section-header">
              <h2>動作列表</h2>
              <button className="btn btn-primary" onClick={addExercise}>
                + 添加動作
              </button>
            </div>

            {workout.exercises.map((exercise, index) => (
              <div key={index} className="exercise-item">
                <div className="exercise-header">
                  <h3>動作 {index + 1}</h3>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => removeExercise(index)}
                  >
                    刪除
                  </button>
                </div>
                
                <div className="exercise-form">
                  <div className="form-group">
                    <label>動作名稱</label>
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="例如：深蹲、臥推、跑步"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>組數</label>
                      <input
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>次數</label>
                      <input
                        type="number"
                        min="1"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>休息時間</label>
                      <input
                        type="text"
                        value={exercise.restTime}
                        onChange={(e) => updateExercise(index, 'restTime', e.target.value)}
                        placeholder="例如：30秒、2分鐘、1分30秒"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {workout.exercises.length === 0 && (
              <div className="empty-exercises">
                <p>還沒有添加動作，點擊「添加動作」開始建立</p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/workouts')}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              儲存課表
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkoutEditor
