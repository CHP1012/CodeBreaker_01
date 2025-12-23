
import React, { useState, useEffect } from 'react';
import { CipherType } from '../../types';
import { PigpenSymbol } from './PigpenSymbol';

interface Props {
  text: string;
  type: CipherType;
}

export const CipherDisplay: React.FC<Props> = ({ text, type }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    setDisplayText('');
    let current = '';
    const interval = setInterval(() => {
      if (current.length < text.length) {
        current += text[current.length];
        setDisplayText(current);
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  if (type === CipherType.PIGPEN) {
    return (
      <div className="p-4 brutalist-border bg-white brutalist-shadow-sm mb-4 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase block text-gray-400 mb-2">INTERCEPTED SIGNALS</span>
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {text.split('').map((char, i) => (
            <PigpenSymbol key={i} char={char} />
          ))}
        </div>
      </div>
    );
  }

  // A1Z26 might be long, handle wrapping
  const isLong = text.length > 12;

  return (
    <div className="p-4 brutalist-border bg-white brutalist-shadow-sm mb-4 flex-shrink-0 min-h-[100px] flex flex-col justify-center relative">
      <div className="absolute top-2 left-3 flex gap-1">
        <div className="w-1 h-1 bg-red-600 animate-pulse"></div>
        <div className="w-1 h-1 bg-red-600 animate-pulse delay-75"></div>
        <div className="w-1 h-1 bg-red-600 animate-pulse delay-150"></div>
      </div>
      <span className="text-[10px] font-bold uppercase block text-gray-400 mb-2 text-center tracking-widest">CIPHERED MESSAGE</span>
      <p className={`font-bold tracking-[0.1em] break-all text-center leading-tight ${isLong ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
        {displayText}
        <span className="cursor-blink border-b-2 border-black ml-1 inline-block w-3 h-1"></span>
      </p>
    </div>
  );
};
