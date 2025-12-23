
import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onAdComplete: () => void;
  onClose: () => void;
  type: 'hint' | 'chance';
}

export const AdOverlay: React.FC<Props> = ({ isOpen, onAdComplete, onClose, type }) => {
  const [timeLeft, setTimeLeft] = useState(5); // 시뮬레이션을 위해 5초로 설정 (사용자 경험 고려)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(5);
      return;
    }

    if (timeLeft <= 0) {
      onAdComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, timeLeft, onAdComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white font-mono">
      <div className="absolute top-4 right-4 border-2 border-white px-3 py-1 text-xs">
        ADVERTISING // {timeLeft > 0 ? `${timeLeft}S REMAINING` : 'COMPLETE'}
      </div>
      
      <div className="w-full max-w-sm aspect-video bg-zinc-900 border-4 border-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_3px)]"></div>
        </div>
        
        <div className="z-10 text-center space-y-4 px-4">
          <div className="text-4xl font-bold animate-pulse tracking-tighter">MANUS INTEL</div>
          <p className="text-[10px] uppercase tracking-widest leading-relaxed">
            Protect your data with the latest quantum encryption. <br/>
            Trusted by agents worldwide.
          </p>
          <div className="inline-block border-2 border-white px-4 py-2 text-xs font-bold hover:bg-white hover:text-black transition-colors cursor-pointer">
            INSTALL NOW
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-1000 ease-linear" style={{ width: `${(5 - timeLeft) * 20}%` }}></div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] uppercase text-zinc-500 mb-2">You are watching this ad to unlock:</p>
        <div className="text-xl font-bold uppercase tracking-widest border-b-2 border-red-600 inline-block">
          {type === 'hint' ? 'EMERGENCY HINT' : 'SECOND CHANCE (+1 GUESS)'}
        </div>
      </div>

      {timeLeft > 0 && (
        <button 
          onClick={onClose}
          className="mt-12 text-[10px] uppercase text-zinc-600 underline hover:text-zinc-400"
        >
          Skip Ad (Will not unlock reward)
        </button>
      )}
    </div>
  );
};
