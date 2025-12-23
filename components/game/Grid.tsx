
import React from 'react';

interface Props {
  guesses: string[];
  currentGuess: string;
  answerLength: number;
  answer: string;
}

export const Grid: React.FC<Props> = ({ guesses, currentGuess, answerLength, answer }) => {
  const rows = Array.from({ length: 6 });

  const getFeedback = (guess: string, index: number) => {
    const char = guess[index];
    if (answer[index] === char) return 'bg-[#00CC66] text-white border-[#00CC66]';
    if (answer.includes(char)) return 'bg-[#FFCC00] text-black border-[#FFCC00]';
    return 'bg-[#111111] text-white border-[#111111]';
  };

  return (
    <div className="flex flex-col gap-2 mx-auto w-full items-center">
      {rows.map((_, i) => {
        const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
        const isSubmitted = i < guesses.length;

        return (
          <div key={i} className="flex gap-1.5 sm:gap-2 justify-center w-full">
            {Array.from({ length: answerLength }).map((_, j) => {
              const char = guess[j] || '';
              const feedbackClass = isSubmitted ? getFeedback(guess, j) : 'bg-white text-black border-black';
              
              return (
                <div
                  key={j}
                  className={`
                    w-[12vw] h-[12vw] max-w-[50px] max-h-[50px] sm:w-12 sm:h-12
                    flex items-center justify-center 
                    text-lg sm:text-xl font-bold brutalist-border brutalist-shadow-sm
                    transition-all duration-500 transform
                    ${isSubmitted ? 'scale-100' : 'scale-95'}
                    ${char ? 'border-black' : 'border-gray-300'}
                    ${feedbackClass}
                  `}
                >
                  {char}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
