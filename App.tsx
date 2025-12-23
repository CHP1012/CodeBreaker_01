
import React, { useState, useEffect, useCallback } from 'react';
import { CipherType, GameState, GameStats, Puzzle } from './types';
import { generateDailyPuzzle, getDailySeed } from './lib/generator';
import { CipherDisplay } from './components/game/CipherDisplay';
import { Grid } from './components/game/Grid';
import { Keyboard } from './components/game/Keyboard';
import { BrutalistButton } from './components/ui/BrutalistButton';
import { Modal } from './components/ui/Modal';
import { AdOverlay } from './components/ui/AdOverlay';

const STORAGE_KEY = 'codebreaker_v1';
const STATS_KEY = 'codebreaker_stats_v1';

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    lastPlayed: '',
    status: 'PLAYING',
    guesses: [],
    currentGuess: '',
    hintsUsed: false,
    dailySeed: 0
  });

  const [stats, setStats] = useState<GameStats>({
    played: 0,
    won: 0,
    streak: 0,
    distribution: [0, 0, 0, 0, 0, 0]
  });

  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [intelTab, setIntelTab] = useState<'standard' | 'beginner'>('standard');
  const [message, setMessage] = useState<string | null>(null);
  
  // Ad related state
  const [showAd, setShowAd] = useState(false);
  const [adType, setAdType] = useState<'hint' | 'chance'>('hint');
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);

  // Initialize Game
  useEffect(() => {
    const initGame = async () => {
      setIsLoading(true);
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
            setGameState(prev => ({ 
              ...prev, 
              lastPlayed: today, 
              dailySeed: seed, 
              guesses: [], 
              currentGuess: '', 
              status: 'PLAYING', 
              hintsUsed: false 
            }));
          }
        } else {
          setGameState(prev => ({ ...prev, lastPlayed: today, dailySeed: seed }));
          setShowHelp(true);
        }
      } catch (error) {
        console.error("Failed to generate puzzle", error);
        setMessage("신호 간섭 발생. 재접속 중...");
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
    if (gameState.status !== 'PLAYING' || isLoading) return;

    if (key === 'BACK' || key === 'BACKSPACE') {
      setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
    } else if (key === 'ENTER') {
      if (!puzzle) return;
      if (gameState.currentGuess.length !== puzzle.answer.length) {
        setMessage(`${puzzle.answer.length}글자를 입력하세요`);
        setTimeout(() => setMessage(null), 1500);
        return;
      }

      const newGuesses = [...gameState.guesses, gameState.currentGuess];
      const isWin = gameState.currentGuess === puzzle.answer;
      
      // If used second chance, max attempts is 7, otherwise 6.
      const maxAttempts = secondChanceUsed ? 7 : 6;
      const isLoss = !isWin && newGuesses.length >= maxAttempts;
      
      const newStatus = isWin ? 'WON' : (isLoss ? 'LOST' : 'PLAYING');

      if (isWin || isLoss) {
        setStats(prev => ({
          ...prev,
          played: prev.played + 1,
          won: isWin ? prev.won + 1 : prev.won,
          streak: isWin ? prev.streak + 1 : 0,
          distribution: isWin ? prev.distribution.map((d, i) => i === newGuesses.length - 1 ? d + 1 : d) : prev.distribution
        }));
        setTimeout(() => setShowStats(true), 1500);
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
  }, [gameState, puzzle, isLoading, secondChanceUsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE') onKey('BACK');
      else if (key === 'ENTER') onKey('ENTER');
      else if (/^[A-Z]$/.test(key)) onKey(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKey]);

  const handleHintClick = () => {
    if (!puzzle || gameState.hintsUsed || gameState.status !== 'PLAYING') return;
    setAdType('hint');
    setShowAd(true);
  };

  const handleSecondChanceClick = () => {
    if (gameState.status !== 'LOST' || secondChanceUsed) return;
    setAdType('chance');
    setShowAd(true);
  };

  const onAdComplete = () => {
    setShowAd(false);
    if (adType === 'hint' && puzzle) {
      setGameState(prev => ({ ...prev, hintsUsed: true }));
      setMessage(`긴급 인텔: 첫 글자는 '${puzzle.answer[0]}' 입니다`);
      setTimeout(() => setMessage(null), 3000);
    } else if (adType === 'chance') {
      setSecondChanceUsed(true);
      setGameState(prev => ({ ...prev, status: 'PLAYING' }));
      setShowStats(false);
      setMessage(`기회 추가: 마지막 1번의 시도가 허용됩니다`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const shareResults = () => {
    const today = new Date().toLocaleDateString();
    const result = gameState.status === 'WON' ? `${gameState.guesses.length}/6` : 'X/6';
    const text = `CODEBREAKER ${today}\nRESULT: ${result}\n#코드브레이커 #DailyPuzzle`;
    navigator.clipboard.writeText(text);
    setMessage('복사 완료');
    setTimeout(() => setMessage(null), 2000);
  };

  const renderReferenceGrid = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="mt-4 border-t-2 border-black pt-3">
        <p className="text-[10px] font-bold uppercase mb-2">알파벳 인덱스 (참조용)</p>
        <div className="grid grid-cols-7 gap-1">
          {alphabet.map((char, i) => (
            <div key={char} className="flex flex-col items-center bg-gray-50 border border-gray-200 p-0.5 rounded-sm">
              <span className="text-[9px] font-bold">{char}</span>
              <span className="text-[8px] opacity-50">{String(i).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] mt-2 italic text-gray-500">* 비제네르/시프트 해독 시 글자 간의 거리를 계산할 때 사용하세요.</p>
      </div>
    );
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0] p-6 text-center">
      <div className="space-y-4">
        <div className="text-3xl font-bold animate-pulse tracking-tighter heading">INTERCEPTING SIGNAL...</div>
        <div className="w-48 h-1 bg-black mx-auto overflow-hidden">
          <div className="w-full h-full bg-red-600 animate-[scanline_2s_linear_infinite]"></div>
        </div>
        <p className="font-mono text-[10px] uppercase opacity-50">Decoding Classified Transmission</p>
      </div>
    </div>
  );

  if (!puzzle) return null;

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 py-4 flex flex-col sm:max-w-xl sm:px-6 sm:py-8 bg-[#F0F0F0] select-none">
      {/* Ad Overlay */}
      <AdOverlay 
        isOpen={showAd} 
        onAdComplete={onAdComplete} 
        onClose={() => setShowAd(false)} 
        type={adType} 
      />

      {/* Header */}
      <header className="flex justify-between items-center mb-4 border-b-4 border-black pb-2 sm:mb-6 flex-shrink-0">
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter">CODEBREAKER</h1>
          <div className="absolute -top-3 -right-6 rotate-12 bg-red-600 text-white text-[8px] px-1 sm:px-2 py-0.5 font-bold brutalist-border shadow-sm">SECRET</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHelp(true)} className="brutalist-border bg-white brutalist-shadow-sm font-bold w-9 h-9 flex items-center justify-center hover:bg-black hover:text-white transition-all active:translate-y-0.5">?</button>
          <button onClick={() => setShowStats(true)} className="brutalist-border bg-white brutalist-shadow-sm font-bold w-9 h-9 flex items-center justify-center hover:bg-black hover:text-white transition-all active:translate-y-0.5">#</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        {/* Protocol Info Area */}
        <div className="mb-3 flex flex-col gap-2 flex-shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-widest">ENCRYPTION PROTOCOL</span>
              <span className="text-sm font-bold uppercase">{puzzle.type}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowIntel(!showIntel)} 
                className={`text-[9px] font-bold border-2 border-black px-2 py-1 uppercase transition-all ${showIntel ? 'bg-black text-white' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
              >
                {showIntel ? '워크벤치 닫기' : '해독 워크벤치'}
              </button>
              {gameState.status === 'PLAYING' && !gameState.hintsUsed && (
                <button onClick={handleHintClick} className="text-[9px] font-bold border-b-2 border-red-600 uppercase text-red-600 hover:text-red-400">광고 시청 후 힌트</button>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-white brutalist-border brutalist-shadow-sm relative">
            <p className="text-xs sm:text-sm font-medium italic leading-snug">"{puzzle.description}"</p>
          </div>
        </div>

        {/* Workbench Section */}
        {showIntel && (
          <div className="mb-4 bg-white brutalist-border brutalist-shadow-sm animate-in fade-in slide-in-from-top-4 flex-shrink-0 overflow-hidden flex flex-col max-h-[350px] sm:max-h-none">
            {/* Intel Tabs */}
            <div className="flex border-b-2 border-black">
              <button 
                onClick={() => setIntelTab('standard')}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-tighter ${intelTab === 'standard' ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                분석 데이터
              </button>
              <button 
                onClick={() => setIntelTab('beginner')}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-tighter ${intelTab === 'beginner' ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}
              >
                입문자 공략법
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              {intelTab === 'standard' ? (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase flex items-center gap-2">
                    <span className="bg-black text-white px-1.5 py-0.5">DATA</span> 기본 해독 원리
                  </h3>
                  <div className="text-[11px] leading-relaxed text-gray-800 font-medium whitespace-pre-line">
                    {puzzle.decryptionTips}
                  </div>
                  {renderReferenceGrid()}
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase flex items-center gap-2">
                    <span className="bg-red-600 text-white px-1.5 py-0.5">GUIDE</span> 단계별 해독 가이드
                  </h3>
                  <div className="text-[11px] leading-relaxed text-red-800 font-bold whitespace-pre-line bg-red-50 p-3 border border-red-100 rounded-sm">
                    {puzzle.beginnerGuide}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <CipherDisplay text={puzzle.ciphertext} type={puzzle.type} />

        {/* Status Message */}
        {message && (
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-2 brutalist-border z-50 animate-bounce shadow-2xl text-xs font-bold">
             {message}
          </div>
        )}

        {/* Grid Area */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-0 overflow-y-auto">
          <Grid 
            guesses={gameState.guesses} 
            currentGuess={gameState.currentGuess} 
            answerLength={puzzle.answer.length} 
            answer={puzzle.answer}
          />
        </div>

        {/* Fake Banner Ad Area */}
        <div className="w-full bg-zinc-200 h-16 mb-4 brutalist-border flex items-center justify-center relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 bg-zinc-400 text-[8px] px-1 font-bold text-white">AD</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center px-4">
            [MANUS AI] 최고의 인공지능 요원과 함께 암호를 해독하세요. <br/> <span className="underline cursor-pointer">더 알아보기</span>
          </div>
        </div>

        {/* Virtual Keyboard */}
        <Keyboard 
          onKey={onKey} 
          guesses={gameState.guesses}
          answer={puzzle.answer}
          disabledKeys={[]}
          correctKeys={[]}
          presentKeys={[]}
        />
      </main>

      {/* Footer Decoration */}
      <footer className="mt-4 text-[8px] text-gray-400 uppercase tracking-[0.4em] text-center flex-shrink-0 opacity-50">
        DECRYPTING // CONNECTION SECURE // {new Date().toLocaleDateString()}
      </footer>

      {/* Modals */}
      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="작전 프로토콜">
        <div className="space-y-4 text-xs sm:text-sm">
          <p>전 세계의 암호화된 통신을 가로챘습니다. 당신의 임무는 매일 갱신되는 6번의 기회 안에 비밀 단어를 해독하는 것입니다.</p>
          <div className="bg-black text-white p-4 font-mono text-[11px] brutalist-border relative overflow-hidden">
            <p className="text-red-500 font-bold mb-2">>> 해독 수칙:</p>
            <p>1. <span className="text-yellow-400">해독 워크벤치</span>를 활성화하여 암호의 원리를 분석하십시오.</p>
            <p>2. 암호가 너무 어렵다면 <span className="text-red-500 font-bold">입문자 공략법</span> 탭을 확인하십시오.</p>
            <p>3. 키보드로 추측한 단어를 입력하십시오.</p>
            <div className="grid grid-cols-1 gap-1 mt-3 border-l-2 border-gray-700 pl-3">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#00CC66]"></div> <span>녹색: 글자와 위치 모두 일치</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#FFCC00]"></div> <span className="text-gray-300">황색: 글자는 맞으나 위치가 틀림</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-600"></div> <span className="text-gray-400">회색: 포함되지 않은 글자</span></div>
            </div>
          </div>
          <BrutalistButton onClick={() => setShowHelp(false)} className="w-full mt-2">임무 확인</BrutalistButton>
        </div>
      </Modal>

      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="데이터 보고">
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2 text-center border-b-2 border-black pb-4">
            <div className="bg-white p-2 border"><div className="text-xl font-bold">{stats.played}</div><div className="text-[8px] uppercase font-bold text-gray-500">작전</div></div>
            <div className="bg-white p-2 border"><div className="text-xl font-bold">{stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%</div><div className="text-[8px] uppercase font-bold text-gray-500">성공률</div></div>
            <div className="bg-white p-2 border"><div className="text-xl font-bold">{stats.streak}</div><div className="text-[8px] uppercase font-bold text-gray-500">연승</div></div>
            <div className="bg-white p-2 border"><div className="text-xl font-bold">{Math.max(...stats.distribution, 0)}</div><div className="text-[8px] uppercase font-bold text-gray-500">최적</div></div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase mb-3">해독 시도 분포</h3>
            <div className="space-y-2">
              {stats.distribution.map((count, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-3 font-bold">{i + 1}</span>
                  <div className="flex-1 bg-gray-200 h-4 relative">
                    <div 
                      className={`h-full flex items-center justify-end px-2 text-white text-[9px] font-bold transition-all duration-500 ${gameState.status === 'WON' && gameState.guesses.length === i + 1 ? 'bg-[#00CC66]' : 'bg-[#111111]'}`}
                      style={{ width: `${Math.max((count / Math.max(...stats.distribution, 1)) * 100, 5)}%` }}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {gameState.status !== 'PLAYING' && (
            <div className="pt-6 border-t-2 border-black text-center space-y-4">
              <div className={`font-bold text-2xl uppercase tracking-[0.2em] ${gameState.status === 'WON' ? 'text-[#00CC66]' : 'text-red-600'}`}>
                {gameState.status === 'WON' ? 'MISSION SUCCESS' : 'MISSION FAILED'}
              </div>
              
              {gameState.status === 'LOST' && !secondChanceUsed && (
                <div className="bg-zinc-100 p-4 brutalist-border space-y-3">
                  <p className="text-[11px] font-bold uppercase">작전이 거의 실패했습니다. <br/> 광고를 시청하고 마지막 기회를 얻으시겠습니까?</p>
                  <BrutalistButton variant="primary" className="w-full !mb-0" onClick={handleSecondChanceClick}>광고 시청 (+1 기회)</BrutalistButton>
                </div>
              )}

              {gameState.status === 'LOST' && (secondChanceUsed || gameState.guesses.length >= 7) && (
                <div className="bg-red-50 p-3 border border-red-200 text-xs">
                  복구된 정답: <span className="font-bold text-red-700 underline text-sm ml-1">{puzzle.answer}</span>
                </div>
              )}
              
              <BrutalistButton variant="success" className="w-full" onClick={shareResults}>작전 기록 공유</BrutalistButton>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default App;
