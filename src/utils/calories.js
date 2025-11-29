// 卡路里計算工具函數

/**
 * 計算基礎代謝率 (BMR) - 使用 Mifflin-St Jeor 公式
 * @param {number} weight - 體重 (kg)
 * @param {number} height - 身高 (cm)
 * @param {number} age - 年齡
 * @param {string} gender - 性別 ('male', 'female', 'other')
 * @returns {number} BMR (kcal/day)
 */
export const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return null
  
  // 轉換身高為公尺
  const heightInM = height / 100
  
  // Mifflin-St Jeor 公式
  let bmr = 10 * weight + 6.25 * (heightInM * 100) - 5 * age
  
  // 根據性別調整
  if (gender === 'male') {
    bmr += 5
  } else if (gender === 'female') {
    bmr -= 161
  } else {
    // 其他性別，使用平均值
    bmr -= 78
  }
  
  return bmr
}

/**
 * 根據動作類型、重量、次數估算 MET 值（代謝當量）
 * @param {string} exerciseName - 動作名稱
 * @param {number} weight - 重量 (kg)
 * @param {number} reps - 次數
 * @param {string} unit - 單位
 * @returns {number} MET 值
 */
const estimateMET = (exerciseName, weight, reps, unit) => {
  // 如果沒有重量資訊，使用預設的輕度重量訓練 MET 值
  if (!weight || weight === 0) {
    return 3.5 // 輕度重量訓練
  }
  
  // 轉換重量為 kg（如果單位是 lbs）
  let weightInKg = weight
  if (unit === 'lbs') {
    weightInKg = weight * 0.453592
  }
  
  // 根據動作名稱判斷是否為高強度動作
  const name = exerciseName.toLowerCase()
  const isHighIntensity = name.includes('深蹲') || name.includes('硬舉') || 
                         name.includes('squat') || name.includes('deadlift') ||
                         name.includes('腿推') || name.includes('leg press')
  
  // 估算相對強度（簡化版：假設一般人的 1RM 約為體重的 1-2 倍）
  // 這裡使用一個簡化的估算：如果重量 > 50kg 或次數 < 8，視為高強度
  const isHeavy = weightInKg > 50 || (reps && reps < 8)
  
  if (isHighIntensity && isHeavy) {
    return 6.0 // 重度重量訓練
  } else if (isHeavy || (reps && reps < 12)) {
    return 5.0 // 中度重量訓練
  } else {
    return 4.0 // 輕度到中度重量訓練
  }
}

/**
 * 計算單次訓練的卡路里消耗
 * @param {Array} records - 訓練記錄陣列
 * @param {Object} userSettings - 使用者設定
 * @param {number} totalTime - 總訓練時間（秒）
 * @returns {number|null} 卡路里消耗（kcal），如果資料不足則返回 null
 */
export const calculateCalories = (records, userSettings, totalTime) => {
  // 檢查是否有足夠的使用者資料
  if (!userSettings.height || !userSettings.weight || !userSettings.birthYear || 
      userSettings.gender === 'unknown') {
    return null
  }
  
  let weight = parseFloat(userSettings.weight)
  const height = parseFloat(userSettings.height)
  const birthYear = parseInt(userSettings.birthYear)
  const gender = userSettings.gender
  
  if (!weight || !height || !birthYear) {
    return null
  }
  
  // 如果體重單位是 lbs，轉換為 kg
  if (userSettings.weightUnit === 'lbs') {
    weight = weight * 0.453592
  }
  
  // 計算年齡
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear
  
  if (age < 0 || age > 120) {
    return null
  }
  
  // 計算總卡路里消耗
  // 標準公式：卡路里 = 體重(kg) × MET × 時間(小時)
  let totalCalories = 0
  let totalExerciseTime = 0
  
  // 方法1：根據每組的運動時間和 MET 值計算
  records.forEach(record => {
    const exerciseTime = record.exerciseTime || 0
    if (exerciseTime > 0) {
      const recordWeight = record.weight ? parseFloat(record.weight) : 0
      const reps = record.targetReps || 0
      const unit = record.unit || 'kg'
      
      const met = estimateMET(record.exerciseName, recordWeight, reps, unit)
      const hours = exerciseTime / 3600
      
      // 標準卡路里計算公式：體重(kg) × MET × 時間(小時)
      totalCalories += weight * met * hours
      totalExerciseTime += exerciseTime
    }
  })
  
  // 方法2：如果運動時間記錄不足或太短，使用總時間和平均 MET 值估算
  // 對於重量訓練，如果每組運動時間太短，可能不準確
  // 此時使用總時間來估算會更合理
  if (totalCalories === 0 || (totalExerciseTime > 0 && totalExerciseTime < totalTime * 0.2)) {
    // 計算平均 MET 值
    let totalMET = 0
    let count = 0
    
    records.forEach(record => {
      const recordWeight = record.weight ? parseFloat(record.weight) : 0
      const reps = record.targetReps || 0
      const unit = record.unit || 'kg'
      const met = estimateMET(record.exerciseName, recordWeight, reps, unit)
      totalMET += met
      count++
    })
    
    if (count > 0 && totalTime > 0) {
      const avgMET = totalMET / count
      // 對於重量訓練，實際運動時間約為總時間的 30-50%
      // 這裡使用 40% 作為估算（包含組間休息的輕微活動）
      const estimatedExerciseTime = totalTime * 0.4
      const hours = estimatedExerciseTime / 3600
      totalCalories = weight * avgMET * hours
    }
  }
  
  // 確保至少有一些基本消耗（即使是短時間訓練）
  // 10分鐘的訓練不應該只有1-2 kcal
  if (totalCalories < 5 && totalTime >= 60) {
    // 最小消耗：使用輕度運動 MET 值（3.5）和總時間的 30% 作為運動時間
    const minExerciseTime = totalTime * 0.3
    const hours = minExerciseTime / 3600
    const minCalories = weight * 3.5 * hours
    // 使用較大值，確保短時間訓練也有合理的消耗
    totalCalories = Math.max(totalCalories, minCalories)
  }
  
  return Math.round(totalCalories)
}

