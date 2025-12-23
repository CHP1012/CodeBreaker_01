
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameStats, Puzzle, CipherType } from './types';
import { generateDailyPuzzle, getDailySeed } from './lib/generator';
import { CipherDisplay } from './components/game/CipherDisplay';
import { Grid } from './components/game/Grid';
import { Keyboard } from './components/game/Keyboard';
import { BrutalistButton } from './components/ui/BrutalistButton';
import { Modal } from './components/ui/Modal';
import { AdOverlay } from './components/ui/AdOverlay';

const STORAGE_KEY = 'codebreaker_v1';
const STATS_KEY = 'codebreaker_stats_v1';

const CIPHER_NAMES: Record<CipherType, string> = {
  [CipherType.CAESAR]: '카이사르 (Caesar)',
  [CipherType.ATBASH]: '아트바쉬 (Atbash)',
  [CipherType.A1Z26]: 'A1Z26 (숫자 치환)',
  [CipherType.KEYWORD]: '키워드 (Keyword)',
  [CipherType.PIGPEN]: '피그펜 (Pigpen)',
  [CipherType.RAIL_FENCE]: '레일 펜스 (Rail Fence)',
  [CipherType.VIGENERE]: '비제네르 (Vigenère)'
};

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    lastPlayed: '',
    status: 'PLAYING',
    guesses: [],
    currentGuess: '',
    // Fix: Remove the 'boolean =' type annotation used as a value which caused a syntax error
    hintsUsed: false,
    dailySeed: 0
  } as any);

  const [stats, setStats] = useState<GameStats>({
    played: 0,
    won: 0,
    streak: 0,
    distribution: [0, 0, 0, 0, 0, 0]
  });

  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [workbenchTab, setWorkbenchTab] = useState<'standard' | 'beginner'>('standard');
  const [message, setMessage] = useState<string | null>(null);
  const [missionLog, setMissionLog] = useState<string>("초기화 중...");
  
  const [isGlitching, setIsGlitching] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const [showAd, setShowAd] = useState(false);
  const [adType, setAdType] = useState<'hint' | 'chance'>('hint');
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      setIsLoading(true);
      setError(null);
      const seed = getDailySeed();
      
      try {
        const currentPuzzle = await generateDailyPuzzle(seed);
        setPuzzle(currentPuzzle);

        const savedState = localStorage.getItem(STORAGE_KEY);
        const savedStats = localStorage.getItem(STATS_KEY);

        if (savedStats) setStats(JSON.parse(savedStats));

        const today = new Date().toISOString().split('T')[0];
        if (savedState) {
          const parsed: GameState = JSON.parse(savedState);
          if (parsed.lastPlayed === today && parsed.dailySeed === seed) {
            setGameState(parsed);
          } else {
            setGameState({ 
              lastPlayed: today, 
              dailySeed: seed, 
              guesses: [], 
              currentGuess: '', 
              status: 'PLAYING', 
              hintsUsed: false 
            });
          }
        } else {
          setGameState({ lastPlayed: today, dailySeed: seed, guesses: [], currentGuess: '', status: 'PLAYING', hintsUsed: false });
          setShowHelp(true);
        }
        
        setMissionLog(`[감지] 암호 프로토콜 분해 완료: ${currentPuzzle.type.toUpperCase()}`);
      } catch (err) {
        console.error("Puzzle generation error", err);
        setMissionLog("[경고] 신호 간섭 차단됨. 백업 데이터 로드 중...");
      } finally {
        setIsLoading(false);
      }
    };

    initGame();
  }, []);

  useEffect(() => {
    if (!isLoading && gameState.lastPlayed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState, isLoading]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  const onKey = useCallback((key: string) => {
    if (gameState.status !== 'PLAYING' || isLoading || error) return;

    if (key === 'BACK' || key === 'BACKSPACE') {
      setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
    } else if (key === 'ENTER') {
      if (!puzzle) return;
      if (gameState.currentGuess.length !== puzzle.answer.length) {
        setMessage(`${puzzle.answer.length}글자를 입력하십시오.`);
        setMissionLog(`[오류] 데이터 길이 불일치. ${puzzle.answer.length}자 필요.`);
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
        setTimeout(() => setMessage(null), 1500);
        return;
      }

      const newGuesses = [...gameState.guesses, gameState.currentGuess];
      const isWin = gameState.currentGuess === puzzle.answer;
      const maxAttempts = secondChanceUsed ? 7 : 6;
      const isLoss = !isWin && newGuesses.length >= maxAttempts;
      const newStatus = isWin ? 'WON' : (isLoss ? 'LOST' : 'PLAYING');

      if (isWin) {
        setMissionLog("[성공] 암호 체계 붕괴. 기밀 데이터 확보.");
        setStats(prev => ({
          ...prev,
          played: prev.played + 1,
          won: prev.won + 1,
          streak: prev.streak + 1,
          distribution: prev.distribution.map((d, i) => i === newGuesses.length - 1 ? d + 1 : d)
        }));
        setTimeout(() => setShowStats(true), 1500);
      } else if (isLoss) {
        setMissionLog("[실패] 접근 권한 영구 정지됨.");
        setIsPulsing(true);
        setStats(prev => ({
          ...prev,
          played: prev.played + 1,
          won: prev.won,
          streak: 0,
          distribution: prev.distribution
        }));
        setTimeout(() => setShowStats(true), 1500);
      } else {
        setMissionLog(`[분석] 시도 ${newGuesses.length}/${maxAttempts}: '${gameState.currentGuess}' 대조 실패.`);
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }

      setGameState(prev => ({
        ...prev,
        guesses: newGuesses,
        currentGuess: '',
        status: newStatus
      }));
    } else if (/^[A-Z]$/.test(key)) {
      if (gameState.currentGuess.length < (puzzle?.answer.length || 0)) {
        setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess + key }));
      }
    }
  }, [gameState, puzzle, isLoading, secondChanceUsed, error]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE') onKey('BACK');
      else if (key === 'ENTER') onKey('ENTER');
      else if (/^[A-Z]$/.test(key)) onKey(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKey]);

  const onAdComplete = () => {
    setShowAd(false);
    if (adType === 'hint' && puzzle) {
      setGameState(prev => ({ ...prev, hintsUsed: true }));
      setMessage(`[기밀] 첫 글자는 '${puzzle.answer[0]}'입니다.`);
      setMissionLog(`[정보 확보] 암호문의 선두 문자는 '${puzzle.answer[0]}'로 확인됨.`);
      setTimeout(() => setMessage(null), 3000);
    } else if (adType === 'chance') {
      setSecondChanceUsed(true);
      setGameState(prev => ({ ...prev, status: 'PLAYING' }));
      setIsPulsing(false);
      setShowStats(false);
      setMissionLog("[복구] 시스템 오버라이드. 마지막 시도 권한 부여.");
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0]">
      <div className="text-center space-y-4">
        <h1 className="heading text-2xl animate-pulse">임무 데이터 로딩 중...</h1>
        <div className="w-48 h-1 bg-black mx-auto overflow-hidden">
          <div className="h-full bg-red-600 animate-[scanline_1.5s_linear_infinite]"></div>
        </div>
      </div>
    </div>
  );

  if (!puzzle) return null;

  return (
    <div className={`min-h-screen max-w-md mx-auto px-4 py-4 flex flex-col bg-[#F0F0F0] select-none transition-all ${isGlitching ? 'glitch-active' : ''} ${isPulsing ? 'pulse-red-active' : ''}`}>
      
      {/* 1. 최상단 암호화 유형 */}
      <div className="mb-4 flex flex-col items-center justify-center border-b-2 border-black pb-2">
        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">암호 프로토콜 탐지됨</span>
        <h2 className="text-xl font-black text-black">
          {CIPHER_NAMES[puzzle.type]}
        </h2>
      </div>

      {gameState.status !== 'PLAYING' && (
        <div className="mission-stamp">{gameState.status === 'WON' ? '승인됨' : '차단됨'}</div>
      )}

      <AdOverlay 
        isOpen={showAd} 
        onAdComplete={onAdComplete} 
        onClose={() => setShowAd(false)} 
        type={adType} 
      />

      {/* 2. 헤더 섹션 */}
      <header className="flex justify-between items-center mb-4 z-10">
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tighter">CODEBREAKER</h1>
          <div className="absolute -top-2 -right-6 rotate-12 bg-red-600 text-white text-[9px] px-2 py-0.5 font-bold border-2 border-black shadow-[2px_2px_0px_black]">기밀 취급</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHelp(true)} className="brutalist-border bg-white w-9 h-9 font-bold brutalist-shadow-sm hover:translate-y-0.5 transition-all text-xl">?</button>
          <button onClick={() => setShowStats(true)} className="brutalist-border bg-white w-9 h-9 font-bold brutalist-shadow-sm hover:translate-y-0.5 transition-all text-xl">#</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 z-10">
        {/* 3. 첩보 데이터 스트림 터미널 */}
        <div className="mb-3 bg-black text-green-500 p-2 font-mono text-[10px] brutalist-border">
          <div className="flex justify-between border-b border-green-900 mb-1 pb-1">
            <span className="font-bold tracking-tighter">LIVE INTEL STREAM // NODE-04</span>
            <span className="animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 활동 중
            </span>
          </div>
          <p className="truncate text-green-400 font-bold leading-relaxed">{"> "} {missionLog}</p>
        </div>

        {/* 4. 워크벤치 제어 */}
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={() => setShowWorkbench(!showWorkbench)} 
            className={`flex-1 py-2 text-xs font-black border-4 border-black transition-all brutalist-shadow-sm ${showWorkbench ? 'bg-black text-white translate-y-0.5 shadow-none' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
          >
            {showWorkbench ? '워크벤치 비활성화 ▲' : '해독 워크벤치 활성화 ▼'}
          </button>
          {gameState.status === 'PLAYING' && !gameState.hintsUsed && (
            <button 
              onClick={() => { setAdType('hint'); setShowAd(true); }} 
              className="ml-3 px-3 py-2 text-xs font-black text-red-600 border-2 border-red-600 bg-white hover:bg-red-50"
            >
              힌트 요청
            </button>
          )}
        </div>

        {/* 5. 워크벤치 패널 (직관적/상세 가이드) */}
        {showWorkbench && (
          <div className="mb-4 bg-white brutalist-border brutalist-shadow-sm overflow-hidden flex flex-col max-h-[380px] animate-in slide-in-from-top duration-200">
            <div className="flex border-b-2 border-black bg-gray-100">
              <button 
                onClick={() => setWorkbenchTab('standard')} 
                className={`flex-1 py-2 text-[10px] font-black ${workbenchTab === 'standard' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                직관적 암호 분석
              </button>
              <button 
                onClick={() => setWorkbenchTab('beginner')} 
                className={`flex-1 py-2 text-[10px] font-black ${workbenchTab === 'beginner' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                실전 해독 가이드
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap font-bold text-gray-800">
              {workbenchTab === 'standard' ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-2 border-l-4 border-black">
                    <p className="text-[10px] text-gray-400 mb-1">분석 요약</p>
                    {puzzle.decryptionTips}
                  </div>
                  <p className="text-[10px] text-blue-600 italic mt-2">※ 암호화 유형과 가로채기한 신호를 대조하여 패턴을 찾으십시오.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {puzzle.beginnerGuide}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. 암호 메시지 디스플레이 */}
        <CipherDisplay text={puzzle.ciphertext} type={puzzle.type} />

        {message && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-8 py-5 border-4 border-yellow-400 z-[60] font-black text-center shadow-[10px_10px_0px_rgba(0,0,0,0.5)] animate-bounce">
             {message}
          </div>
        )}

        {/* 7. 그리드 및 키보드 */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-0 overflow-y-auto">
          <Grid 
            guesses={gameState.guesses} 
            currentGuess={gameState.currentGuess} 
            answerLength={puzzle.answer.length} 
            answer={puzzle.answer} 
          />
        </div>

        <Keyboard 
          onKey={onKey} 
          guesses={gameState.guesses} 
          answer={puzzle.answer} 
          disabledKeys={[]} 
          correctKeys={[]} 
          presentKeys={[]} 
        />
      </main>

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="작전 지시서: 코드브레이커">
        <div className="space-y-4 text-sm font-bold">
          <p>당신은 국가 기밀 프로젝트의 암호 해독 요원입니다.</p>
          <ul className="list-disc pl-5 space-y-2 text-xs">
            <li>매일 새로운 암호화 프로토콜이 수신됩니다.</li>
            <li>6번의 시도 안에 영문 단어를 맞추십시오.</li>
            <li>해독이 막힐 땐 '워크벤치'를 열어 상세 가이드를 확인하십시오.</li>
            <li>색상 가이드:
              <br/><span className="text-green-600">■ 초록</span>: 위치/글자 일치
              <br/><span className="text-yellow-500">■ 노랑</span>: 글자만 포함됨
              <br/><span className="text-gray-900">■ 검정</span>: 단어에 없음
            </li>
          </ul>
          <BrutalistButton onClick={() => setShowHelp(false)} className="w-full mt-4">데이터 분석 시작</BrutalistButton>
        </div>
      </Modal>

      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="임무 수행 기록">
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2 text-center bg-white p-4 border-2 border-black shadow-inner">
            <div><div className="text-2xl font-black">{stats.played}</div><div className="text-[9px] font-bold uppercase text-gray-500">수행</div></div>
            <div><div className="text-2xl font-black">{stats.won}</div><div className="text-[9px] font-bold uppercase text-gray-500">성공</div></div>
            <div><div className="text-2xl font-black">{Math.round((stats.won / (stats.played || 1)) * 100)}%</div><div className="text-[9px] font-bold uppercase text-gray-500">성공률</div></div>
            <div><div className="text-2xl font-black">{stats.streak}</div><div className="text-[9px] font-bold uppercase text-gray-500">연속</div></div>
          </div>
          
          {gameState.status !== 'PLAYING' && (
            <div className="bg-yellow-100 p-4 border-4 border-black text-center">
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1">해독된 기밀 메시지</p>
              <p className="text-3xl font-black tracking-widest">{puzzle.answer}</p>
            </div>
          )}

          {gameState.status === 'LOST' && !secondChanceUsed && (
            <BrutalistButton variant="danger" className="w-full" onClick={() => { setAdType('chance'); setShowAd(true); }}>시스템 긴급 복구 (광고)</BrutalistButton>
          )}

          <div className="flex gap-2 mt-4">
            <BrutalistButton variant="primary" className="flex-1" onClick={() => {
              const text = `CODEBREAKER [${gameState.status === 'WON' ? gameState.guesses.length : 'X'}/6]\n#코드브레이커 #오늘의암호`;
              navigator.clipboard.writeText(text);
              setMessage("기록이 복사되었습니다.");
              setTimeout(() => setMessage(null), 2000);
            }}>기록 공유</BrutalistButton>
            <BrutalistButton variant="secondary" onClick={() => setShowStats(false)}>닫기</BrutalistButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
