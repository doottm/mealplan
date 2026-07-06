import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Apple, 
  Sparkles, 
  Dumbbell, 
  TrendingUp, 
  RotateCcw, 
  History, 
  Smartphone, 
  Info, 
  Trash2, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, // ChevronLeft 추가
  Calendar,    // Calendar 추가
  BarChart2,   // BarChart2 추가
  BookOpen, 
  UtensilsCrossed 
} from 'lucide-react';
import { analyzeMealPlan } from './analyzer';
import { analyzeMealPlanWithGemini } from './geminiAnalyzer';
import { syncToSheets, loadFromSheets, deleteFromSheets, getPassword, analyzeImageViaBackend } from './sheetsSync';

import './App.css';

function App() {
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 텍스트 식단을 mealItems 배열 구조로 역파싱하는 헬퍼
  const parseTextToMealItems = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.split('\n');
    const items = [];
    const timeRegex = /^(점심|저녁|아침|(\d{1,2})[:시](\d{2})?)/;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const match = trimmed.match(timeRegex);
      if (match) {
        const timePart = match[0];
        let formattedTime = timePart;
        if (timePart === '아침') formattedTime = '08:00';
        else if (timePart === '점심') formattedTime = '12:00';
        else if (timePart === '저녁') formattedTime = '18:00';
        else if (timePart.includes(':')) {
          const [h, m] = timePart.split(':');
          formattedTime = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
        } else if (timePart.includes('시')) {
          const h = timePart.replace('시', '');
          formattedTime = `${h.padStart(2, '0')}:00`;
        }
        
        const menuPart = trimmed.substring(timePart.length).replace(/^[:\s,-]+/, '').trim();
        if (menuPart) {
          items.push({ time: formattedTime, menu: menuPart });
        }
      } else {
        items.push({ time: '12:00', menu: trimmed });
      }
    });
    
    return items.sort((a, b) => a.time.localeCompare(b.time));
  };

  const [currentDate, setCurrentDate] = useState(getTodayDateString);
  const [statsFilter, setStatsFilter] = useState('week'); // 'week' | 'month'
  
  const [mealText, setMealText] = useState(
    '아침: 사과 1개, 닭가슴살 1팩\n점심: 현미밥 한공기, 삶은계란 2개, 샐러드\n저녁: 연어구이 한조각, 고구마 반개'
  );
  const [mealItems, setMealItems] = useState(() => parseTextToMealItems(
    '아침: 사과 1개, 닭가슴살 1팩\n점심: 현미밥 한공기, 삶은계란 2개, 샐러드\n저녁: 연어구이 한조각, 고구마 반개'
  ));
  
  // 드롭다운 입력 바인딩용 상태
  const [inputTime, setInputTime] = useState('08:00');
  const [inputMenu, setInputMenu] = useState('');

  const [analysis, setAnalysis] = useState(() => analyzeMealPlan(''));
  const [revisions, setRevisions] = useState([]);
  const [activeTab, setActiveTab] = useState('diet'); // 'diet' | 'history' | 'stats' | 'guide'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const aiAnalyzeTimeoutRef = useRef(null);
  // 도어락
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('doo-auth') === '1');
  const [lockInput, setLockInput] = useState('');
  const [lockError, setLockError] = useState('');
  const [lockPassword, setLockPassword] = useState('0000');
  // 사진 분석
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(null); // base64 preview
  const [imageFoods, setImageFoods] = useState([]); // 감지된 음식 목록
  const photoInputRef = useRef(null);
  // AI 분석 캐싱: 사용자 직접 액션 여부 추적
  const userActionRef = useRef(false);


  // currentDate 기준 1일 전 날짜의 마지막 식사 시간을 가져오는 유틸리티
  const getPrevDayLastMeal = (currentDateStr) => {
    try {
      const stored = localStorage.getItem('doo-mealplan-data');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 1일 전 날짜 구하기
        const d = new Date(currentDateStr);
        d.setDate(d.getDate() - 1);
        const prevDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const prevData = parsed[prevDateStr];
        // 만약 어제 날짜에 기입된 데이터와 파싱된 식사 정보가 존재한다면
        if (prevData && prevData.analysis && prevData.analysis.meals && prevData.analysis.meals.length > 0) {
          // 시간 기준 정렬하여 마지막 식사 획득
          const activeMeals = [...prevData.analysis.meals].sort((a, b) => b.totalMinutes - a.totalMinutes);
          return {
            time: activeMeals[0].time,
            totalMinutes: activeMeals[0].totalMinutes
          };
        }
      }
    } catch (e) {
      console.error('Failed to get previous day last meal', e);
    }
    return null;
  };

  // 로컬 스토리지 데이터 로드 및 저장 헬퍼
  const loadDayData = (dateStr) => {
    try {
      const stored = localStorage.getItem('doo-mealplan-data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[dateStr]) {
          return parsed[dateStr];
        }
      }
    } catch (e) {
      console.error('Failed to load localStorage data', e);
    }
    return null;
  };

  const saveDayData = (dateStr, textStr, analysisObj, revisionList) => {
    try {
      const stored = localStorage.getItem('doo-mealplan-data') || '{}';
      const parsed = JSON.parse(stored);
      parsed[dateStr] = {
        text: textStr,
        analysis: analysisObj,
        revisions: revisionList || [],
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      localStorage.setItem('doo-mealplan-data', JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save localStorage data', e);
    }
  };

  // 온라인/오프라인 상태 모니터링
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 앱 시작 시 비밀번호 불러오기
  useEffect(() => {
    getPassword().then(pw => setLockPassword(pw));
  }, []);

  // 날짜 스위칭 감지 및 동기화
  useEffect(() => {
    // 1. 우선 로컬 스토리지 데이터로 빠른 UI 렌더링
    const dayData = loadDayData(currentDate);
    if (dayData) {
      setMealText(dayData.text);
      setAnalysis(dayData.analysis);
      setRevisions(dayData.revisions || []);
      setMealItems(parseTextToMealItems(dayData.text));
    } else {
      if (currentDate === getTodayDateString()) {
        const defaultText = '아침: 사과 1개, 닭가슴살 1팩\n점심: 현미밥 한공기, 삶은계란 2개, 샐러드\n저녁: 연어구이 한조각, 고구마 반개';
        setMealText(defaultText);
        setAnalysis(analyzeMealPlan(defaultText, getPrevDayLastMeal(currentDate)));
        setMealItems(parseTextToMealItems(defaultText));
      } else {
        setMealText('');
        setAnalysis(analyzeMealPlan(''));
        setMealItems([]);
      }
      setRevisions([]);
    }

    // 2. 백그라운드에서 Google Sheets DB를 조회하여 최신 데이터로 동기화 (다중 브라우저 동기화)
    const fetchCloudData = async () => {
      const cloudData = await loadFromSheets(currentDate);
      if (cloudData && cloudData.text) {
        // 클라우드 데이터가 존재하고, 로컬과 텍스트가 다르다면 클라우드(DB) 데이터를 강제 우선 적용
        if (!dayData || dayData.text !== cloudData.text) {
          console.log('[Sync] 클라우드 DB에서 최신 데이터 동기화 완료');
          setMealText(cloudData.text);
          setAnalysis(cloudData.analysis);
          setMealItems(parseTextToMealItems(cloudData.text));
          // 로컬 스토리지도 최신 DB 데이터로 갱신
          saveDayData(currentDate, cloudData.text, cloudData.analysis, dayData?.revisions || []);
        }
      }
    };
    fetchCloudData();
  }, [currentDate]);

  // mealItems 가 바뀔 때 텍스트를 컴파일하여 mealText 및 analysis 갱신
  // - 사용자 직접 액션(추가/삭제) 시에만 Gemini AI 호출 (캐싱 적용)
  // - 단순 날짜 변경/새로고침 시는 저장된 실적 그대로 표시
  useEffect(() => {
    const compiledText = mealItems.map(item => `${item.time} ${item.menu}`).join('\n');
    setMealText(compiledText);

    // 사용자 직접 액션이 아닌 경우 (cloud sync, 날짜 변경, 새로고침)
    // 로콜 분석만 하고 Gemini AI는 호출하지 않음
    if (!userActionRef.current) {
      // 로컴 저장된 analysis를 그대로 유지 (이미 setAnalysis 되어있음)
      const localResult = analyzeMealPlan(compiledText, getPrevDayLastMeal(currentDate));
      if (!loadDayData(currentDate)?.analysis) {
        setAnalysis(localResult);
      }
      saveDayData(currentDate, compiledText, analysis, revisions);
      return;
    }
    // 사용자 액션 플래그 리셋
    userActionRef.current = false;

    // 1단계: 로컴 분석 즉시 반영
    const localResult = analyzeMealPlan(compiledText, getPrevDayLastMeal(currentDate));
    setAnalysis(localResult);
    saveDayData(currentDate, compiledText, localResult, revisions);

    // 2단계: Gemini AI 분석 (디바운스 500ms)
    if (aiAnalyzeTimeoutRef.current) clearTimeout(aiAnalyzeTimeoutRef.current);
    if (!compiledText.trim()) return;

    aiAnalyzeTimeoutRef.current = setTimeout(async () => {
      setIsAiAnalyzing(true);
      try {
        const aiResult = await analyzeMealPlanWithGemini(compiledText, getPrevDayLastMeal(currentDate));
        if (aiResult) {
          setAnalysis(aiResult);
          saveDayData(currentDate, compiledText, aiResult, revisions);
          syncToSheets(currentDate, compiledText, aiResult);
        }
      } catch (e) {
        console.warn('[App] Gemini AI 분석 실패, 로컴 결과 유지:', e);
      } finally {
        setIsAiAnalyzing(false);
      }
    }, 500);
  }, [mealItems]);


  // 식사 타임라인 추가 핸들러
  const handleAddMealItem = () => {
    if (!inputMenu.trim()) return;
    userActionRef.current = true; // 명시적 사용자 액션 플래그
    const existingIdx = mealItems.findIndex(item => item.time === inputTime);
    let updated;
    if (existingIdx > -1) {
      updated = [...mealItems];
      updated[existingIdx].menu = `${updated[existingIdx].menu}, ${inputMenu.trim()}`;
    } else {
      updated = [...mealItems, { time: inputTime, menu: inputMenu.trim() }];
    }
    updated.sort((a, b) => a.time.localeCompare(b.time));
    setMealItems(updated);
    setInputMenu('');
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };

  // 식사 타임라인 삭제 핸들러
  const handleDeleteMealItem = (index) => {
    userActionRef.current = true; // 명시적 사용자 액션 플래그
    const updated = mealItems.filter((_, idx) => idx !== index);
    setMealItems(updated);
  };


  // 수동 식단 분석 요청 (로컬 즉시 + Gemini AI 업데이트)
  const handleAnalyze = async () => {
    const localResult = analyzeMealPlan(mealText, getPrevDayLastMeal(currentDate));
    setAnalysis(localResult);
    saveDayData(currentDate, mealText, localResult, revisions);

    setIsAiAnalyzing(true);
    try {
      const aiResult = await analyzeMealPlanWithGemini(mealText, getPrevDayLastMeal(currentDate));
      if (aiResult) {
        setAnalysis(aiResult);
        saveDayData(currentDate, mealText, aiResult, revisions);
      }
    } catch (e) {
      console.warn('[handleAnalyze] Gemini 분석 실패:', e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 현재 식단을 새로운 리비전(버전)으로 저장
  const handleSaveRevision = () => {
    if (!mealText.trim()) return;

    const currentAnalysis = analyzeMealPlan(mealText, getPrevDayLastMeal(currentDate));
    const newVer = `v${revisions.length + 1}`;
    const newRevision = {
      version: newVer,
      text: mealText,
      analysis: currentAnalysis,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedRevisions = [newRevision, ...revisions];
    setRevisions(updatedRevisions);
    saveDayData(currentDate, mealText, currentAnalysis, updatedRevisions);
    
    // 알림 표시
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };
  // 날짜 이동 핸들러
  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  // 날짜 표시 포맷팅
  const formatDisplayDate = (dateStr) => {
    const today = getTodayDateString();
    const d = new Date(dateStr);
    const options = { month: 'long', day: 'numeric', weekday: 'short' };
    const formatted = d.toLocaleDateString('ko-KR', options);
    
    if (dateStr === today) {
      return `${formatted} (오늘)`;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    if (dateStr === yesterdayStr) {
      return `${formatted} (어제)`;
    }
    
    return formatted;
  };

  // 통계 집계 데이터 구하기
  const getStatsData = () => {
    const stored = localStorage.getItem('doo-mealplan-data') || '{}';
    const parsed = JSON.parse(stored);
    
    const limit = statsFilter === 'week' ? 7 : 30;
    const statsList = [];
    
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('ko-KR', { weekday: 'short' });
      
      const dayRecord = parsed[dateStr];
      statsList.push({
        date: dateStr,
        label: dayLabel,
        calories: dayRecord ? dayRecord.analysis.calories : 0,
        carb: dayRecord ? dayRecord.analysis.carb : 0,
        protein: dayRecord ? dayRecord.analysis.protein : 0,
        fat: dayRecord ? dayRecord.analysis.fat : 0,
        fastingIntervals: dayRecord ? dayRecord.analysis.fastingIntervals || [] : [],
        nightFasting: dayRecord ? dayRecord.analysis.nightFastingDuration || 0 : 0
      });
    }
    
    const recordedDays = statsList.filter(item => item.calories > 0);
    const avgCalories = recordedDays.length > 0
      ? Math.round(recordedDays.reduce((acc, cur) => acc + cur.calories, 0) / recordedDays.length)
      : 0;
      
    const totalCarb = recordedDays.reduce((acc, cur) => acc + cur.carb, 0);
    const totalProtein = recordedDays.reduce((acc, cur) => acc + cur.protein, 0);
    const totalFat = recordedDays.reduce((acc, cur) => acc + cur.fat, 0);
    const macroTotal = totalCarb + totalProtein + totalFat;
    const avgRatio = { carb: 0, protein: 0, fat: 0 };
    if (macroTotal > 0) {
      avgRatio.carb = Math.round((totalCarb / macroTotal) * 100);
      avgRatio.protein = Math.round((totalProtein / macroTotal) * 100);
      avgRatio.fat = 100 - avgRatio.carb - avgRatio.protein;
    }
    
    let fastingDaysCount = 0;
    let totalFastingHours = 0;
    let totalNightFasting = 0;
    let maxFasting = 0;
    
    recordedDays.forEach(day => {
      let dayMax = day.nightFasting || 0;
      day.fastingIntervals.forEach(interval => {
        if (interval.duration > dayMax) {
          dayMax = interval.duration;
        }
      });
      if (dayMax > maxFasting) {
        maxFasting = dayMax;
      }
      
      if (day.fastingIntervals.length > 0) {
        const dayFastingAvg = day.fastingIntervals.reduce((acc, cur) => acc + cur.duration, 0) / day.fastingIntervals.length;
        totalFastingHours += dayFastingAvg;
        fastingDaysCount++;
      }
      if (day.nightFasting > 0) {
        totalNightFasting += day.nightFasting;
      }
    });
    
    const avgFasting = fastingDaysCount > 0 ? Math.round((totalFastingHours / fastingDaysCount) * 10) / 10 : 0;
    const avgNightFasting = recordedDays.length > 0 ? Math.round((totalNightFasting / recordedDays.length) * 10) / 10 : 0;
    
    return {
      statsList,
      avgCalories,
      avgRatio,
      avgFasting,
      avgNightFasting,
      maxFasting,
      recordedDaysCount: recordedDays.length
    };
  };

  const stats = getStatsData();

  // 특정 리비전 로드 (Closed-Loop 피드백 리비전 복원)
  const handleLoadRevision = (rev) => {
    setMealText(rev.text);
    setAnalysis(rev.analysis);
    setActiveTab('diet');
  };

  // 히스토리 초기화
  const handleClearHistory = (e) => {
    e.stopPropagation();
    if (window.confirm('식단 수정 히스토리를 모두 삭제하시겠습니까?')) {
      setRevisions([]);
      saveDayData(currentDate, mealText, analysis, []);
    }
  };

  // 일정 완전 초기화 (로컸 + DB 모두 삭제)
  const handleClearAllMeals = async () => {
    if (!window.confirm(`${formatDisplayDate(currentDate)}의 식단 일정을 모두 삭제하시겠습니까?\nDB에서도 완전히 제거됩니다.`)) return;

    userActionRef.current = true;
    setMealItems([]);
    setMealText('');
    setAnalysis(analyzeMealPlan(''));
    setRevisions([]);

    // 로컸 스토리지에서 제거
    try {
      const stored = JSON.parse(localStorage.getItem('doo-mealplan-data') || '{}');
      delete stored[currentDate];
      localStorage.setItem('doo-mealplan-data', JSON.stringify(stored));
    } catch (e) { /* ignore */ }

    // Google Sheets DB에서도 제거
    deleteFromSheets(currentDate);
  };

  // 사진 촬영 → Gemini Vision 분석 핸들러
  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setShowImagePreview(dataUrl);
      setIsAnalyzingImage(true);
      setImageFoods([]);

      try {
        // base64 추출 (data:image/jpeg;base64, 제거)
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type || 'image/jpeg';
        const result = await analyzeImageViaBackend(base64, mimeType);

        if (result?.detectedFoods?.length > 0) {
          setImageFoods(result.detectedFoods);
        } else {
          alert('음식을 감지하지 못했습니다. 다시 시도해 주세요.');
          setShowImagePreview(null);
        }
      } catch (err) {
        alert('사진 분석 중 오류가 발생했습니다.');
        setShowImagePreview(null);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 사진 분석 결과를 식단에 추가
  const handleAddImageFoods = () => {
    if (imageFoods.length === 0) return;
    userActionRef.current = true;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:00`;
    const menuStr = imageFoods.map(f => `${f.name} ${f.quantity}${f.unit}`).join(', ');
    const existingIdx = mealItems.findIndex(item => item.time === timeStr);
    let updated;
    if (existingIdx > -1) {
      updated = [...mealItems];
      updated[existingIdx].menu += `, ${menuStr}`;
    } else {
      updated = [...mealItems, { time: timeStr, menu: menuStr }];
    }
    updated.sort((a, b) => a.time.localeCompare(b.time));
    setMealItems(updated);
    setShowImagePreview(null);
    setImageFoods([]);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };


  // 과거 특정 날짜 선택 및 탭 포커싱 브릿지
  const handleSelectPastDay = (dateStr) => {
    setCurrentDate(dateStr);
    setActiveTab('diet');
  };

  // 최근 7일(오늘 포함) 리스트 가져오기
  const getPastSevenDays = () => {
    const stored = localStorage.getItem('doo-mealplan-data') || '{}';
    const parsed = JSON.parse(stored);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const options = { month: 'long', day: 'numeric', weekday: 'short' };
      const dayLabel = d.toLocaleDateString('ko-KR', options);
      
      const record = parsed[dateStr];
      days.push({
        date: dateStr,
        label: dayLabel,
        isToday: i === 0,
        record: record || null
      });
    }
    return days;
  };

  const pastSevenDays = getPastSevenDays();

  return (
    <div className="app-wrapper">
      <div className="status-bar-spacer"></div>

      {/* ===== 도어락 화면 ===== */}
      {!isAuthenticated && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #0B0F19 0%, #1a1f35 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px'
        }}>
          <img src="/icons/logo.png" alt="logo" style={{ width: 90, height: 90, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>DOO'S MEAL PLAN</div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>4자리 비밀번호를 입력하세요</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: '50%',
                background: i < lockInput.length ? 'hsl(245, 80%, 65%)' : 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: 'background 0.2s'
              }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: 220 }}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => (
              <button key={idx}
                onClick={() => {
                  if (k === '') return;
                  if (k === '⌫') {
                    setLockInput(prev => prev.slice(0, -1));
                    setLockError('');
                  } else if (lockInput.length < 4) {
                    const next = lockInput + k;
                    setLockInput(next);
                    if (next.length === 4) {
                      if (next === lockPassword) {
                        sessionStorage.setItem('doo-auth', '1');
                        setIsAuthenticated(true);
                        setLockInput('');
                      } else {
                        setLockError('비밀번호가 다릅니다');
                        setTimeout(() => { setLockInput(''); setLockError(''); }, 800);
                      }
                    }
                  }
                }}
                style={{
                  background: k === '' ? 'transparent' : 'rgba(255,255,255,0.07)',
                  border: k === '' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, color: 'white', fontSize: k === '⌫' ? '1.1rem' : '1.3rem',
                  fontWeight: 600, padding: '16px 0', cursor: k === '' ? 'default' : 'pointer',
                  transition: 'background 0.15s'
                }}
              >{k}</button>
            ))}
          </div>
          {lockError && <div style={{ color: 'hsl(0,80%,65%)', fontSize: '0.85rem', fontWeight: 600 }}>{lockError}</div>}
        </div>
      )}

      {/* ===== 이미지 분석 머드 ===== */}
      {showImagePreview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24
        }}>
          <img src={showImagePreview} alt="preview" style={{ maxWidth: '90vw', maxHeight: '40vh', borderRadius: 16, objectFit: 'contain' }} />
          {isAnalyzingImage ? (
            <div style={{ color: 'white', fontSize: '0.9rem' }}>🔍 Gemini가 음식을 분석 중...</div>
          ) : imageFoods.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', width: '100%', maxWidth: 400 }}>
              <div style={{ color: 'white', fontWeight: 700, marginBottom: 10 }}>🍽️ 감지된 음식</div>
              {imageFoods.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: 6 }}>
                  <span>{f.name} {f.quantity}{f.unit}</span>
                  <span style={{ color: 'hsl(245,80%,70%)' }}>{f.kcal} kcal</span>
                </div>
              ))}
              <button
                onClick={handleAddImageFoods}
                style={{
                  marginTop: 14, width: '100%', background: 'linear-gradient(135deg, hsl(245,80%,60%), hsl(280,70%,55%))',
                  border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, padding: '12px 0', cursor: 'pointer', fontSize: '0.9rem'
                }}
              >+ 식단에 추가하기</button>
            </div>
          )}
          <button onClick={() => { setShowImagePreview(null); setImageFoods([]); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: 'rgba(255,255,255,0.6)', padding: '10px 28px', cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      )}

      {/* 헤더 바 */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/icons/logo.png" alt="DOO" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'contain' }} />
          </div>
          <h1 className="brand-name">DOO'S MEAL PLAN</h1>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="offline-badge">
              <Wifi size={10} style={{ marginRight: '2px' }} />
              Online
            </span>
          ) : (
            <span className="offline-badge disconnected">
              <WifiOff size={10} style={{ marginRight: '2px' }} />
              Local-AI
            </span>
          )}
          <button 
            onClick={() => setShowPwaModal(true)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            <Smartphone size={20} />
          </button>
        </div>
      </header>

      {/* 날짜 이동 네비게이터 */}
      {activeTab === 'diet' && (
        <div style={{ padding: '0 20px', marginTop: '14px' }}>
          <div className="date-navigator">
            <button className="date-nav-btn" onClick={handlePrevDay}>
              <ChevronLeft size={18} />
            </button>
            <div className="date-nav-title">
              <Calendar size={16} color="var(--primary)" />
              {formatDisplayDate(currentDate)}
            </div>
            <button className="date-nav-btn" onClick={handleNextDay}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 메인 스크롤 콘텐츠 영역 */}
      <main className="app-content">
        
        {/* 탭 1: 식단 입력 및 실시간 분석 */}
        {activeTab === 'diet' && (
          <>
            {/* 영양 성분 실시간 대시보드 (최상단 배치) */}
            <div className="glass-card glow-primary" style={{ '--score-pct': analysis.score }}>
              <div className="card-title" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="var(--primary)" />
                  AI 식단 피드백 대시보드
                </span>
                {isAiAnalyzing ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '600',
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '20px', padding: '2px 8px', animation: 'pulse 1.2s infinite'
                  }}>
                    <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 0.8s infinite' }}></span>
                    Gemini AI 분석 중…
                  </span>
                ) : analysis._aiPowered ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.66rem', color: '#818cf8', fontWeight: '600',
                    background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)',
                    borderRadius: '20px', padding: '2px 8px'
                  }}>
                    ✦ Gemini AI 분석
                  </span>
                ) : null}
              </div>

              {/* 식사 시간대별 목록 및 공복 간격 정보 (대시보드 내 최상단 배치) */}
              {analysis.meals && analysis.meals.length > 0 && (
                <div style={{ marginTop: '6px', marginBottom: '18px', padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} color="var(--secondary)" />
                    식사 시간 및 공복 간격
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.meals.map((meal, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            background: meal.isVirtual ? 'var(--border-color)' : 'linear-gradient(135deg, var(--secondary), var(--accent))', 
                            color: 'white', 
                            fontSize: '0.7rem', 
                            fontWeight: '700', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            minWidth: '45px',
                            textAlign: 'center'
                          }}>
                            {meal.time}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px', alignItems: 'center' }}>
                            {meal.foods.map((f, fIdx) => (
                              <span key={fIdx} style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: f.isUnrecognized ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                border: f.isUnrecognized ? '1px solid rgba(234, 179, 8, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                                color: f.isUnrecognized ? '#eab308' : 'var(--text-main)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: '600'
                              }}>
                                {f.isUnrecognized && <span style={{ fontSize: '0.65rem' }}>⚠️</span>}
                                {f.name} {f.quantity}{f.unit}
                                {f.isUnrecognized && <small style={{ fontSize: '0.6rem', opacity: 0.8 }}>(보정)</small>}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{meal.calories} kcal</span>
                      </div>
                    ))}
                    {/* #7: 간밤 공복 시간만 표시 (주간 식사 사이 공복은 숨김) */}
                    {analysis.fastingIntervals && analysis.fastingIntervals.filter(iv => iv.start && (iv.start.includes('전일') || iv.start.includes('어제'))).length > 0 && (
                      <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {analysis.fastingIntervals
                          .filter(iv => iv.start && (iv.start.includes('전일') || iv.start.includes('어제')))
                          .slice(0, 1)
                          .map((interval, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>⏱️</span>
                              <span>{interval.formatted}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="score-circle-container">
                {/* 둥근 스코어 휠 */}
                <div className="score-radial">
                  <div className="score-radial-val">
                    {analysis.score}
                    <span className="score-label-small">HEALTH</span>
                  </div>
                </div>
                
                <div className="score-summary-text">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    {analysis.isDaily && (
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: '800', 
                        background: 'rgba(99, 102, 241, 0.15)', 
                        color: 'hsl(245, 80%, 75%)', 
                        padding: '2px 6px', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        letterSpacing: '0.3px'
                      }}>
                        📆 DAILY (하루 식단)
                      </span>
                    )}
                    {analysis.isFasting && (
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: '800', 
                        background: 'rgba(14, 165, 233, 0.15)', 
                        color: 'var(--secondary)', 
                        padding: '2px 6px', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        letterSpacing: '0.3px'
                      }}>
                        ⏱️ FASTING (공복 케어)
                      </span>
                    )}
                    {analysis.isDiet && (
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: '800', 
                        background: 'rgba(16, 185, 129, 0.15)', 
                        color: 'var(--primary)', 
                        padding: '2px 6px', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        letterSpacing: '0.3px'
                      }}>
                        🔥 DIET (감량 집중)
                      </span>
                    )}
                  </div>
                  <div className="score-summary-heading">
                    {analysis.isFasting && analysis.calories < 100 ? '안정적인 공복 단식' : (analysis.score >= 85 ? '아주 모범적인 식사' : (analysis.score >= 70 ? '준수한 식단 구성' : (analysis.score >= 50 ? '균형 보완이 필요한 식단' : '식단 전면 개선 필요')))}
                  </div>
                  <div className="score-summary-desc">{analysis.summary}</div>
                </div>
              </div>

              {/* 영양 섭취량 카드 그리드 */}
              <div className="metrics-grid" style={{ marginTop: '20px' }}>
                <div className="metric-box">
                  <div className="metric-header">
                    <span>에너지</span>
                    <Flame size={12} color="var(--danger)" />
                  </div>
                  <div className="metric-value">
                    {analysis.calories} <small>kcal</small>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-header">
                    <span>탄수화물</span>
                    <Apple size={12} color="var(--secondary)" />
                  </div>
                  <div className="metric-value">
                    {analysis.carb} <small>g</small>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-header">
                    <span>단백질</span>
                    <Dumbbell size={12} color="var(--primary)" />
                  </div>
                  <div className="metric-value">
                    {analysis.protein} <small>g</small>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-header">
                    <span>지방</span>
                    <Sparkles size={12} color="var(--accent)" />
                  </div>
                  <div className="metric-value">
                    {analysis.fat} <small>g</small>
                  </div>
                </div>
              </div>

              {/* #4: 탄단지 3대 영양소 - 하루 권장량 기준 % */}
              {/* 권장량: 탄수화물 324g / 단백질 60g / 지방 54g (2000kcal 기준) */}
              <div className="macro-progress-container">
                {(() => {
                  const DAILY_REC = { carb: 324, protein: 60, fat: 54 };
                  const carbPct = Math.min(Math.round((analysis.carb || 0) / DAILY_REC.carb * 100), 150);
                  const proteinPct = Math.min(Math.round((analysis.protein || 0) / DAILY_REC.protein * 100), 150);
                  const fatPct = Math.min(Math.round((analysis.fat || 0) / DAILY_REC.fat * 100), 150);
                  const overColor = 'hsl(0,80%,60%)';
                  return (
                    <>
                      <div className="macro-bar-row">
                        <span className="macro-name">탄수화물</span>
                        <div className="macro-track">
                          <div className="macro-fill carb" style={{ width: `${Math.min(carbPct, 100)}%`, background: carbPct > 100 ? overColor : undefined }}></div>
                        </div>
                        <span className="macro-pct" style={{ color: carbPct > 100 ? overColor : undefined }}>{carbPct}%</span>
                      </div>
                      <div className="macro-bar-row">
                        <span className="macro-name">단백질</span>
                        <div className="macro-track">
                          <div className="macro-fill protein" style={{ width: `${Math.min(proteinPct, 100)}%`, background: proteinPct > 100 ? overColor : undefined }}></div>
                        </div>
                        <span className="macro-pct" style={{ color: proteinPct > 100 ? overColor : undefined }}>{proteinPct}%</span>
                      </div>
                      <div className="macro-bar-row">
                        <span className="macro-name">지방</span>
                        <div className="macro-track">
                          <div className="macro-fill fat" style={{ width: `${Math.min(fatPct, 100)}%`, background: fatPct > 100 ? overColor : undefined }}></div>
                        </div>
                        <span className="macro-pct" style={{ color: fatPct > 100 ? overColor : undefined }}>{fatPct}%</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>탄수화물 324g / 단백질 60g / 지방 54g 기준</div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 식단 구성 및 타임라인 입력 (에디터 대체 카드) */}
            <div className="glass-card freeform-section">
              <div className="card-title">
                <Sparkles size={14} color="var(--secondary)" />
                식단 구성 및 입력
              </div>
              {/* #5: 주식 입력 및 사진 촬영 */}
              {/* hidden file input for camera */}
              <input type="file" accept="image/*" capture="environment" ref={photoInputRef}
                style={{ display: 'none' }} onChange={handlePhotoSelected} />
              
              {/* 드롭다운 + 텍스트 인풋 조합 입력 폼 */}
              <div className="time-input-form">
                <select 
                  className="time-select-dropdown"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                >
                  {Array.from({ length: 24 }).map((_, h) => {
                    const timeStr = `${String(h).padStart(2, '0')}:00`;
                    return <option key={h} value={timeStr}>{timeStr}</option>;
                  })}
                </select>
                <input 
                  type="text"
                  className="menu-input-field"
                  placeholder="식사 메뉴 입력 (예: 김치찌개 1인분, 밥 1공기)"
                  value={inputMenu}
                  onChange={(e) => setInputMenu(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMealItem();
                  }}
                />
                <button
                  title="사진으로 식단 분석"
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    padding: '10px 13px', borderRadius: '10px', border: 'none',
                    background: 'rgba(99,102,241,0.15)', color: 'hsl(245,80%,70%)',
                    cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0
                  }}
                >📸</button>
                <button className="analyze-btn" style={{ padding: '10px 16px', borderRadius: '10px' }} onClick={handleAddMealItem}>
                  등록
                </button>
              </div>

              {/* 추가된 타임라인 식사 리스트 */}
              {mealItems.length > 0 ? (
                <div className="meal-timeline-list">
                  {mealItems.map((item, idx) => (
                    <div key={idx} className="meal-timeline-item">
                      <div className="meal-timeline-left">
                        <span className="meal-timeline-badge">{item.time}</span>
                        <span className="meal-timeline-text">{item.menu}</span>
                      </div>
                      <div className="meal-timeline-actions">
                        <button className="meal-delete-btn" onClick={() => handleDeleteMealItem(idx)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'rgba(15, 23, 42, 0.2)', borderRadius: '10px', border: '1px dashed var(--border-color)', marginTop: '8px' }}>
                  🕒 오늘의 등록된 식사 일정이 없습니다.<br/>시간을 선택하고 메뉴를 등록해 주세요.
                </div>
              )}

              {/* #3: 일정 초기화 (DB에서도 제거) */}
              <div className="action-row" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <button className="clear-btn" onClick={handleClearAllMeals}>
                  일정 전체 삭제
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isSavedAlert && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', animation: 'fadeIn 0.2s' }}>
                      반영됨!
                    </span>
                  )}
                  <button className="primary-btn" onClick={handleSaveRevision}>
                    <CheckCircle2 size={16} />
                    히스토리에 저장
                  </button>
                </div>
              </div>
            </div>

            {/* AI 정밀 개선 피드백 */}
            <div className="glass-card">
              <div className="card-title">
                <Sparkles size={14} color="var(--accent)" />
                AI 오프라인 추천 가이드
              </div>
              <div className="feedbacks-list">
                {analysis.feedbacks.map((fb, idx) => {
                  let type = 'healthy';
                  if (fb.includes('경고') || fb.includes('부족')) type = 'junk';
                  else if (fb.includes('추천') || fb.includes('보완')) type = 'neutral';
                  
                  return (
                    <div key={idx} className={`feedback-item ${type}`}>
                      <div className="feedback-icon-wrap">
                        <Sparkles size={12} color={type === 'junk' ? 'var(--danger)' : type === 'neutral' ? 'var(--warning)' : 'var(--primary)'} />
                      </div>
                      <div className="feedback-text">{fb}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 탭 2: 리비전(수정) 히스토리 목록 */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. 직전 일주일 식단 기록 섹션 */}
            <div className="glass-card">
              <div className="card-title" style={{ marginBottom: '14px' }}>
                <Calendar size={16} color="var(--primary)" style={{ marginRight: '6px' }} />
                직전 일주일 식단 기록 (7-Day Logs)
              </div>
              
              <div className="past-days-section">
                {pastSevenDays.map((day, idx) => {
                  const hasRecord = !!day.record;
                  const score = hasRecord ? day.record.analysis.score : 0;
                  const scoreType = score >= 85 ? 'healthy' : score >= 70 ? 'warning' : 'danger';
                  
                  return (
                    <div 
                      key={idx} 
                      className="past-day-card"
                      onClick={() => handleSelectPastDay(day.date)}
                    >
                      <div className="past-day-header">
                        <div className="past-day-date">
                          <span>{day.label}</span>
                          {day.isToday && <span style={{ fontSize: '0.65rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '1px 4px', borderRadius: '4px', marginLeft: '4px' }}>오늘</span>}
                        </div>
                        <span className={`past-day-status-badge ${hasRecord ? 'filled' : 'empty'}`}>
                          {hasRecord ? '기록 완료' : '식단 입력 필요 ✏️'}
                        </span>
                      </div>
                      
                      {hasRecord ? (
                        <div className="past-day-body">
                          <span className="past-day-summary">
                            {day.record.analysis.meals.map(m => m.foods.map(f => f.name).join(', ')).join(' | ')}
                          </span>
                          <div className="past-day-metrics">
                            <span>{day.record.analysis.calories} kcal</span>
                            <span className={`past-day-score ${scoreType}`}>{score}점</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>아직 작성된 식단 데이터가 없습니다.</span>
                          <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>새로 채우기 &gt;</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.45', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                💡 <strong>기록 캘린더 연계</strong>: 각 요일별 카드를 누르면 즉각 해당 날짜의 입력 대시보드로 이동하여 식단을 새로 추가하거나 손쉽게 수정/보충하실 수 있습니다.
              </div>
            </div>

            {/* 2. 오늘 날짜의 리비전 목록 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="revision-history-title">
                <div className="card-title" style={{ margin: 0 }}>
                  <History size={16} color="var(--secondary)" style={{ marginRight: '6px' }} />
                  오늘 날짜 수정 이력 (Revisions)
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="revision-badge-count">{revisions.length} revisions</span>
                  {revisions.length > 0 && (
                    <button 
                      onClick={handleClearHistory} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {revisions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                  <History size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.85rem' }}>오늘 날짜의 저장된 리비전 버전이 없습니다.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>식단 탭에서 변경 완료 후 '히스토리에 저장'을 누르면 버전별 변경 이력이 여기에 안전하게 누적됩니다.</p>
                </div>
              ) : (
                <div className="history-list" style={{ maxHeight: '300px' }}>
                  {revisions.map((rev, index) => {
                    const scoreType = rev.analysis.score >= 85 ? 'healthy' : rev.analysis.score >= 70 ? 'warning' : 'junk';
                    return (
                      <div 
                        key={index} 
                        className="history-item"
                        onClick={() => handleLoadRevision(rev)}
                      >
                        <div className="history-item-left">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="history-ver">{rev.version}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rev.timestamp}</span>
                          </div>
                          <div className="history-snippet">{rev.text}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className={`history-score-badge ${scoreType}`}>
                            {rev.analysis.score}점
                          </div>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px' }}>
                ℹ️ <strong>Closed-Loop 피드백 복원</strong>: 위 이력을 클릭하면 당시 식단 텍스트와 분석결과가 에디터에 복구되어 과거 피드백을 기반으로 연속된 수정(Revise)을 진행할 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 모바일 웹앱 PWA 홈 화면 추가 가이드 */}
        {activeTab === 'guide' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card-title">
              <Smartphone size={16} color="var(--primary)" style={{ marginRight: '6px' }} />
              아이폰 홈 화면 추가 안내 (PWA)
            </div>
            
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ display: 'inline-flex', width: '64px', height: '64px', borderRadius: '16px', background: 'transparent', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                <img src="/icons/icon-192.png" alt="DOO" style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'contain' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>DOO'S MEAL PLAN</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>모바일 로컬 전용 프로그레시브 웹앱</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-text">
                  아이폰(iOS) <strong>Safari</strong> 브라우저 하단 툴바의 <strong>공유(Share) 버튼</strong>(상자 위로 향한 화살표 아이콘)을 탭합니다.
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-text">
                  공유 메뉴를 아래로 스크롤하여 <strong>'홈 화면에 추가 (Add to Home Screen)'</strong> 항목을 선택합니다.
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-text">
                  상단 우측의 <strong>'추가(Add)'</strong> 버튼을 누르면 아이폰 배경화면에 인물 드로잉 로고 앱이 설치 완료됩니다!
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', marginTop: '10px' }}>
              🌿 <strong>독립형(Standalone) 모드 구동 장점</strong>:<br />
              - 주소 표시줄이 사라져 완전한 네이티브 모바일 애플리케이션의 경험을 제공합니다.<br />
              - <strong>인터넷 연결이 완전히 단절된 비행기 모드</strong> 등에서도 서비스 워커 캐싱 기술에 의해 고속 실행 및 로컬 AI 분석이 실시간 작동합니다.
            </div>
          </div>
        )}

        {/* 탭 4: 주간/월간 기록 및 통계 */}
        {activeTab === 'stats' && (
          <div className="stats-container">
            {/* 주간 / 월간 필터 탭 */}
            <div className="stats-filter-row">
              <button 
                className={`stats-filter-btn ${statsFilter === 'week' ? 'active' : ''}`}
                onClick={() => setStatsFilter('week')}
              >
                주간 통계 (7일)
              </button>
              <button 
                className={`stats-filter-btn ${statsFilter === 'month' ? 'active' : ''}`}
                onClick={() => setStatsFilter('month')}
              >
                월간 통계 (30일)
              </button>
            </div>

            {/* 통계 요약 카드 */}
            <div className="glass-card">
              <div className="card-title">
                <TrendingUp size={14} color="var(--primary)" />
                식단 통계 요약
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>평균 섭취 칼로리</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                    {stats.avgCalories}<small style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-muted)' }}> kcal</small>
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>기록 일수</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                    {stats.recordedDaysCount}<small style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-muted)' }}> 일</small>
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>최대 공복 시간</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
                    {stats.maxFasting}<small style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-muted)' }}> 시간</small>
                  </div>
                </div>
              </div>
            </div>

            {/* 요일별/일별 칼로리 막대 차트 */}
            <div className="glass-card">
              <div className="card-title" style={{ marginBottom: '25px' }}>
                <Flame size={14} color="var(--danger)" />
                에너지 섭취 추이
              </div>
              <div className="chart-box">
                {/* 권장 한계 기준선 가이드라인 표시 */}
                <div className="chart-limit-line" style={{ bottom: 'calc(20px + (1500 / 2500) * 120px)' }}>
                  <span className="chart-limit-text">체지방 컷팅 한계 (1500 kcal)</span>
                </div>
                
                {stats.statsList.map((day, idx) => {
                  const maxChartKcal = 2500;
                  const pct = Math.min(100, (day.calories / maxChartKcal) * 100);
                  const isExcess = day.calories > 2300;
                  return (
                    <div key={idx} className="chart-bar-wrapper">
                      <div className="chart-bar-track">
                        {day.calories > 0 && (
                          <div 
                            className={`chart-bar-fill ${isExcess ? 'excess' : ''}`} 
                            style={{ height: `${pct}%` }}
                          >
                            <span className="chart-bar-value">{day.calories}</span>
                          </div>
                        )}
                      </div>
                      <span className="chart-bar-label">{statsFilter === 'week' ? day.label : day.date.substring(8, 10)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 평균 공복 시간 게이지 */}
            <div className="glass-card">
              <div className="card-title">
                <Calendar size={14} color="var(--secondary)" />
                식간 공복 & 야간 단식 분석
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
                <div 
                  className="donut-gauge" 
                  style={{ 
                    background: `conic-gradient(var(--secondary) ${Math.min(100, (stats.avgFasting / 8) * 100)}%, var(--border-color) 0)` 
                  }}
                >
                  <div className="donut-value">
                    {stats.avgFasting}
                    <small>시간</small>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>평균 식간 공복 유지</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {stats.avgFasting >= 4 
                      ? '소화기에 적절한 휴식을 부여하여 건강한 대사를 촉진하는 적정 단식 간격입니다.' 
                      : '식사 간격이 다소 잦으면 지방 축적 주기가 빨라집니다. 식간 공복을 4시간 이상 유지해보세요.'}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div 
                  className="donut-gauge" 
                  style={{ 
                    background: `conic-gradient(var(--primary) ${Math.min(100, (stats.avgNightFasting / 16) * 100)}%, var(--border-color) 0)` 
                  }}
                >
                  <div className="donut-value">
                    {stats.avgNightFasting}
                    <small>시간</small>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>평균 야간 단식 주기</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {stats.avgNightFasting >= 12 
                      ? '12시간 이상의 야간 단식으로 세포 정화(오토파지)와 인슐린 감수성 개선을 효과적으로 유도하고 있습니다.' 
                      : '아침 첫 식사까지 12시간 공복을 지켜 가볍고 활기찬 신체 주기를 만들어보세요.'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '14px', padding: '8px 12px', background: 'var(--primary-glow)', border: '1px solid hsla(142, 71%, 45%, 0.2)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎯 이번 {statsFilter === 'week' ? '주' : '달'}의 개인 최고 공복 기록:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{stats.maxFasting}시간 연속 단식 달성!</strong>
              </div>
            </div>

            {/* 영양성분 평균 비율 차트 */}
            <div className="glass-card">
              <div className="card-title">
                <Dumbbell size={14} color="var(--accent)" />
                평균 탄단지 분배 비율
              </div>
              <div className="stacked-progress-bar">
                <div className="stacked-segment carb" style={{ width: `${stats.avgRatio.carb}%` }}></div>
                <div className="stacked-segment protein" style={{ width: `${stats.avgRatio.protein}%` }}></div>
                <div className="stacked-segment fat" style={{ width: `${stats.avgRatio.fat}%` }}></div>
              </div>
              <div className="stacked-labels-row">
                <div className="stacked-label-item">
                  <span className="stacked-dot carb"></span>
                  <span>탄수화물 {stats.avgRatio.carb}%</span>
                </div>
                <div className="stacked-label-item">
                  <span className="stacked-dot protein"></span>
                  <span>단백질 {stats.avgRatio.protein}%</span>
                </div>
                <div className="stacked-label-item">
                  <span className="stacked-dot fat"></span>
                  <span>지방 {stats.avgRatio.fat}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* PWA 퀵 가이드 팝업 모달 */}
      {showPwaModal && (
        <div className="guide-overlay" onClick={() => setShowPwaModal(false)}>
          <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guide-modal-title">📲 아이폰 홈 화면 추가 가이드</div>
            <div className="guide-step">
              <div className="guide-step-num">1</div>
              <div className="guide-step-text">
                Safari 브라우저 하단의 <strong>공유 아이콘</strong>을 터치합니다.
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num">2</div>
              <div className="guide-step-text">
                <strong>'홈 화면에 추가'</strong> 항목을 선택합니다.
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num">3</div>
              <div className="guide-step-text">
                바탕화면에 <strong>인물 드로잉 아이콘</strong>이 등록되면 <strong>네이티브 앱처럼 100% 오프라인</strong> 상태에서도 자유롭게 활용하실 수 있습니다.
              </div>
            </div>
            <button className="guide-close-btn" onClick={() => setShowPwaModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 하단 네이티브 느낌 탭 네비게이션 바 */}
      <nav className="bottom-nav">
        <div 
          className={`nav-tab ${activeTab === 'diet' ? 'active' : ''}`}
          onClick={() => setActiveTab('diet')}
        >
          <Apple size={20} />
          <span>식단 분석</span>
        </div>
        <div 
          className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart2 size={20} />
          <span>통계</span>
        </div>
        <div 
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={20} />
          <span>히스토리</span>
        </div>
        <div 
          className={`nav-tab ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <BookOpen size={20} />
          <span>가이드</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
