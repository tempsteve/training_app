import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { loadWorkouts, saveWorkouts, loadUserSettings } from '../utils/storage'
import CustomSelect from './CustomSelect'
import './WorkoutEditor.css'

function WorkoutEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  const [userSettings, setUserSettings] = useState({ weightUnit: 'kg' })
  
  const [workout, setWorkout] = useState({
    name: '',
    exercises: []
  })

  useEffect(() => {
    const settings = loadUserSettings()
    setUserSettings(settings)

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
        restTime: '30秒',
        startingWeight: ''
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

  const parseRestTimeValue = (restTime) => {
    if (!restTime) return { value: '', unit: '秒' }
    
    // 處理 "30秒", "2分鐘", "1.5分" 等格式
    // 這裡我們簡化為：如果有 "分" 或 "分鐘" 就是分鐘，否則就是秒
    // 提取數字部分
    const valueMatch = restTime.match(/[\d.]+/)
    const value = valueMatch ? valueMatch[0] : ''
    
    let unit = '秒'
    if (restTime.includes('分')) {
      unit = '分'
    }
    
    return { value, unit }
  }

  return (
    <div>
      <div className="nav-bar">
        <Link to="/workouts" className="btn-nav">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回列表
        </Link>
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

            {workout.exercises.map((exercise, index) => {
              const { value: restValue, unit: restUnit } = parseRestTimeValue(exercise.restTime)
              
              return (
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
                      <div className="input-group">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={restValue}
                          onChange={(e) => {
                            const val = e.target.value
                            updateExercise(index, 'restTime', val ? `${val}${restUnit}` : `0${restUnit}`)
                          }}
                          placeholder="30"
                          className="form-input"
                        />
                        <div className="input-group-append" style={{ width: '90px' }}>
                          <CustomSelect
                            value={restUnit}
                            onChange={(newUnit) => {
                              updateExercise(index, 'restTime', `${restValue}${newUnit}`)
                            }}
                            options={[
                              { value: '秒', label: '秒' },
                              { value: '分', label: '分' }
                            ]}
                            className="unit-selector"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>起始重量</label>
                      <div className="input-group">
                        <input
                          type="text"
                          value={exercise.startingWeight || ''}
                          onChange={(e) => updateExercise(index, 'startingWeight', e.target.value)}
                          placeholder="例如：20"
                          className="form-input"
                        />
                        <div className="form-addon-unit">
                          {userSettings.weightUnit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )})}

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
