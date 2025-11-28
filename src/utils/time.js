// 時間格式化工具
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const parseRestTime = (restTime) => {
  // restTime格式: "30秒" 或 "2分鐘" 或 "1分30秒"
  const timeStr = restTime.trim()
  
  if (timeStr.includes('分鐘') || timeStr.includes('分')) {
    const parts = timeStr.split(/[分分鐘]/)
    let totalSeconds = 0
    
    if (parts.length >= 2) {
      const minutes = parseInt(parts[0]) || 0
      const secondsPart = parts[1].replace('秒', '').trim()
      const seconds = parseInt(secondsPart) || 0
      totalSeconds = minutes * 60 + seconds
    } else {
      totalSeconds = parseInt(parts[0]) * 60 || 0
    }
    
    return totalSeconds
  } else if (timeStr.includes('秒')) {
    return parseInt(timeStr.replace('秒', '')) || 0
  }
  
  // 預設值
  return 30
}

export const formatRestTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) {
    return `${mins}分鐘`
  }
  return `${mins}分${secs}秒`
}
