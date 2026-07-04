/**
 * Gemini AI 기반 식단 영양 분석 모듈 (v2 - 백엔드 프록시 방식)
 * - 로컬 개발: VITE_GEMINI_API_KEY 또는 VITE_API_BASE_URL 사용
 * - 배포 환경: VITE_API_BASE_URL의 Render 서버를 통해 안전하게 호출
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const LOCAL_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * 식단 텍스트를 Gemini AI로 분석합니다.
 * 배포 환경: Render 백엔드 프록시를 통해 호출
 * 로컬 환경: VITE_GEMINI_API_KEY로 직접 호출 (폴백)
 */
export async function analyzeMealPlanWithGemini(text, prevDayLastMeal = null) {
  if (!text || !text.trim()) return null;

  // 배포 환경: Render 백엔드 서버를 통한 안전한 호출
  if (API_BASE) {
    return callViaBackend(text, prevDayLastMeal);
  }

  // 로컬 개발: API 키가 있을 때 직접 호출
  if (LOCAL_API_KEY) {
    return callDirectly(text, prevDayLastMeal);
  }

  return null; // 둘 다 없으면 로컬 폴백
}

// ─── 백엔드 프록시 호출 (배포 환경) ───────────────────────────
async function callViaBackend(text, prevDayLastMeal) {
  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prevDayLastMeal })
    });
    if (!res.ok) {
      console.error('[GeminiAnalyzer] Backend error:', res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn('[GeminiAnalyzer] Backend 호출 실패:', e.message);
    return null;
  }
}

// ─── 직접 API 호출 (로컬 개발용) ─────────────────────────────
async function callDirectly(text, prevDayLastMeal) {
  const prevMealContext = prevDayLastMeal
    ? `\n참고: 전날 마지막 식사 시간은 ${prevDayLastMeal.time}입니다. 이를 기반으로 오늘 첫 식사까지의 야간 공복 시간도 계산해주세요.`
    : '';

  const prompt = `당신은 한국 식품 영양 전문가입니다. 아래 식단 텍스트를 분석하여 정확한 영양 정보를 JSON으로 반환해주세요.

식단 텍스트:
"""
${text}
"""
${prevMealContext}

다음 규칙을 따라주세요:
1. 시간 형식: "08:00", "점심", "저녁" 등이 식사 시간을 나타냅니다. "점심"=12:00, "저녁"=18:00, "아침"=08:00
2. 한국 음식의 실제 1인분 기준으로 칼로리를 계산하세요 (음식점에서 제공되는 실제 양 기준)
3. 음식 이름의 오타나 변형을 지능적으로 처리하세요 (예: "김치끼개" → 김치찌개)
4. 인분 수, 개수, 그릇 수 등 수량 표현을 정확히 반영하세요
5. totalMinutes 필드는 자정(00:00)부터의 분 수입니다 (예: 12:00 = 720)

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요:
{
  "score": 75, "calories": 1500, "carb": 180, "protein": 80, "fat": 45,
  "isFasting": false, "isDiet": false, "isDaily": true,
  "ratio": { "carb": 50, "protein": 25, "fat": 25 },
  "meals": [{ "time": "08:00", "totalMinutes": 480, "calories": 400, "carb": 50, "protein": 20, "fat": 12, "foods": [{ "name": "사과", "quantity": 1, "unit": "개", "kcal": 80, "type": "healthy" }] }],
  "fastingIntervals": [{ "start": "08:00", "end": "12:00", "duration": 4, "formatted": "08:00 ~ 12:00 (4시간 공복)" }],
  "nightFastingDuration": 14,
  "detectedFoods": [{ "name": "사과", "quantity": 1, "unit": "개", "kcal": 80, "carb": 20, "protein": 0.5, "fat": 0.3, "type": "healthy" }],
  "feedbacks": ["칼로리 섭취가 적정 수준입니다."],
  "summary": "전반적으로 균형 잡힌 식단입니다."
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${LOCAL_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json' }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;
    const cleaned = rawText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
    const result = JSON.parse(cleaned);

    if (prevDayLastMeal && result.meals?.length > 0) {
      const firstMeal = [...result.meals].sort((a,b)=>a.totalMinutes-b.totalMinutes)[0];
      if (firstMeal) {
        const diff = (1440 - prevDayLastMeal.totalMinutes) + firstMeal.totalMinutes;
        const nightFasting = Math.round((diff/60)*10)/10;
        result.nightFastingDuration = nightFasting;
        if (!result.fastingIntervals?.some(f=>f.start?.includes('전일'))) {
          result.fastingIntervals = [
            { start:`전일 ${prevDayLastMeal.time}`, end:`금일 ${firstMeal.time}`, duration:nightFasting, formatted:`어제 마지막 식사 (${prevDayLastMeal.time}) ~ 오늘 첫 식사 (${firstMeal.time}) (${nightFasting}시간 공복)` },
            ...(result.fastingIntervals||[])
          ];
        }
      }
    }
    return { ...result, _aiPowered: true };
  } catch (e) {
    console.error('[GeminiAnalyzer] 직접 호출 실패:', e);
    return null;
  }
}
