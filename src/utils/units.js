// 根據動作類型判斷量詞
export const getUnitForExercise = (exerciseName) => {
  const name = exerciseName.toLowerCase()
  
  // 重量相關（公斤、磅）
  if (name.includes('深蹲') || name.includes('硬舉') || name.includes('臥推') || 
      name.includes('划船') || name.includes('肩推') || name.includes('彎舉') ||
      name.includes('三頭') || name.includes('二頭') || name.includes('推舉')) {
    return 'kg'
  }
  
  // 距離相關（公里、公尺）
  if (name.includes('跑步') || name.includes('慢跑') || name.includes('快走')) {
    return 'km'
  }
  
  // 速度相關（km/h）
  if (name.includes('腳踏車') || name.includes('單車') || name.includes('飛輪')) {
    return 'km/h'
  }
  
  // 時間相關（分鐘）
  if (name.includes('平板') || name.includes('plank') || name.includes('支撐')) {
    return '秒'
  }
  
  // 預設：次數（無單位，或使用「次」）
  return '次'
}
