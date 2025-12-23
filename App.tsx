import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameStats, Puzzle } from './types';
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
  const [error, setError] = useState<string | null>(null);
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
  const [missionLog, setMissionLog] = useState<string>("SYSTEM INITIALIZING...");
  
  const [isGlitching, setIsGlitching] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const [showAd, setShowAd] = useState(false);
  const [adType, setAdType] = useState<'hint' | 'chance'>('hint');
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);

  const speak = (text: string, isUrgent = false) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = isUrgent ? 1.4 : 1.0;
    utterance.pitch = isUrgent ? 1.3 : 0.8;
    window.speechSynthesis.speak(utterance);
  };

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
        
        setMissionLog(`INCOMING SIGNAL DETECTED. ENCRYPTION: ${currentPuzzle.type.toUpperCase()}`);
        speak(`새로운 암호 신호 수신. ${currentPuzzle.type} 프로토콜이 감지되었습니다.`);
      } catch (err) {
        console.error("Puzzle generation error", err);
        const errorMsg = "SIGNAL INTERFERENCE. CHECK API KEY SETTINGS.";
        setMissionLog(errorMsg);
        setError(errorMsg);
        speak("시스템 오류 발생. 암호 신호를 복원할 수 없습니다.", true);
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
        setMessage(`${puzzle.answer.length}글자를 채워야 합니다.`);
        setMissionLog(`ERROR: INCOMPLETE DATA. ${puzzle.answer.length} CHARS REQUIRED.`);
        speak("데이터가 부족합니다.", true);
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
        setMissionLog("DECRYPTION SUCCESSFUL. DATA RETRIEVED.");
        speak("해독 완료. 액세스를 허가합니다.");
        setStats(prev => ({
          ...prev,
          played: prev.played + 1,
          won: prev.won + 1,
          streak: prev.streak + 1,
          distribution: prev.distribution.map((d, i) => i === newGuesses.length - 1 ? d + 1 : d)
        }));
        setTimeout(() => setShowStats(true), 1500);
      } else if (isLoss) {
        setMissionLog("CRITICAL FAILURE. ACCESS DENIED.");
        speak("시스템 락다운. 해독에 실패했습니다.", true);
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
        setMissionLog(`ATTEMPT ${newGuesses.length}/${maxAttempts}: ${gameState.currentGuess} ANALYZED.`);
        speak(`${gameState.currentGuess} 분석 중. 일치하지 않습니다.`);
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
      setMessage(`INTEL: FIRST CHAR IS '${puzzle.answer[0]}'`);
      setMissionLog(`HINT ACQUIRED: STARTING CHAR IS '${puzzle.answer[0]}'.`);
      speak(`기밀 정보를 획득했습니다. 첫 글자는 ${puzzle.answer[0]}입니다.`);
      setTimeout(() => setMessage(null), 3000);
    } else if (adType === 'chance') {
      setSecondChanceUsed(true);
      setGameState(prev => ({ ...prev, status: 'PLAYING' }));
      setIsPulsing(false);
      setShowStats(false);
      setMissionLog("OVERRIDE: SYSTEM REBOOTED for 1 ATTEMPT.");
      speak("긴급 복구 시스템 가동. 마지막 기회를 부여합니다.");
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0]">
      <div className="text-center space-y-4">
        <h1 className="heading text-2xl animate-pulse">CONNECTING TO NODE...</h1>
        <div className="w-48 h-1 bg-black mx-auto overflow-hidden">
          <div className="h-full bg-red-600 animate-[scanline_1.5s_linear_infinite]"></div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0] p-6 text-center">
      <div className="brutalist-border bg-white p-8 brutalist-shadow max-w-sm">
        <h1 className="heading text-2xl text-red-600 mb-4 tracking-tighter">CRITICAL SYSTEM ERROR</h1>
        <p className="text-sm font-bold mb-6 font-mono">{error}</p>
        <BrutalistButton onClick={() => window.location.reload()}>RETRY CONNECTION</BrutalistButton>
      </div>
    </div>
  );

  if (!puzzle) return null;

  return (
    <div className={`min-h-screen max-w-md mx-auto px-4 py-4 flex flex-col bg-[#F0F0F0] select-none transition-all ${isGlitching ? 'glitch-active' : ''} ${isPulsing ? 'pulse-red-active' : ''}`}>
      
      {gameState.status !== 'PLAYING' && (
        <div className="mission-stamp">{gameState.status === 'WON' ? 'PASSED' : 'DENIED'}</div>
      )}

      <AdOverlay 
        isOpen={showAd} 
        onAdComplete={onAdComplete} 
        onClose={() => setShowAd(false)} 
        type={adType} 
      />

      <header className="flex justify-between items-center mb-4 border-b-4 border-black pb-2 flex-shrink-0 z-10">
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tighter">CODEBREAKER</h1>
          <div className="absolute -top-3 -right-6 rotate-12 bg-red-600 text-white text-[8px] px-2 py-0.5 font-bold brutalist-border">TOP SECRET</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHelp(true)} className="brutalist-border bg-white w-8 h-8 font-bold brutalist-shadow-sm hover:translate-y-0.5 transition-all">?</button>
          <button onClick={() => setShowStats(true)} className="brutalist-border bg-white w-8 h-8 font-bold brutalist-shadow-sm hover:translate-y-0.5 transition-all">#</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 z-10">
        <div className="mb-2 bg-black text-green-500 p-2 font-mono text-[9px] brutalist-border">
          <div className="flex justify-between border-b border-green-900 mb-1">
            <span>TERMINAL v1.2</span>
            <span className="animate-pulse">ONLINE</span>
          </div>
          <p className="truncate">{"> "} {missionLog}</p>
        </div>

        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-[8px] font-bold text-gray-400 block tracking-widest uppercase">ENCRYPTION TYPE</span>
            <span className="text-xs font-bold uppercase">{puzzle.type}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowIntel(!showIntel)} 
              className={`text-[9px] font-bold border-2 border-black px-2 py-1 uppercase ${showIntel ? 'bg-black text-white' : 'bg-yellow-400'}`}
            >
              {showIntel ? 'CLOSE INTEL' : 'OPEN INTEL'}
            </button>
            {gameState.status === 'PLAYING' && !gameState.hintsUsed && (
              <button onClick={() => { setAdType('hint'); setShowAd(true); }} className="text-[9px] font-bold text-red-600 underline uppercase">REQ HINT</button>
            )}
          </div>
        </div>

        {showIntel && (
          <div className="mb-4 bg-white brutalist-border brutalist-shadow-sm overflow-hidden flex flex-col max-h-[300px]">
            <div className="flex border-b-2 border-black">
              <button onClick={() => setIntelTab('standard')} className={`flex-1 py-1 text-[9px] font-bold ${intelTab === 'standard' ? 'bg-black text-white' : ''}`}>ANALYSIS</button>
              <button onClick={() => setIntelTab('beginner')} className={`flex-1 py-1 text-[9px] font-bold ${intelTab === 'beginner' ? 'bg-red-600 text-white' : ''}`}>GUIDE</button>
            </div>
            <div className="p-3 overflow-y-auto text-[10px] leading-relaxed">
              {intelTab === 'standard' ? puzzle.decryptionTips : puzzle.beginnerGuide}
            </div>
          </div>
        )}

        <CipherDisplay text={puzzle.ciphertext} type={puzzle.type} />

        {message && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-6 py-4 brutalist-border z-[60] font-bold text-center shadow-2xl animate-bounce">
             {message}
          </div>
        )}

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

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="OPERATION: CODEBREAKER">
        <div className="space-y-4 text-sm">
          <p className="font-bold">당신은 기밀 프로젝트의 암호 해독 요원입니다.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>매일 0시, 새로운 기밀 단어와 암호화 프로토콜이 할당됩니다.</li>
            <li>6번의 시도 안에 정답 단어를 맞춰야 합니다.</li>
            <li>추측 후 글자 색상이 상태를 알려줍니다:
              <br/><span className="text-green-600 font-bold">초록</span>: 위치와 글자 일치
              <br/><span className="text-yellow-600 font-bold">노랑</span>: 글자는 포함되나 위치 다름
              <br/><span className="text-gray-600 font-bold">검정</span>: 단어에 포함되지 않음
            </li>
          </ul>
          <BrutalistButton onClick={() => setShowHelp(false)} className="w-full">작전 개시</BrutalistButton>
        </div>
      </Modal>

      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="MISSION REPORT">
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><div className="text-2xl font-bold">{stats.played}</div><div className="text-[8px] uppercase">Played</div></div>
            <div><div className="text-2xl font-bold">{stats.won}</div><div className="text-[8px] uppercase">Won</div></div>
            <div><div className="text-2xl font-bold">{Math.round((stats.won / (stats.played || 1)) * 100)}%</div><div className="text-[8px] uppercase">Win %</div></div>
            <div><div className="text-2xl font-bold">{stats.streak}</div><div className="text-[8px] uppercase">Streak</div></div>
          </div>
          
          {gameState.status !== 'PLAYING' && (
            <div className="bg-white p-3 brutalist-border text-center">
              <p className="text-[10px] uppercase text-gray-400 mb-1">Target Identified</p>
              <p className="text-2xl font-bold tracking-widest">{puzzle.answer}</p>
            </div>
          )}

          {gameState.status === 'LOST' && !secondChanceUsed && (
            <BrutalistButton variant="danger" className="w-full" onClick={() => { setAdType('chance'); setShowAd(true); }}>REQ SECOND CHANCE</BrutalistButton>
          )}

          <div className="flex gap-2">
            <BrutalistButton variant="primary" className="flex-1" onClick={() => {
              const text = `CODEBREAKER [${gameState.status === 'WON' ? gameState.guesses.length : 'X'}/6]\n#DailyCipher`;
              navigator.clipboard.writeText(text);
              setMessage("COPIED TO CLIPBOARD");
              speak("작전 기록을 복사했습니다.");
              setTimeout(() => setMessage(null), 2000);
            }}>SHARE RECORD</BrutalistButton>
            <BrutalistButton variant="secondary" onClick={() => setShowStats(false)}>CLOSE</BrutalistButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;