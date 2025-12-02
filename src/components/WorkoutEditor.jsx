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
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState('')

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

  const handleExerciseInput = (index, field, value) => {
    // 允許空值，方便使用者刪除輸入
    if (value === '') {
      updateExercise(index, field, '')
      return
    }

    const num = parseFloat(value)
    if (!isNaN(num)) {
      updateExercise(index, field, num)
    }
  }

  const handleRestTimeInput = (index, value, unit) => {
    // 允許空值
    if (value === '') {
      // 保持單位，但數值為空字串，我們需要一個特殊的表示方式或者直接存空字串
      // 但因為 restTime 格式是 "數值+單位"，如果數值為空，會變成 "單位" (如 "秒")
      // 這裡我們暫時存成只剩單位，解析時要小心
      updateExercise(index, 'restTime', unit) 
      return
    }
    
    updateExercise(index, 'restTime', `${value}${unit}`)
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

  const handleIncrement = (index, field, currentValue, step = 1) => {
    let num = parseFloat(currentValue) || 0
    // For sets/reps, ensure integer
    if (field === 'sets' || field === 'reps') {
      num = parseInt(currentValue) || 0
    }
    
    // 如果當前是空值或0，且要減少，不處理或設為最小
    if ((!currentValue || num === 0) && step < 0) {
      // 保持0或空值，或者設為最小值
      num = 0
    }
    
    const newVal = num + step
    
    // Min constraints
    let min = 0
    if (field === 'sets' || field === 'reps') min = 1
    
    updateExercise(index, field, Math.max(min, newVal))
  }

  const handleRestTimeIncrement = (index, currentRestTimeStr, direction) => {
    const { value, unit } = parseRestTimeValue(currentRestTimeStr)
    const num = parseFloat(value) || 0
    const step = unit === '分' ? 1 : 5
    const newVal = Math.max(0, num + (step * direction))
    updateExercise(index, 'restTime', `${newVal}${unit}`)
  }

  // 解析 CSV 格式的文字並轉換成動作資料
  const parseImportText = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    // 跳過標題行（如果第一行包含「運動項目」等關鍵字）
    const headerKeywords = ['運動項目', '目標', '組數', '次數', '休息', '備註']
    const isHeader = (line) => headerKeywords.some(keyword => line.includes(keyword))
    
    let startIndex = 0
    if (isHeader(lines[0])) {
      startIndex = 1
    }

    const exercises = []
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // 解析 CSV 行（處理逗號分隔）
      const parts = line.split(',').map(p => p.trim())
      
      if (parts.length < 3) continue // 至少需要動作名稱、組數次數、休息時間

      const exerciseName = parts[0] || ''
      // parts[1] 是目標，我們暫時不用
      const setsReps = parts[2] || '' // 例如：4 組×4∼6 次
      const restTime = parts[3] || '' // 例如：90∼120 秒
      // parts[4] 是備註，我們暫時不用

      // 解析組數和次數
      let sets = 3
      let reps = 10
      
      // 處理格式：4 組×4∼6 次 或 4組×8次 或 4組 x 8次 等
      // 支援多種分隔符號：×、x、X、* 等
      const setsRepsMatch = setsReps.match(/(\d+)\s*組\s*[×xX*]\s*(\d+)(?:[∼~～-](\d+))?\s*次/)
      if (setsRepsMatch) {
        sets = parseInt(setsRepsMatch[1]) || 3
        // 如果有範圍（如 4∼6），取平均值
        if (setsRepsMatch[3]) {
          const min = parseInt(setsRepsMatch[2]) || 10
          const max = parseInt(setsRepsMatch[3]) || 10
          reps = Math.floor((min + max) / 2) // 取平均值
        } else {
          reps = parseInt(setsRepsMatch[2]) || 10
        }
      } else {
        // 嘗試更寬鬆的格式：只找數字
        const numbers = setsReps.match(/\d+/g)
        if (numbers && numbers.length >= 2) {
          sets = parseInt(numbers[0]) || 3
          reps = parseInt(numbers[1]) || 10
        }
      }

      // 解析休息時間
      let restTimeStr = '30秒'
      if (restTime) {
        // 處理格式：90∼120 秒 或 90-120秒 或 90秒 或 1.5分 等
        // 支援範圍值（取平均值）和單一值
        const restMatch = restTime.match(/(\d+(?:\.\d+)?)(?:[∼~～-](\d+(?:\.\d+)?))?\s*(秒|分|分鐘)/)
        if (restMatch) {
          const unit = restMatch[3] === '分鐘' ? '分' : restMatch[3]
          if (restMatch[2]) {
            // 有範圍，取平均值
            const min = parseFloat(restMatch[1]) || 30
            const max = parseFloat(restMatch[2]) || 30
            const avg = Math.floor((min + max) / 2)
            restTimeStr = `${avg}${unit}`
          } else {
            // 單一值
            const value = parseFloat(restMatch[1]) || 30
            // 如果是小數，保持小數；否則轉為整數
            restTimeStr = value % 1 === 0 ? `${Math.floor(value)}${unit}` : `${value}${unit}`
          }
        } else {
          // 嘗試直接解析數字+單位
          const simpleMatch = restTime.match(/(\d+(?:\.\d+)?)\s*(秒|分|分鐘)/)
          if (simpleMatch) {
            const unit = simpleMatch[2] === '分鐘' ? '分' : simpleMatch[2]
            const value = parseFloat(simpleMatch[1]) || 30
            restTimeStr = value % 1 === 0 ? `${Math.floor(value)}${unit}` : `${value}${unit}`
          } else {
            // 如果只有數字，假設是秒
            const numMatch = restTime.match(/(\d+)/)
            if (numMatch) {
              restTimeStr = `${numMatch[1]}秒`
            }
          }
        }
      }

      exercises.push({
        name: exerciseName,
        sets: sets,
        reps: reps,
        restTime: restTimeStr,
        startingWeight: ''
      })
    }

    return exercises
  }

  const handleImport = () => {
    if (!importText.trim()) {
      alert('請貼上要匯入的資料')
      return
    }

    const importedExercises = parseImportText(importText)
    
    if (importedExercises.length === 0) {
      alert('無法解析貼上的資料，請確認格式是否正確')
      return
    }

    // 將匯入的動作加入到現有動作列表
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, ...importedExercises]
    })

    setShowImportDialog(false)
    setImportText('')
    alert(`成功匯入 ${importedExercises.length} 個動作`)
  }

  return (
    <div>
      <div className="nav-bar">
        <Link to="/workouts" className="btn-nav">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回
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
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowImportDialog(true)}
                >
                  📋 貼上匯入
                </button>
                <button className="btn btn-primary" onClick={addExercise}>
                  + 添加動作
                </button>
              </div>
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
                      <div className="input-group">
                        <button 
                          className="btn-control"
                          onClick={() => handleIncrement(index, 'sets', exercise.sets, -1)}
                        >−</button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseInput(index, 'sets', e.target.value)}
                          className="form-input"
                        />
                        <button 
                          className="btn-control"
                          onClick={() => handleIncrement(index, 'sets', exercise.sets, 1)}
                        >+</button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>次數</label>
                      <div className="input-group">
                        <button 
                          className="btn-control"
                          onClick={() => handleIncrement(index, 'reps', exercise.reps, -1)}
                        >−</button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          value={exercise.reps}
                          onChange={(e) => handleExerciseInput(index, 'reps', e.target.value)}
                          className="form-input"
                        />
                        <button 
                          className="btn-control"
                          onClick={() => handleIncrement(index, 'reps', exercise.reps, 1)}
                        >+</button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>休息時間</label>
                      <div className="input-group">
                        <button 
                          className="btn-control"
                          onClick={() => handleRestTimeIncrement(index, exercise.restTime, -1)}
                        >−</button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          value={restValue}
                          onChange={(e) => handleRestTimeInput(index, e.target.value, restUnit)}
                          placeholder="30"
                          className="form-input"
                        />
                        <button 
                          className="btn-control"
                          onClick={() => handleRestTimeIncrement(index, exercise.restTime, 1)}
                        >+</button>
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
                        <button 
                          className="btn-control"
                          onClick={() => handleIncrement(index, 'startingWeight', exercise.startingWeight, -1)}
                        >−</button>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={exercise.startingWeight || ''}
                          onChange={(e) => updateExercise(index, 'startingWeight', e.target.value)}
                          placeholder="例如：20"
                          className="form-input"
                        />
                        <button 
                          className="btn-control"
                          onClick={() => handleIncrement(index, 'startingWeight', exercise.startingWeight, 1)}
                        >+</button>
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

      {showImportDialog && (
        <div className="dialog-overlay" onClick={() => setShowImportDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h2>貼上匯入課表</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              請貼上 CSV 格式的課表資料，系統會自動解析動作名稱、組數、次數和休息時間。
            </p>
            <div className="form-group">
              <label>貼上資料</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`運動項目,目標,組數 × 次數,組間休息時間,備註
槓鈴臥推,力量與肌肉維持,4 組×4∼6 次,90∼120 秒,優先執行
上斜啞鈴臥推,胸部上緣,3 組×8 次,90 秒,-`}
                className="form-input"
                style={{ 
                  minHeight: '200px', 
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>
            <div className="dialog-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportText('')
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleImport}
              >
                匯入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutEditor
