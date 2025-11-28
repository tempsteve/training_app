// 根據動作類型判斷量詞
export const getUnitForExercise = (exerciseName) => {
  const name = exerciseName.toLowerCase()
  
  // 距離相關（公里、公尺）
  if (name.includes('跑步') || name.includes('慢跑') || name.includes('快走')) {
    return 'km'
  }
  
  // 速度相關（km/h）
  if (name.includes('腳踏車') || name.includes('單車') || name.includes('飛輪')) {
    return 'km/h'
  }
  
  // 時間相關（分鐘/秒）
  if (name.includes('平板') || name.includes('plank') || name.includes('支撐') || name.includes('靜止')) {
    return '秒'
  }
  
  // 明確的重量訓練關鍵字
  if (name.includes('深蹲') || name.includes('硬舉') || name.includes('臥推') || 
      name.includes('划船') || name.includes('肩推') || name.includes('彎舉') ||
      name.includes('三頭') || name.includes('二頭') || name.includes('推舉') ||
      name.includes('飛鳥') || name.includes('下拉') || name.includes('腿推') ||
      name.includes('舉') || name.includes('press') || name.includes('squat') ||
      name.includes('deadlift') || name.includes('row') || name.includes('curl')) {
    return 'weight' // 特殊標記，表示應使用重量單位
  }
  
  // 如果沒有特殊關鍵字，但看起來不像是上述類型，我們預設為重量訓練（因為這是訓練記錄App）
  // 除非它是明顯的徒手動作（這很難判斷），否則大多數動作都有重量或次數
  // 這裡回傳 'weight_or_reps' 讓前端決定
  return 'weight_or_reps'
}
