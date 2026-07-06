/**
 * Google Sheets 식단 기록 동기화 모듈
 * - localStorage와 병렬 운영 (오프라인 우선, 온라인 시 자동 동기화)
 * - 백엔드 Render 서버를 통해 Sheets API 호출 (API 키 노출 없음)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * 식단 기록을 Google Sheets에 저장합니다.
 * @param {string} date - YYYY-MM-DD 형식 날짜
 * @param {string} text - 식단 텍스트
 * @param {object} analysis - 분석 결과 객체
 */
export async function syncToSheets(date, text, analysis) {
  if (!API_BASE) return; // 백엔드 URL 미설정 시 무시
  try {
    await fetch(`${API_BASE}/api/sheets/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, text, analysis })
    });
  } catch (e) {
    // 오프라인이거나 서버 오류 시 조용히 무시 (localStorage가 primary)
    console.warn('[SheetsSync] 저장 실패 (무시):', e.message);
  }
}

/**
 * 날짜별 식단 기록을 Google Sheets에서 조회합니다.
 * @param {string} date - YYYY-MM-DD 형식 날짜
 * @returns {Promise<object|null>} 기록 또는 null
 */
export async function loadFromSheets(date) {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/sheets/read?date=${date}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? data : null;
  } catch (e) {
    console.warn('[SheetsSync] 조회 실패 (무시):', e.message);
    return null;
  }
}

/**
 * 최근 N일간의 기록을 Google Sheets에서 조회합니다.
 * @param {number} days - 조회할 일수 (기본 7)
 * @returns {Promise<Array>} 기록 배열
 */
export async function loadRangeFromSheets(days = 7) {
  if (!API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/sheets/range?days=${days}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.records || [];
  } catch (e) {
    console.warn('[SheetsSync] 범위 조회 실패 (무시):', e.message);
    return [];
  }
}

/**
 * 특정 날짜의 식단 기록을 Google Sheets에서 완전 삭제합니다.
 * @param {string} date - YYYY-MM-DD 형식 날짜
 */
export async function deleteFromSheets(date) {
  if (!API_BASE) return;
  try {
    await fetch(`${API_BASE}/api/sheets/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
  } catch (e) {
    console.warn('[SheetsSync] 삭제 실패 (무시):', e.message);
  }
}

/**
 * Google Sheets Settings 탭에서 비밀번호를 가져옵니다.
 * @returns {Promise<string>} 비밀번호 문자열 (기본: '0000')
 */
export async function getPassword() {
  if (!API_BASE) return '0000';
  try {
    const res = await fetch(`${API_BASE}/api/settings/password`);
    if (!res.ok) return '0000';
    const data = await res.json();
    return data.password || '0000';
  } catch (e) {
    return '0000';
  }
}

/**
 * 이미지를 base64로 변환하여 Gemini Vision 분석을 요청합니다.
 * @param {string} imageBase64 - base64 인코딩된 이미지
 * @param {string} mimeType - 이미지 MIME 타입
 * @returns {Promise<object|null>} 감지된 음식 목록
 */
export async function analyzeImageViaBackend(imageBase64, mimeType = 'image/jpeg') {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('[SheetsSync] 이미지 분석 실패:', e.message);
    return null;
  }
}
