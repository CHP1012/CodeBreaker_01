import React, { useState, useEffect } from 'react';
import { AdSense } from './AdSense';

interface Props {
  isOpen: boolean;
  onAdComplete: () => void;
  onClose: () => void;
  type: 'hint' | 'chance';
}

export const AdOverlay: React.FC<Props> = ({ isOpen, onAdComplete, onClose, type }) => {
  const [timeLeft, setTimeLeft] = useState(10); // 실제 광고 수익을 위해 대기 시간을 10초로 설정

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 text-white font-mono overflow-y-auto">
      <div className="absolute top-4 right-4 border-2 border-white px-3 py-1 text-[10px] bg-black">
        암호화 프로토콜 해제 중 // {timeLeft > 0 ? `${timeLeft}초 남음` : '해제 완료'}
      </div>
      
      <div className="w-full max-w-sm brutalist-border bg-white p-2 mb-6">
        <div className="bg-gray-200 min-h-[250px] flex items-center justify-center text-black overflow-hidden">
          {/* 
            [중요] 아래 adSlot 값을 애드센스 대시보드에서 생성한 
            디스플레이 광고의 10자리 숫자로 바꾸시면 실제 광고가 송출됩니다.
          */}
          <AdSense adSlot="YOUR_AD_SLOT_ID" />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-xs">
        <h3 className="text-lg font-black uppercase tracking-tighter text-yellow-400">
          {type === 'hint' ? '긴급 데이터 힌트 분석' : '시스템 오버라이드 권한 획득'}
        </h3>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          광고가 표시되는 동안 통신망이 확보됩니다. <br/>
          분석이 완료될 때까지 잠시 기다려 주십시오.
        </p>
        
        {timeLeft <= 0 ? (
          <button 
            onClick={onAdComplete}
            className="w-full py-4 bg-red-600 text-white font-black border-2 border-white shadow-[4px_4px_0px_white] active:translate-y-1 active:shadow-none transition-all"
          >
            데이터 확보 완료 (닫기)
          </button>
        ) : (
          <div className="w-full py-4 bg-zinc-800 text-zinc-500 font-black border-2 border-zinc-700 text-sm">
            분석 진행 중... ({timeLeft})
          </div>
        )}
      </div>

      <button 
        onClick={onClose}
        className="mt-8 text-[10px] uppercase text-zinc-600 underline hover:text-zinc-400"
      >
        작전 중단 (보상 없음)
      </button>
    </div>
  );
};