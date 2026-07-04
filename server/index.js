/**
 * DOO'S MEAL PLAN - Backend API Proxy Server
 * - Gemini AI API를 안전하게 프록시 (API 키를 서버 환경변수에 보관)
 * - Google Sheets API로 식단 기록을 영구 DB에 저장/조회
 * Deployed on: Render (https://render.com)
 */

import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS 설정 ─────────────────────────────────────────────
const allowedOrigins = [
  'https://localhost:5173',
  'http://localhost:5173',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// ─── Google Sheets 클라이언트 초기화 ─────────────────────────
function getSheetsClient() {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) return null;
  try {
    const credentials = JSON.parse(credJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return google.sheets({ version: 'v4', auth });
  } catch (e) {
    console.error('[Sheets] 인증 초기화 실패:', e.message);
    return null;
  }
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = 'MealLogs'; // 시트 탭 이름

// ─── 헬스체크 ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: "DOO'S MEAL PLAN API", version: '1.0.0' });
});

// ─── [POST] /api/analyze — Gemini AI 식단 분석 프록시 ─────────
app.post('/api/analyze', async (req, res) => {
  const { text, prevDayLastMeal } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

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
5. 식사 간격과 야간 공복을 계산할 때는 실제 시간 차이를 사용하세요
6. totalMinutes 필드는 자정(00:00)부터의 분 수입니다 (예: 12:00 = 720)

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요:
{
  "score": 75,
  "calories": 1500,
  "carb": 180,
  "protein": 80,
  "fat": 45,
  "isFasting": false,
  "isDiet": false,
  "isDaily": true,
  "ratio": { "carb": 50, "protein": 25, "fat": 25 },
  "meals": [
    {
      "time": "08:00",
      "totalMinutes": 480,
      "calories": 400,
      "carb": 50,
      "protein": 20,
      "fat": 12,
      "foods": [
        { "name": "사과", "quantity": 1, "unit": "개", "kcal": 80, "type": "healthy" }
      ]
    }
  ],
  "fastingIntervals": [
    { "start": "08:00", "end": "12:00", "duration": 4, "formatted": "08:00 ~ 12:00 (4시간 공복)" }
  ],
  "nightFastingDuration": 14,
  "detectedFoods": [
    { "name": "사과", "quantity": 1, "unit": "개", "kcal": 80, "carb": 20, "protein": 0.5, "fat": 0.3, "type": "healthy" }
  ],
  "feedbacks": ["칼로리 섭취가 적정 수준입니다."],
  "summary": "전반적으로 균형 잡힌 식단입니다."
}

score 계산 기준: 100=완벽, 80-100=우수, 60-79=양호, 40-59=보통, 20-39=개선필요, 0-19=불균형
feedbacks는 구체적이고 실용적인 한국어 조언을 3-5개 제공하세요.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096, response_mime_type: 'application/json' }
        })
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[Gemini] API 오류:', response.status, errBody);
      return res.status(502).json({ error: 'Gemini API error', detail: response.status });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return res.status(502).json({ error: 'Empty Gemini response' });

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const result = JSON.parse(cleaned);

    // 전날 마지막 식사 기반 야간 공복 계산
    if (prevDayLastMeal && result.meals && result.meals.length > 0) {
      const firstMeal = [...result.meals].sort((a, b) => a.totalMinutes - b.totalMinutes)[0];
      if (firstMeal) {
        const diff = (1440 - prevDayLastMeal.totalMinutes) + firstMeal.totalMinutes;
        const nightFasting = Math.round((diff / 60) * 10) / 10;
        result.nightFastingDuration = nightFasting;
        const hasNightInterval = result.fastingIntervals?.some(f => f.start?.includes('전일'));
        if (!hasNightInterval) {
          result.fastingIntervals = [
            {
              start: `전일 ${prevDayLastMeal.time}`,
              end: `금일 ${firstMeal.time}`,
              duration: nightFasting,
              formatted: `어제 마지막 식사 (${prevDayLastMeal.time}) ~ 오늘 첫 식사 (${firstMeal.time}) (${nightFasting}시간 공복)`
            },
            ...(result.fastingIntervals || [])
          ];
        }
      }
    }

    res.json({ ...result, _aiPowered: true });
  } catch (err) {
    console.error('[/api/analyze] 오류:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─── [POST] /api/sheets/write — Google Sheets에 식단 기록 저장 ─
app.post('/api/sheets/write', async (req, res) => {
  const { date, text, analysis } = req.body;
  if (!date || !SHEET_ID) {
    return res.status(400).json({ error: 'date required or SHEET_ID not configured' });
  }

  const sheets = getSheetsClient();
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not configured' });

  try {
    const calories = analysis?.calories ?? 0;
    const score = analysis?.score ?? 0;
    const timestamp = new Date().toISOString();

    // 시트에 행 추가: [날짜, 식단텍스트, 칼로리, 점수, 타임스탬프, JSON전체]
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:F`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[date, text || '', calories, score, timestamp, JSON.stringify(analysis || {})]]
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[/api/sheets/write] 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── [GET] /api/sheets/read?date=YYYY-MM-DD ────────────────
app.get('/api/sheets/read', async (req, res) => {
  const { date } = req.query;
  if (!date || !SHEET_ID) {
    return res.status(400).json({ error: 'date query required' });
  }

  const sheets = getSheetsClient();
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not configured' });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:F`
    });

    const rows = response.data.values || [];
    // 헤더 행 제외, 해당 날짜의 마지막 레코드 반환
    const matchRows = rows.slice(1).filter(row => row[0] === date);
    if (matchRows.length === 0) {
      return res.json({ found: false });
    }

    const lastRow = matchRows[matchRows.length - 1];
    const analysis = lastRow[5] ? JSON.parse(lastRow[5]) : null;
    res.json({ found: true, date: lastRow[0], text: lastRow[1], calories: lastRow[2], score: lastRow[3], analysis });
  } catch (err) {
    console.error('[/api/sheets/read] 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── [GET] /api/sheets/range?days=30 — 최근 N일 전체 조회 ──
app.get('/api/sheets/range', async (req, res) => {
  const days = parseInt(req.query.days || '7', 10);
  if (!SHEET_ID) return res.status(400).json({ error: 'SHEET_ID not configured' });

  const sheets = getSheetsClient();
  if (!sheets) return res.status(503).json({ error: 'Google Sheets not configured' });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:F`
    });

    const rows = response.data.values || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // 날짜별 마지막 레코드만 추출
    const byDate = {};
    rows.slice(1).forEach(row => {
      if (row[0] >= cutoffStr) {
        byDate[row[0]] = {
          date: row[0],
          text: row[1],
          calories: Number(row[2]) || 0,
          score: Number(row[3]) || 0,
          analysis: row[5] ? JSON.parse(row[5]) : null
        };
      }
    });

    res.json({ records: Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)) });
  } catch (err) {
    console.error('[/api/sheets/range] 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 서버 시작 ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ DOO'S MEAL PLAN API Server running on port ${PORT}`);
  console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`   Google Sheets: ${process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✓ configured' : '✗ missing'}`);
  console.log(`   Sheet ID: ${SHEET_ID || '✗ missing'}`);
});
