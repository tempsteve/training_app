import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import WorkoutList from './components/WorkoutList'
import WorkoutEditor from './components/WorkoutEditor'
import TrainingSession from './components/TrainingSession'
import TrainingSummary from './components/TrainingSummary'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workouts" element={<WorkoutList />} />
          <Route path="/workouts/new" element={<WorkoutEditor />} />
          <Route path="/workouts/edit/:id" element={<WorkoutEditor />} />
          <Route path="/train/:id" element={<TrainingSession />} />
          <Route path="/summary" element={<TrainingSummary />} />
        </Routes>
      </div>
    </Router>
  )
}

function Home() {
  const navigate = useNavigate()
  
  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🏋️ 運動訓練助手</h1>
        <p className="subtitle">建立你的專屬訓練課表，記錄每一次的進步</p>
        
        <div className="home-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/workouts')}
          >
            查看課表
          </button>
          <button 
            className="btn btn-secondary btn-large"
            onClick={() => navigate('/workouts/new')}
          >
            建立新課表
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
