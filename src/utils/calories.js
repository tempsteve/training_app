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
 * @param {number} userWeight - 使用者體重 (kg)，用於計算相對強度
 * @returns {number} MET 值
 */
const estimateMET = (exerciseName, weight, reps, unit, userWeight = 70) => {
  // 如果沒有重量資訊，使用預設的中等強度重量訓練 MET 值
  if (!weight || weight === 0) {
    return 5.0 // 中等強度重量訓練（提高預設值）
  }
  
  // 轉換重量為 kg（如果單位是 lbs）
  let weightInKg = weight
  if (unit === 'lbs') {
    weightInKg = weight * 0.453592
  }
  
  // 根據動作名稱判斷是否為高強度動作（複合動作通常強度更高）
  const name = exerciseName.toLowerCase()
  const isHighIntensityExercise = name.includes('深蹲') || name.includes('硬舉') || 
                                  name.includes('squat') || name.includes('deadlift') ||
                                  name.includes('腿推') || name.includes('leg press') ||
                                  name.includes('臥推') || name.includes('bench') ||
                                  name.includes('肩推') || name.includes('press')
  
  // 計算相對強度（相對於使用者體重）
  // 對於上肢動作，使用較低的基準；對於下肢動作，使用較高的基準
  const isLowerBody = name.includes('深蹲') || name.includes('硬舉') || 
                     name.includes('squat') || name.includes('deadlift') ||
                     name.includes('腿推') || name.includes('leg press')
  
  // 估算相對強度：重量相對於體重的比例
  const relativeIntensity = weightInKg / userWeight
  
  // 根據相對強度和次數判斷強度
  // 高強度：相對強度 > 0.5 或次數 < 8
  // 中強度：相對強度 0.3-0.5 或次數 8-12
  // 低強度：相對強度 < 0.3 或次數 > 12
  const isHeavy = relativeIntensity > 0.5 || (reps && reps < 8)
  const isModerate = (relativeIntensity >= 0.3 && relativeIntensity <= 0.5) || 
                     (reps && reps >= 8 && reps <= 12)
  
  // 根據動作類型和強度分配 MET 值
  // 研究顯示：重量訓練的 MET 值範圍為 5.0-8.0
  if (isHighIntensityExercise && isHeavy) {
    return 7.5 // 高強度複合動作（深蹲、硬舉等）
  } else if (isHighIntensityExercise && isModerate) {
    return 6.5 // 中高強度複合動作
  } else if (isHighIntensityExercise) {
    return 6.0 // 複合動作（即使較輕）
  } else if (isHeavy) {
    return 6.5 // 高強度孤立動作
  } else if (isModerate) {
    return 5.5 // 中等強度
  } else {
    return 5.0 // 輕度到中等強度
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
  
  // 計算基礎代謝率（BMR）
  const bmr = calculateBMR(weight, height, age, gender)
  const bmrPerSecond = bmr ? bmr / 86400 : 0 // BMR 每秒消耗（一天86400秒）
  
  // 計算總卡路里消耗
  // 標準公式：卡路里 = 體重(kg) × MET × 時間(小時)
  // 但 MET 值已經包含了 BMR，所以我們需要計算淨運動消耗
  let totalCalories = 0
  let totalExerciseTime = 0
  
  // 方法1：根據每組的運動時間和 MET 值計算
  records.forEach(record => {
    const exerciseTime = record.exerciseTime || 0
    if (exerciseTime > 0) {
      const recordWeight = record.weight ? parseFloat(record.weight) : 0
      const reps = record.targetReps || 0
      const unit = record.unit || 'kg'
      
      const met = estimateMET(record.exerciseName, recordWeight, reps, unit, weight)
      const hours = exerciseTime / 3600
      
      // MET 值已經包含了基礎代謝，所以直接使用標準公式
      // 卡路里 = 體重(kg) × MET × 時間(小時)
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
      const met = estimateMET(record.exerciseName, recordWeight, reps, unit, weight)
      totalMET += met
      count++
    })
    
    if (count > 0 && totalTime > 0) {
      const avgMET = totalMET / count
      // 對於重量訓練，實際運動時間約為總時間的 50-60%
      // 這裡使用 55% 作為估算（包含組間休息的輕微活動和準備時間）
      // 這個比例更接近實際情況，因為組間休息時身體仍在消耗能量
      const estimatedExerciseTime = totalTime * 0.55
      const hours = estimatedExerciseTime / 3600
      totalCalories = weight * avgMET * hours
    }
  }
  
  // 確保至少有一些基本消耗（即使是短時間訓練）
  if (totalCalories < 10 && totalTime >= 60) {
    // 最小消耗：使用中等強度運動 MET 值（5.0）和總時間的 50% 作為運動時間
    const minExerciseTime = totalTime * 0.5
    const hours = minExerciseTime / 3600
    const minCalories = weight * 5.0 * hours
    totalCalories = Math.max(totalCalories, minCalories)
  }
  
  // 加入運動後過量氧耗（EPOC）的貢獻
  // 研究顯示：高強度重量訓練後的 EPOC 可以增加 10-20% 的總消耗
  // 這裡使用 15% 作為平均值
  const epocMultiplier = 1.15
  totalCalories = totalCalories * epocMultiplier
  
  // 注意：MET 值已經包含了基礎代謝率（MET=1 代表靜息狀態）
  // 所以計算出的 totalCalories 已經包含了訓練期間的基礎代謝
  // 不需要額外加上 BMR
  
  return Math.round(totalCalories)
}

