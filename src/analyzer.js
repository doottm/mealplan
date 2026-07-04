// 로컬 영양 성분 데이터베이스 (가상 대표 1회 제공량 기준)
const FOOD_DATABASE = {
  // 탄수화물 위주 (곡류/구황작물/과일)
  '현미밥': { kcal: 300, carb: 65, protein: 6, fat: 1, type: 'healthy', baseUnit: '공기' },
  '백미밥': { kcal: 300, carb: 66, protein: 6, fat: 0.8, type: 'neutral', baseUnit: '공기' },
  '쌀밥': { kcal: 310, carb: 68, protein: 5, fat: 1, type: 'neutral', baseUnit: '공기' },
  '공기밥': { kcal: 310, carb: 68, protein: 5, fat: 1, type: 'neutral', baseUnit: '공기' },
  '밥': { kcal: 300, carb: 66, protein: 5.5, fat: 0.9, type: 'neutral', baseUnit: '공기' }, // 일반 밥 매칭 추가
  '고구마': { kcal: 150, carb: 35, protein: 2, fat: 0.5, type: 'healthy', baseUnit: '개' },
  '감자': { kcal: 110, carb: 26, protein: 2, fat: 0.2, type: 'healthy', baseUnit: '개' },
  '오트밀': { kcal: 180, carb: 32, protein: 6, fat: 3, type: 'healthy', baseUnit: '그릇' },
  '사과': { kcal: 100, carb: 25, protein: 0.5, fat: 0.2, type: 'healthy', baseUnit: '개' },
  '바나나': { kcal: 100, carb: 26, protein: 1, fat: 0.3, type: 'healthy', baseUnit: '개' },
  '토마토': { kcal: 35, carb: 8, protein: 1.5, fat: 0.2, type: 'healthy', baseUnit: '개' },
  '식빵': { kcal: 100, carb: 20, protein: 3.5, fat: 1, type: 'neutral', baseUnit: '장' }, // 1장 기준 100kcal
  '통밀빵': { kcal: 120, carb: 22, protein: 5, fat: 1.2, type: 'healthy', baseUnit: '장' },
  '파스타': { kcal: 650, carb: 85, protein: 18, fat: 22, type: 'neutral', baseUnit: '인분' }, // 1인분 조리 실기준 칼로리 보정 (650kcal)
  '스파게티': { kcal: 650, carb: 85, protein: 18, fat: 22, type: 'neutral', baseUnit: '인분' },
  '토마토파스타': { kcal: 580, carb: 80, protein: 16, fat: 18, type: 'neutral', baseUnit: '인분' },
  '크림파스타': { kcal: 780, carb: 85, protein: 20, fat: 34, type: 'junk', baseUnit: '인분' },
  '오일파스타': { kcal: 620, carb: 80, protein: 14, fat: 26, type: 'neutral', baseUnit: '인분' },
  '칼국수': { kcal: 550, carb: 105, protein: 17, fat: 5, type: 'neutral', baseUnit: '인분' },
  '수제비': { kcal: 500, carb: 95, protein: 13, fat: 4, type: 'neutral', baseUnit: '인분' },
  '국수': { kcal: 420, carb: 88, protein: 11, fat: 1.5, type: 'neutral', baseUnit: '인분' },

  // 단백질 위주 (육류/어류/알류/콩류)
  '닭가슴살': { kcal: 120, carb: 0, protein: 26, fat: 1.5, type: 'healthy', baseUnit: '팩' },
  '삶은계란': { kcal: 75, carb: 0.5, protein: 6.5, fat: 5, type: 'healthy', baseUnit: '개' },
  '계란': { kcal: 75, carb: 0.5, protein: 6.5, fat: 5, type: 'healthy', baseUnit: '개' },
  '달걀': { kcal: 75, carb: 0.5, protein: 6.5, fat: 5, type: 'healthy', baseUnit: '개' },
  '두부': { kcal: 80, carb: 2, protein: 8, fat: 4.5, type: 'healthy', baseUnit: '모' },
  '연어': { kcal: 160, carb: 0, protein: 20, fat: 9, type: 'healthy', baseUnit: '조각' },
  '소고기': { kcal: 220, carb: 0, protein: 22, fat: 14, type: 'neutral', baseUnit: '인분' },
  '돼지고기': { kcal: 240, carb: 0, protein: 20, fat: 17, type: 'neutral', baseUnit: '인분' },
  '소세지': { kcal: 180, carb: 2, protein: 10, fat: 15, type: 'neutral', baseUnit: '개' },
  '소시지': { kcal: 180, carb: 2, protein: 10, fat: 15, type: 'neutral', baseUnit: '개' },
  '햄': { kcal: 250, carb: 2, protein: 15, fat: 20, type: 'neutral', baseUnit: 'g' },
  '닭고기': { kcal: 180, carb: 0, protein: 22, fat: 10, type: 'neutral', baseUnit: '인분' },
  '생선구이': { kcal: 320, carb: 1, protein: 32, fat: 18, type: 'healthy', baseUnit: '인분' }, // 생선구이 추가 (320kcal)
  '생선': { kcal: 250, carb: 0.5, protein: 28, fat: 12, type: 'healthy', baseUnit: '마리' },     // 생선 추가
  '고등어': { kcal: 300, carb: 0, protein: 26, fat: 20, type: 'healthy', baseUnit: '토막' },    // 고등어 추가
  '갈치': { kcal: 220, carb: 0, protein: 24, fat: 12, type: 'healthy', baseUnit: '토막' },      // 갈치 추가
  '오징어': { kcal: 90, carb: 0.5, protein: 18, fat: 1, type: 'healthy', baseUnit: '마리' },
  '프로틴': { kcal: 120, carb: 3, protein: 24, fat: 1.5, type: 'healthy', baseUnit: '잔' },
  '단백질쉐이크': { kcal: 120, carb: 3, protein: 24, fat: 1.5, type: 'healthy', baseUnit: '잔' },
  '참치캔': { kcal: 150, carb: 0, protein: 25, fat: 5, type: 'neutral', baseUnit: '개' },

  // 지방 및 견과류
  '아보카도': { kcal: 160, carb: 8, protein: 2, fat: 15, type: 'healthy', baseUnit: '개' },
  '체다치즈': { kcal: 70, carb: 0.5, protein: 5, fat: 6, type: 'neutral', baseUnit: '장' },
  '치즈': { kcal: 70, carb: 0.5, protein: 5, fat: 6, type: 'neutral', baseUnit: '장' },
  '아몬드': { kcal: 100, carb: 3, protein: 3, fat: 9, type: 'healthy', baseUnit: '알' },
  '견과류': { kcal: 120, carb: 4, protein: 3, fat: 10, type: 'healthy', baseUnit: '줌' },
  '올리브유': { kcal: 120, carb: 0, protein: 0, fat: 14, type: 'healthy', baseUnit: '스푼' },

  // 채소 및 샐러드
  '샐러드': { kcal: 50, carb: 8, protein: 2, fat: 1, type: 'healthy', baseUnit: '접시' },
  '오이': { kcal: 15, carb: 3, protein: 0.8, fat: 0.1, type: 'healthy', baseUnit: '개' },
  '당근': { kcal: 30, carb: 7, protein: 1, fat: 0.2, type: 'healthy', baseUnit: '개' },
  '야채': { kcal: 30, carb: 6, protein: 1.5, fat: 0.2, type: 'healthy', baseUnit: '접시' },
  '채소': { kcal: 30, carb: 6, protein: 1.5, fat: 0.2, type: 'healthy', baseUnit: '접시' },
  '브로콜리': { kcal: 30, carb: 6, protein: 2.5, fat: 0.3, type: 'healthy', baseUnit: '개' },
  '시금치': { kcal: 25, carb: 4, protein: 3, fat: 0.4, type: 'healthy', baseUnit: '접시' },

  // 한식 외식 및 탕류
  '알탕': { kcal: 350, carb: 10, protein: 35, fat: 18, type: 'neutral', baseUnit: '인분' },
  '김치찌개': { kcal: 250, carb: 15, protein: 15, fat: 15, type: 'neutral', baseUnit: '인분' },
  '김치끼개': { kcal: 250, carb: 15, protein: 15, fat: 15, type: 'neutral', baseUnit: '인분' },
  '된장찌개': { kcal: 200, carb: 20, protein: 12, fat: 8, type: 'healthy', baseUnit: '인분' },

  // 정크푸드 및 외식류 (가치 판단형 / 고칼로리)
  '피자': { kcal: 500, carb: 60, protein: 20, fat: 22, type: 'junk', baseUnit: '조각' },
  '치킨': { kcal: 600, carb: 20, protein: 35, fat: 40, type: 'junk', baseUnit: '인분' },
  '햄버거': { kcal: 450, carb: 45, protein: 22, fat: 20, type: 'junk', baseUnit: '개' },
  '라면': { kcal: 500, carb: 80, protein: 10, fat: 16, type: 'junk', baseUnit: '봉지' },
  '떡볶이': { kcal: 400, carb: 85, protein: 8, fat: 3, type: 'junk', baseUnit: '인분' },
  '삼겹살': { kcal: 650, carb: 0, protein: 22, fat: 60, type: 'junk', baseUnit: '인분' },
  '짜장면': { kcal: 700, carb: 110, protein: 18, fat: 20, type: 'junk', baseUnit: '인분' },
  '돈까스': { kcal: 600, carb: 55, protein: 25, fat: 30, type: 'junk', baseUnit: '인분' },
  '족발': { kcal: 550, carb: 2, protein: 40, fat: 42, type: 'neutral', baseUnit: '인분' },
  '맥주': { kcal: 150, carb: 15, protein: 1.5, fat: 0, type: 'junk', baseUnit: '잔' },
  '소주': { kcal: 300, carb: 0, protein: 0, fat: 0, type: 'junk', baseUnit: '병' },
  '콜라': { kcal: 110, carb: 28, protein: 0, fat: 0, type: 'junk', baseUnit: '캔' },
  '사이다': { kcal: 110, carb: 28, protein: 0, fat: 0, type: 'junk', baseUnit: '캔' },
  '아메리카노': { kcal: 10, carb: 1, protein: 0.5, fat: 0, type: 'healthy', baseUnit: '잔' },
  '우유': { kcal: 130, carb: 10, protein: 6, fat: 7, type: 'healthy', baseUnit: 'ml' },
  '두유': { kcal: 120, carb: 8, protein: 6, fat: 5, type: 'healthy', baseUnit: 'ml' }
};

// 텍스트에서 분량을 감지하기 위한 고급 자연어 Heuristics 파서
function getQuantityMultiplier(text, foodName) {
  const escapedFood = foodName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // 조사 제거 및 분리를 위한 패턴 완충용 정규식 (조사 ~은/는/이/가/을/를/이랑/와/과 뒤에 수량이 올 때)
  const particleBuffer = `(?:은|는|이|가|을|를|이랑|와|과|\\s)*`;

  // 1. 곱빼기 / 곱배기 특수 단어 우선 처리 (예: "칼국수 곱빼기", "수제비 곱배기", "칼국수 곱배기 한그릇")
  const doubleRegex = new RegExp(`${escapedFood}${particleBuffer}(곱빼기|곱배기)`, 'i');
  if (doubleRegex.test(text)) {
    return 1.5;
  }

  // 2. ~반그릇 / ~반공기 / ~반접시 / ~반모 / ~반개 / 반 그릇 등 한국어 소수 수량 우선 처리 (예: "밥 반공기", "고구마 반개", "두부 반모")
  const halfRegex = new RegExp(`${escapedFood}${particleBuffer}(반\\s*(그릇|공기|접시|모|개|장|조각|알|줌))`, 'i');
  if (halfRegex.test(text)) {
    return 0.5;
  }

  // 3. 한그릇반 / 한공기반 / 한접시반 등 "~반"으로 끝나는 합성 수량 매칭 (예: "식빵 한장 반", "밥 한공기 반")
  const oneAndHalfRegex = new RegExp(`${escapedFood}${particleBuffer}(?:한|하나|1)\\s*(개|팩|조각|g|인분|그릇|공기|장|모|알|줌)?\\s*반`, 'i');
  if (oneAndHalfRegex.test(text)) {
    return 1.5;
  }

  // 3.5 숫자로 표현된 합성 수량 반 추가 매칭 (예: "식빵 2장 반", "백미밥 1공기 반")
  const numAndHalfRegex = new RegExp(`${escapedFood}${particleBuffer}(\\d+)\\s*(개|팩|조각|g|인분|그릇|공기|장|모|알|줌)?\\s*반`, 'i');
  const numAndHalfMatch = text.match(numAndHalfRegex);
  if (numAndHalfMatch) {
    return parseFloat(numAndHalfMatch[1]) + 0.5;
  }

  // 4. 분수 형태 매칭 (예: "오이1/2", "당근 1/2", "고구마 1/2개", "칼국수 1/2인분")
  const fractionRegex = new RegExp(`${escapedFood}${particleBuffer}(\\d+)\\s*\\/\\s*(\\d+)\\s*(개|팩|조각|g|인분|그릇|공기|장|모|알|줌)?`, 'i');
  const fractionMatch = text.match(fractionRegex);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  // 5. 숫자가 그람(g) 또는 ml(밀리리터) 단위 기입 매칭 (예: "백미밥120g", "우유 200ml", "햄50g", "우유를 200ml")
  const unitRegex = new RegExp(`${escapedFood}${particleBuffer}(\\d+)\\s*(g|그램|ml|밀리리터)`, 'i');
  const unitMatch = text.match(unitRegex);
  if (unitMatch) {
    const qty = parseFloat(unitMatch[1]);
    const unit = unitMatch[2].toLowerCase();
    if (qty > 0) {
      if (unit === 'ml' || unit === '밀리리터') {
        if (['우유', '두유', '콜라', '사이다', '맥주'].includes(foodName)) {
          return qty / 200;
        }
        return qty / 100;
      }
      if (['현미밥', '백미밥', '쌀밥', '공기밥', '밥'].includes(foodName)) {
        return qty / 200;
      }
      return qty / 100;
    }
  }

  // 6. 일반 숫자 및 소수점 패턴 매칭 (예: "식빵2", "소세지 2", "체다치즈 1.5장", "칼국수 1인분")
  const numRegex = new RegExp(`${escapedFood}${particleBuffer}(\\d+\\.?\\d*)\\s*(개|팩|조각|g|인분|그릇|공기|장|모|알|줌)?`, 'i');
  const numMatch = text.match(numRegex);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  // 7. 한글 수량 패턴 매칭
  const koreanQty = [
    { key: '반', val: 0.5 },
    { key: '한', val: 1 },
    { key: '하나', val: 1 },
    { key: '두', val: 2 },
    { key: '둘', val: 2 },
    { key: '세', val: 3 },
    { key: '셋', val: 3 },
    { key: '네', val: 4 },
    { key: '넷', val: 4 },
    { key: '다섯', val: 5 }
  ];

  for (const qty of koreanQty) {
    const korRegex = new RegExp(`${escapedFood}${particleBuffer}${qty.key}\\s*(개|팩|조각|g|인분|그릇|공기|장|모|알|줌)?`);
    if (korRegex.test(text)) {
      return qty.val;
    }
  }

  // 기본값은 1회 제공량
  return 1;
}

/**
 * 사용자 입력 텍스트를 로컬 분석하여 칼로리 및 탄단지, 피드백을 실시간 생성합니다.
 * @param {string} text 사용자 식단 텍스트
 * @returns {object} 분석 결과 객체
 */
export function analyzeMealPlan(text, prevDayLastMeal = null) {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      calories: 0,
      carb: 0,
      protein: 0,
      fat: 0,
      detectedFoods: [],
      feedbacks: ['식단을 작성해 주시고 [분석요청]을 누르시면 AI 분석이 실행됩니다.'],
      summary: '오늘 드신 식사 내용을 자유롭게 작성해 보세요! 예: "아침으로 사과 한개랑 닭가슴살 1팩 먹고 점심은 일반식 밥 한공기 먹었어"',
      ratio: { carb: 0, protein: 0, fat: 0 },
      isFasting: false,
      isDiet: false,
      isDaily: false,
      meals: [],
      fastingIntervals: [],
      nightFastingDuration: 0
    };
  }

  // 시간대 추출 및 파싱 (예: 12:00, 18시 30분 등)
  let timeMatches = [];
  const timeRegex = /(?:(\d{1,2}):(\d{2}))|(?:(\d{1,2})\s*시\s*(?:(\d{1,2})\s*분)?)/g;
  let match;
  while ((match = timeRegex.exec(text)) !== null) {
    let hour = parseInt(match[1] || match[3], 10);
    let minute = parseInt(match[2] || match[4] || '0', 10);
    timeMatches.push({
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
      index: match.index,
      length: match[0].length
    });
  }

  // 시간 표기가 없고 아침/점심/저녁 키워드가 있는 경우 임시 할당
  if (timeMatches.length === 0) {
    const mealKeywords = [
      { key: '아침', hour: 8, min: 0 },
      { key: '점심', hour: 12, min: 0 },
      { key: '간식', hour: 15, min: 0 },
      { key: '저녁', hour: 18, min: 0 }
    ];
    mealKeywords.forEach(kw => {
      let idx = text.indexOf(kw.key);
      if (idx !== -1) {
        timeMatches.push({
          timeStr: kw.key,
          hour: kw.hour,
          minute: kw.min,
          totalMinutes: kw.hour * 60 + kw.min,
          index: idx,
          length: kw.key.length,
          isVirtual: true
        });
      }
    });
    timeMatches.sort((a, b) => a.index - b.index);
  }

  let meals = [];
  if (timeMatches.length > 0) {
    for (let i = 0; i < timeMatches.length; i++) {
      const current = timeMatches[i];
      const startIdx = current.index + current.length;
      const endIdx = (i + 1 < timeMatches.length) ? timeMatches[i + 1].index : text.length;
      const mealSegment = text.substring(startIdx, endIdx);
      meals.push({
        time: current.timeStr,
        hour: current.hour,
        minute: current.minute,
        totalMinutes: current.totalMinutes,
        segment: mealSegment,
        isVirtual: current.isVirtual || false,
        foods: [],
        calories: 0,
        carb: 0,
        protein: 0,
        fat: 0
      });
    }
  } else {
    meals.push({
      time: '식사',
      hour: 12,
      minute: 0,
      totalMinutes: 720,
      segment: text,
      isVirtual: true,
      foods: [],
      calories: 0,
      carb: 0,
      protein: 0,
      fat: 0
    });
  }

  let totalKcal = 0;
  let totalCarb = 0;
  let totalProtein = 0;
  let totalFat = 0;
  
  const detectedFoods = [];
  const feedbacks = [];
  let junkCount = 0;
  let healthyCount = 0;

  const sortedFoodKeywords = Object.keys(FOOD_DATABASE).sort((a, b) => b.length - a.length);
  const matchedIndices = [];
  
  // 시간 매칭 정보들도 중복 감지 방지 범위에 미리 주입
  timeMatches.forEach(tm => {
    matchedIndices.push({ start: tm.index, end: tm.index + tm.length });
  });

  sortedFoodKeywords.forEach((food) => {
    let index = text.indexOf(food);
    
    // 매칭되는 동안 순회
    while (index !== -1) {
      // 해당 영역이 이미 더 긴 단어에 의해 매칭되었는지 확인
      const isAlreadyMatched = matchedIndices.some(
        (range) => index >= range.start && index < range.end
      );

      if (!isAlreadyMatched) {
        // 중복 방지 트래킹 추가
        matchedIndices.push({ start: index, end: index + food.length });

        const multiplier = getQuantityMultiplier(text, food);
        const data = FOOD_DATABASE[food];

        const itemKcal = Math.round(data.kcal * multiplier);
        const itemCarb = Math.round(data.carb * multiplier * 10) / 10;
        const itemProtein = Math.round(data.protein * multiplier * 10) / 10;
        const itemFat = Math.round(data.fat * multiplier * 10) / 10;

        totalKcal += itemKcal;
        totalCarb += itemCarb;
        totalProtein += itemProtein;
        totalFat += itemFat;

        if (data.type === 'junk') junkCount++;
        if (data.type === 'healthy') healthyCount++;

        let displayQuantity = multiplier;
        if (data.baseUnit === 'ml') {
          displayQuantity = Math.round(multiplier * 200); // 200ml 기본 제공량 환산
        } else if (data.baseUnit === 'g') {
          // 백미밥 등 밥 종류는 g 단위로 작성했을 때 기본제공량이 200g
          if (['현미밥', '백미밥', '쌀밥', '공기밥', '밥'].includes(food)) {
            displayQuantity = Math.round(multiplier * 200);
          } else {
            displayQuantity = Math.round(multiplier * 100); // 일반 고기, 햄 등은 100g 기준
          }
        }

        // 매칭된 음식을 적절한 식사 시간대에 귀속시킴
        let targetMeal = meals[0]; // 기본값은 첫 번째 식사
        for (let i = 0; i < meals.length; i++) {
          const mStart = timeMatches.length > 0 ? timeMatches[i].index : 0;
          const mEnd = (i + 1 < meals.length && timeMatches.length > 0) ? timeMatches[i + 1].index : text.length;
          
          if (index >= mStart && index < mEnd) {
            targetMeal = meals[i];
            break;
          }
        }

        targetMeal.foods.push({
          name: food,
          quantity: displayQuantity,
          unit: data.baseUnit,
          kcal: itemKcal,
          type: data.type
        });
        targetMeal.calories += itemKcal;
        targetMeal.carb = Math.round((targetMeal.carb + itemCarb) * 10) / 10;
        targetMeal.protein = Math.round((targetMeal.protein + itemProtein) * 10) / 10;
        targetMeal.fat = Math.round((targetMeal.fat + itemFat) * 10) / 10;

        detectedFoods.push({
          name: food,
          quantity: displayQuantity,
          unit: data.baseUnit,
          kcal: itemKcal,
          carb: itemCarb,
          protein: itemProtein,
          fat: itemFat,
          type: data.type
        });
      }

      // 다음 매칭 탐색
      index = text.indexOf(food, index + 1);
    }
  });

  // 미등록 음식(Unknown Foods) 지능형 Heuristic 폴백 검출 및 보정
  meals.forEach((meal, mealIdx) => {
    const mStart = timeMatches.length > 0 ? timeMatches[mealIdx].index : 0;
    const mEnd = (mealIdx + 1 < meals.length && timeMatches.length > 0) ? timeMatches[mealIdx + 1].index : text.length;
    
    let segmentText = '';
    for (let charIdx = mStart; charIdx < mEnd; charIdx++) {
      const isMatched = matchedIndices.some(range => charIdx >= range.start && charIdx < range.end);
      if (!isMatched) {
        segmentText += text[charIdx];
      } else {
        segmentText += ' ';
      }
    }
    
    const unknownFoodRegex = /([가-힣a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?|한|두|세|네|반)\s*(인분|그릇|공기|팩|개|장|조각|알|줌|g|ml|컵|병|캔|봉지)/g;
    let uMatch;
    
    while ((uMatch = unknownFoodRegex.exec(segmentText)) !== null) {
      const foodName = uMatch[1].replace(/[:\s,-]+/g, '').trim();
      const qtyStr = uMatch[2].trim();
      const unitStr = uMatch[3].trim();
      
      if (foodName.length < 2) continue;
      
      // 이미 매칭 완료된 음식들과 이름이 겹치면 중복 판정으로 통과
      if (meal.foods.some(f => f.name === foodName)) continue;
      
      let multiplier = 1;
      if (qtyStr === '한' || qtyStr === '반') {
        multiplier = qtyStr === '한' ? 1 : 0.5;
      } else {
        const parsedQty = parseFloat(qtyStr);
        if (!isNaN(parsedQty)) multiplier = parsedQty;
      }
      
      // 평균 1인분당 350kcal, 탄40g, 단15g, 지12g 기준 폴백 연산
      const fallbackKcal = Math.round(350 * multiplier);
      const fallbackCarb = Math.round(40 * multiplier * 10) / 10;
      const fallbackProtein = Math.round(15 * multiplier * 10) / 10;
      const fallbackFat = Math.round(12 * multiplier * 10) / 10;
      
      totalKcal += fallbackKcal;
      totalCarb += fallbackCarb;
      totalProtein += fallbackProtein;
      totalFat += fallbackFat;
      
      meal.foods.push({
        name: foodName,
        quantity: multiplier,
        unit: unitStr || '인분',
        kcal: fallbackKcal,
        type: 'neutral',
        isUnrecognized: true
      });
      
      meal.calories += fallbackKcal;
      meal.carb = Math.round((meal.carb + fallbackCarb) * 10) / 10;
      meal.protein = Math.round((meal.protein + fallbackProtein) * 10) / 10;
      meal.fat = Math.round((meal.fat + fallbackFat) * 10) / 10;
      
      detectedFoods.push({
        name: foodName,
        quantity: multiplier,
        unit: unitStr || '인분',
        kcal: fallbackKcal,
        carb: fallbackCarb,
        protein: fallbackProtein,
        fat: fallbackFat,
        type: 'neutral',
        isUnrecognized: true
      });
      
      feedbacks.push(`⚠️ 미인식 식단 보정: '${foodName}'(은)는 영양 성분이 정의되지 않은 식사입니다. 1인분 기준 표준 영양소(${fallbackKcal} kcal)로 보정 합산했습니다.`);
    }
  });

  // 소수점 정리
  totalCarb = Math.round(totalCarb * 10) / 10;
  totalProtein = Math.round(totalProtein * 10) / 10;
  totalFat = Math.round(totalFat * 10) / 10;

  // 탄단지 총합 및 비율 계산
  const macroSum = totalCarb + totalProtein + totalFat;
  const ratio = { carb: 0, protein: 0, fat: 0 };
  if (macroSum > 0) {
    ratio.carb = Math.round((totalCarb / macroSum) * 100);
    ratio.protein = Math.round((totalProtein / macroSum) * 100);
    ratio.fat = 100 - ratio.carb - ratio.protein; // 합이 100이 되도록 조정
  }

  // 1. 공복 및 다이어트 특수 목표 Heuristic 검출
  const isFasting = text.includes('공복') || text.includes('단식') || text.includes('간헐적') || text.includes('fasting');
  const isDiet = text.includes('다이어트') || text.includes('체중') || text.includes('감량') || text.includes('살빼기') || text.includes('diet') || (healthyCount >= 2 && junkCount === 0);

  // 하루 전체 식단 vs 단일 끼니 식단 지능형 분류 (Heuristics)
  const hasMealKeywords = (text.includes('아침') && text.includes('점심')) || 
                         (text.includes('아침') && text.includes('저녁')) || 
                         (text.includes('점심') && text.includes('저녁')) ||
                         text.includes('하루') || text.includes('일일') || text.includes('종일');
  const hasMultipleTimeframes = (text.match(/\d{2}:\d{2}/g) || []).length >= 2;
  const hasLineBreaksAndManyFoods = text.split('\n').length >= 3 && detectedFoods.length >= 3;
  
  const isDaily = hasMealKeywords || hasMultipleTimeframes || hasLineBreaksAndManyFoods;

  // 2. 점수 계산 로직 (Heuristics)
  let score = 80; // 기본 점수

  if (detectedFoods.length === 0) {
    if (isFasting) {
      score = 95; // 단식 달성 격려
    } else {
      score = 40; // 매칭된 푸드가 없으면 자연어 입력 유도로 낮은 점수
    }
  } else {
    // 칼로리 적정성 평가 (하루 전체 vs 단일 끼니 기준)
    if (isDaily) {
      if (totalKcal < 1000) {
        score -= 20; // 하루 총량이 1000kcal 미만은 극단적 결손
      } else if (totalKcal > 2400) {
        const excessKcal = totalKcal - 2400;
        score -= Math.min(30, Math.floor(excessKcal / 45)); // 과도한 섭취 과다
      } else {
        // 다이어트 시 적정 결손 구역 (1300 ~ 1800kcal) 보너스
        if (isDiet && totalKcal >= 1200 && totalKcal <= 1750) {
          score += 8;
        } else if (!isDiet && totalKcal >= 1800 && totalKcal <= 2300) {
          score += 8; // 일반인 데일리 적정 섭취 구간 보너스
        }
      }
    } else {
      // 단일 끼니 칼로리 평가
      if (totalKcal < 200) {
        if (isFasting) {
          score += 15; // 단식 중 가벼운 식하이므로 면제
        } else {
          score -= 15; // 너무 빈약함
        }
      } else if (totalKcal > 1100) {
        score -= Math.min(25, Math.floor((totalKcal - 1100) / 35)); // 끼니당 과잉
      }
    }

    // 정크푸드 디덕션
    if (junkCount > 0) {
      score -= (junkCount * 12);
    }
    // 헬시푸드 보너스
    if (healthyCount > 0) {
      score += Math.min(15, healthyCount * 4);
    }

    // 탄단지 밸런스 점수 (이상적인 다이어트 탄단지 비율 40:35:25, 일반 45:30:25)
    if (macroSum > 0) {
      const targetCarb = isDiet ? 40 : 45;
      const targetProt = isDiet ? 35 : 30;
      const targetFat = 25;

      const carbDev = Math.abs(ratio.carb - targetCarb);
      const protDev = Math.abs(ratio.protein - targetProt);
      const fatDev = Math.abs(ratio.fat - targetFat);
      const deviation = (carbDev + protDev + fatDev) / 3;
      score -= Math.min(20, Math.floor(deviation * 0.8));
    }

    // 범위 제한 (10점 ~ 100점)
    score = Math.max(12, Math.min(100, score));
  }

  // 3. 지능적 피드백 어드바이스 생성
  let summary = '';

  // 공복 상태 고유 피드백 탑재
  if (isFasting) {
    feedbacks.push('ℹ️ 공복(단식) 케어 가이드: 간헐적 단식 또는 공복 상태가 감지되었습니다. 공복 중에는 체지방이 효과적으로 연소되는 최적의 케토시스 구간에 진입합니다. 충분한 전해질과 물을 섭취하여 수분을 유지하세요.');
    if (totalKcal > 0) {
      feedbacks.push('ℹ️ 보식 조언: 단식 직후 첫 식사(보식)에 소량의 식품을 드셨습니다. 단식 후에는 소화기가 극도로 예민해지므로 당류나 기름진 음식을 피하고 부드러운 야채와 저지방 단백질(계란, 두부 등)을 선택한 것은 훌륭한 결정입니다.');
    }
  }

  // 다이어트 상태 고유 피드백 탑재
  if (isDiet) {
    feedbacks.push('🔥 다이어트 집중 코칭: 다이어트(감량) 지향 식단으로 파악되었습니다. 혈당 스파이크를 방지하기 위해 정제 탄수화물(백밀가루, 흰쌀밥) 대신 복합 탄수화물(현미밥, 고구마, 오트밀) 중심의 설계를 이어가세요.');
    if (macroSum > 0) {
      if (ratio.protein < 25) {
        feedbacks.push('⚠️ 다이어트 단백질 경고: 현재 식단에서 단백질 비중(' + ratio.protein + '%)이 낮습니다. 감량 시 체수분 및 근손실을 예방하려면 총 에너지의 30% 이상을 단백질로 충족하는 것이 매우 효과적입니다. 삶은 계란이나 닭가슴살 섭취를 늘려보세요.');
      } else {
        feedbacks.push('💪 다이어트 단백질 칭찬: 단백질 비율(' + ratio.protein + '%)이 이상적으로 세팅되었습니다! 감량 중 근육량을 보호하고 포만감을 오래 길들이는 정밀 다이어트 배율입니다.');
      }
    }
  }

  if (detectedFoods.length === 0) {
    if (isFasting) {
      summary = '클린 오프라인 단식 모드를 진행 중이십니다! 체내 인슐린 분비를 억제하여 세포 해독(오토파지)과 활발한 체지방 연소를 유도하는 훌륭한 다이어트 주기입니다.';
    } else {
      feedbacks.push('입력된 텍스트에서 식단 구성 요소를 감지하지 못했습니다.');
      feedbacks.push('식사하신 음식의 이름이나 수량을 명확하게 적어주시면 더 정확한 분석이 가능합니다.');
      feedbacks.push('예: 백미밥120g, 소세지2, 체다치즈1장, 알탕2인분, 오이1/2 등');
      summary = '식단 단어를 분석하여 정밀 영양 수치를 도출합니다. 드신 음식을 자세히 적고 [분석요청]을 탭하세요.';
    }
  } else {
    // 칼로리 피드백 (하루 전체 vs 단일 끼니 분기 보정)
    if (isDaily) {
      if (totalKcal < 1100) {
        feedbacks.push(`⚠️ 하루 총에너지 경고: 하루 동안 섭취한 칼로리가 약 ${totalKcal}kcal로 지나치게 낮습니다. 데일리 대사를 보전하고 빈혈 및 건강한 신체 활동을 방지하려면 하루 최소 1200kcal 이상의 고른 칼로리 섭취가 동반되어야 합니다.`);
      } else if (totalKcal > 2300) {
        feedbacks.push(`⚠️ 하루 총에너지 경고: 하루 전체 칼로리 섭취량(${totalKcal}kcal)이 일일 에너지 필요량을 다소 상회합니다. 감량 중이시라면 외식 및 탄산 섭취를 줄이시거나 가벼운 유산소 운동 보조를 권유합니다.`);
      } else {
        if (isDiet) {
          feedbacks.push(`✨ 하루 식단 권장: 하루 총 섭취량(${totalKcal}kcal)이 다이어트에 아주 적합한 '약한 칼로리 결손' 상태를 나타냅니다! 건강을 해치지 않으며 안전하게 지방을 컷팅하는 완벽한 데일리 칼로리 페이스입니다.`);
        } else {
          feedbacks.push(`✨ 하루 식단 권장: 하루 총 섭취량(${totalKcal}kcal)이 성인 건강 유지를 위한 데일리 기준치에 매우 적합하고 안정적입니다. 바람직한 하루 에너지 섭취 습관입니다.`);
        }
      }
    } else {
      // 단일 끼니 칼로리 피드백
      if (totalKcal < 350) {
        if (!isFasting) {
          feedbacks.push(`총 섭취 에너지가 약 ${totalKcal}kcal로 매우 낮습니다. 기초대사량 보전을 위해 현미밥이나 고구마 같은 질 좋은 복합 탄수화물 추가를 권장합니다.`);
        }
      } else if (totalKcal > 900) {
        feedbacks.push(`단일 끼니 칼로리(${totalKcal}kcal)가 높은 수준입니다. 다음 식사는 채소 샐러드나 저지방 단백질 중심의 가벼운 한 끼로 섭취하여 하루 전체의 밸런스를 맞추시는 걸 조언합니다.`);
      } else {
        feedbacks.push(`단일 끼니 에너지량(${totalKcal}kcal)이 아주 적당하며 다음 식사와 고르게 배치하기 좋은 안정적인 기준치입니다.`);
      }
    }

    // 단백질 피드백 (다이어트 가이드와 겹치지 않는 선에서 보완)
    if (totalProtein < 18 && !isDiet) {
      feedbacks.push(`단백질 섭취량(총 ${totalProtein}g)이 부족한 편입니다. 골격근 보호 및 균형 관리를 위해 계란이나 닭가슴살 같은 고순도 단백질원을 1회분 이상 추가할 것을 권장합니다.`);
    } else if (totalProtein >= 35 && !isDiet) {
      feedbacks.push(`단백질 섭취량(${totalProtein}g)이 아주 훌륭합니다. 근육 합성 및 기초대사율 상승에 이상적인 단백질 충족입니다.`);
    }

    // 식이섬유 & 채소 피드백
    const hasVegetable = detectedFoods.some(f => ['샐러드', '야채', '채소', '브로콜리', '시금치', '토마토', '오이', '당근'].includes(f.name));
    if (!hasVegetable) {
      feedbacks.push('식단에 오이, 당근, 브로콜리 등 신선한 야채류가 보이지 않습니다. 식이섬유와 풍부한 미량영양소 공급을 위해 한 줌 정도의 야채 보충을 제안합니다.');
    } else if (!isDiet) {
      feedbacks.push('오이/당근/샐러드 등의 신선한 채소류를 고루 섭취하여 훌륭한 비타민 및 미네랄 섭취 상태를 유지하고 계십니다.');
    }

    // 정크푸드 및 탄산음료 경고
    if (junkCount > 0) {
      const junkList = detectedFoods.filter(f => f.type === 'junk').map(f => `${f.name} ${f.quantity}${f.unit}`).join(', ');
      feedbacks.push(`경고: 고나트륨/고지방 가공 식품(${junkList})이 포함되었습니다. 체내 칼륨 밸런스를 맞추기 위해 충분한 수분 보충 및 식이섬유가 풍부한 야채를 곁들이시기 바랍니다.`);
    }

    // 종합 요약 텍스트 생성
    if (score >= 90) {
      summary = isDiet 
        ? '체감 효과가 대단히 높고 과학적인 완벽한 다이어트 식단입니다! 탄단지 비율이 최적의 컷팅 밸런스에 포진해 있으며 요요 현상 없는 지속가능한 감량이 이루어집니다.' 
        : '매우 뛰어난 식단 구성입니다! 칼로리와 영양 밸런스가 조화로우며 유기적인 신체 대사에 아주 긍정적인 자양분이 됩니다. 완벽한 건강 관리 흐름입니다.';
    } else if (score >= 75) {
      summary = isDiet 
        ? '감량 페이스에 아주 우수한 식습관입니다. 정크푸드 제로 수칙을 유지하고 양질의 불포화 지방만 한 스푼 추가해 주시면 최고 밸런스에 도달합니다.' 
        : '대체로 훌륭하고 모범적인 식습관입니다. 약간의 지방을 줄이거나 부족한 영양소 한 가지를 추가하는 디테일한 튜닝만으로 최고 수준의 식단이 될 수 있습니다.';
    } else if (score >= 50) {
      summary = '영양 균형에 보완이 다소 필요한 밀플랜입니다. 특정 영양소에 치우치거나 고지방 외식 메뉴의 영향으로 정밀 개선 가이드를 적극적으로 따라주시는 것을 추천합니다.';
    } else {
      summary = '몸에 해로운 정크푸드 비중이 높거나 극단적으로 절제된 식단으로 판단됩니다. 혈당 스파이크 방지 및 건강한 체질 유지를 위해 클린한 한식 기반 또는 웰빙 식단으로 전면 피드백 수정을 권장합니다.';
    }
  }

  // 식사 간 공복 시간 및 야간 공복 시간 연산
  let fastingIntervals = [];
  let nightFastingDuration = 0;
  
  // 실제 음식이 하나 이상 감지된 식사들만 필터링하여 정렬
  const activeMeals = meals.filter(m => m.foods.length > 0).sort((a, b) => a.totalMinutes - b.totalMinutes);

  if (activeMeals.length >= 2) {
    let totalFastingHours = 0;
    for (let i = 0; i < activeMeals.length - 1; i++) {
      const current = activeMeals[i];
      const next = activeMeals[i + 1];
      const diffMinutes = next.totalMinutes - current.totalMinutes;
      if (diffMinutes > 0) {
        const durationHours = Math.round((diffMinutes / 60) * 10) / 10;
        totalFastingHours += durationHours;
        fastingIntervals.push({
          start: current.time,
          end: next.time,
          duration: durationHours,
          formatted: `${current.time} ~ ${next.time} (${durationHours}시간 공복)`
        });
      }
    }

    const avgFasting = Math.round((totalFastingHours / fastingIntervals.length) * 10) / 10;
    if (avgFasting >= 4 && avgFasting <= 6) {
      feedbacks.push(`✨ 식간 공복 유지: 식사와 식사 사이 평균 공복 시간(${avgFasting}시간)이 완벽한 대사 안전 범위에 포진해 있습니다. 인슐린 분비 주기 안정에 긍정적인 휴식기입니다.`);
    } else if (avgFasting < 3.5) {
      feedbacks.push(`⚠️ 잦은 섭취 식간 주의: 식사 간격 평균(${avgFasting}시간)이 다소 조밀합니다. 빈번한 칼로리 투입은 체내 인슐린 분비를 자주 자극해 지방 합성을 촉진할 수 있으니 식간 공복 유지를 권고합니다.`);
    }
  }

  // 야간 단식 주기 (마지막 식사에서 다음날 첫 식사까지 시간 연산)
  if (activeMeals.length >= 1) {
    const firstMeal = activeMeals[0];
    const lastMeal = activeMeals[activeMeals.length - 1];
    
    if (prevDayLastMeal) {
      // 실제 전일 마지막 식사 시간과 금일 첫 식사 시간으로 연산
      const diff = (1440 - prevDayLastMeal.totalMinutes) + firstMeal.totalMinutes;
      nightFastingDuration = Math.round((diff / 60) * 10) / 10;
      
      // 당일 식간 공복 배열 맨 앞에 전일 연계 공복 삽입
      fastingIntervals.unshift({
        start: `전일 ${prevDayLastMeal.time}`,
        end: `금일 ${firstMeal.time}`,
        duration: nightFastingDuration,
        formatted: `어제 마지막 식사 (${prevDayLastMeal.time}) ~ 오늘 첫 식사 (${firstMeal.time}) (${nightFastingDuration}시간 공복)`
      });

      feedbacks.push(`⏱️ 전일 연계 야간 단식 달성: 어제 마지막 식사(${prevDayLastMeal.time}) 후 오늘 첫 식사(${firstMeal.time})까지 약 ${nightFastingDuration}시간의 야간 공복을 훌륭하게 사수하셨습니다. 세포 정화(오토파지) 효과를 돕는 건강한 생활 주기입니다.`);
    } else {
      // 하루 24시간 1440분 기준 래핑 연산
      const diff = (1440 - lastMeal.totalMinutes) + firstMeal.totalMinutes;
      nightFastingDuration = Math.round((diff / 60) * 10) / 10;

      if (nightFastingDuration >= 12) {
        feedbacks.push(`⏱️ 야간 단식 달성: 오늘의 마지막 식사(${lastMeal.time}) 후 다음 날 첫 식사(${firstMeal.time})까지 약 ${nightFastingDuration}시간의 야간 공복을 건강하게 사수하셨습니다. 세포 정화(오토파지)를 돕는 바람직한 다이어트 패턴입니다.`);
      }
    }
  }

  return {
    score,
    calories: totalKcal,
    carb: totalCarb,
    protein: totalProtein,
    fat: totalFat,
    detectedFoods,
    feedbacks,
    summary,
    ratio,
    isFasting,
    isDiet,
    isDaily,
    meals: activeMeals,
    fastingIntervals,
    nightFastingDuration
  };
}
