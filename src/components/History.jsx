import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadTrainingHistory, deleteTrainingRecord, clearTrainingHistory, loadUserSettings } from '../utils/storage'
import { formatTime } from '../utils/time'
import { calculateCalories } from '../utils/calories'
import './History.css'

function History() {
  const [history, setHistory] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [userSettings, setUserSettings] = useState(null)

  useEffect(() => {
    const settings = loadUserSettings()
    setUserSettings(settings)
  }, [])

  const loadHistory = () => {
    const data = loadTrainingHistory()
    // Sort by date descending (newest first)
    data.sort((a, b) => new Date(b.date) - new Date(a.date))
    setHistory(data)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDelete = (id) => {
    if (window.confirm('確定要刪除這筆訓練記錄嗎？')) {
      deleteTrainingRecord(id)
      loadHistory()
      if (expandedId === id) {
        setExpandedId(null)
      }
    }
  }

  const handleClearAll = () => {
    if (window.confirm('確定要清除所有訓練記錄嗎？此操作無法復原。')) {
      clearTrainingHistory()
      loadHistory()
      setExpandedId(null)
    }
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Group records by exercise name for detailed view
  const groupRecords = (records) => {
    return records.reduce((acc, record) => {
      if (!acc[record.exerciseName]) {
        acc[record.exerciseName] = []
      }
      acc[record.exerciseName].push(record)
      return acc
    }, {})
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
      </div>
      
      <div className="history-container">
        <div className="history-header-section">
          <h1 className="page-title">訓練記錄</h1>
          {history.length > 0 && (
            <button 
              className="btn btn-danger btn-small"
              onClick={handleClearAll}
            >
              清除全部
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="empty-history-icon">📅</div>
            <h2>還沒有訓練記錄</h2>
            <p>開始你的第一次訓練吧！</p>
            <Link to="/workouts" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
              前往課表
            </Link>
          </div>
        ) : (
          <div className="history-list">
            {history.map(session => {
              const calories = userSettings ? calculateCalories(session.records, userSettings, session.totalTime) : null
              return (
              <div key={session.id} className="history-card">
                <div className="history-header">
                  <div className="history-title-group">
                    <div className="history-date">{formatDate(session.date)}</div>
                    <h2 className="history-name">{session.workoutName}</h2>
                  </div>
                  <button 
                    className="history-delete-btn"
                    onClick={() => handleDelete(session.id)}
                    title="刪除這筆記錄"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="history-stats">
                  <div className="history-stat-item">
                    <span className="history-stat-label">總時間</span>
                    <span className="history-stat-value">{formatTime(session.totalTime)}</span>
                  </div>
                  <div className="history-stat-item">
                    <span className="history-stat-label">總組數</span>
                    <span className="history-stat-value">{session.records.length}</span>
                  </div>
                  <div className="history-stat-item">
                    <span className="history-stat-label">動作數</span>
                    <span className="history-stat-value">
                      {new Set(session.records.map(r => r.exerciseName)).size}
                    </span>
                  </div>
                  {calories !== null && (
                    <div className="history-stat-item">
                      <span className="history-stat-label">卡路里</span>
                      <span className="history-stat-value">
                        {calories} kcal
                      </span>
                    </div>
                  )}
                </div>
                
                <button 
                  className="history-toggle-btn"
                  onClick={() => toggleExpand(session.id)}
                >
                  {expandedId === session.id ? '收起詳細內容' : '查看詳細內容'}
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ transform: expandedId === session.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                {expandedId === session.id && (
                  <div className="history-details">
                    <div className="history-records-list">
                      {Object.entries(groupRecords(session.records)).map(([name, exerciseRecords]) => {
                        const firstRecord = exerciseRecords[0];
                        const targetReps = firstRecord.targetReps ? ` (${firstRecord.targetReps}下)` : '';
                        
                        return (
                        <div key={name} className="history-exercise-group">
                          <h4>{name}{targetReps}</h4>
                          <div className="history-sets">
                            {exerciseRecords.map((record, idx) => {
                              const weightText = record.weight ? `${record.weight}${record.unit}` : ''
                              const timeText = !record.weight && record.exerciseTime ? formatTime(record.exerciseTime) : ''
                              
                              return (
                                <span key={idx} className="history-set-tag">
                                  {weightText && <div className="set-weight-text">{weightText}</div>}
                                  {timeText && <div>{timeText}</div>}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    </div>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default History

