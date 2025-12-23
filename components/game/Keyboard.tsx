
import React from 'react';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
];

interface Props {
  onKey: (key: string) => void;
  guesses: string[];
  answer: string;
  disabledKeys: string[];
  correctKeys: string[];
  presentKeys: string[];
}

export const Keyboard: React.FC<Props> = ({ onKey, guesses, answer }) => {
  // Derive key states from guesses
  const correctKeys = new Set<string>();
  const presentKeys = new Set<string>();
  const absentKeys = new Set<string>();

  guesses.forEach(guess => {
    guess.split('').forEach((char, i) => {
      if (answer[i] === char) {
        correctKeys.add(char);
      } else if (answer.includes(char)) {
        if (!correctKeys.has(char)) presentKeys.add(char);
      } else {
        absentKeys.add(char);
      }
    });
  });

  return (
    <div className="flex flex-col gap-1.5 w-full mt-auto pb-4 flex-shrink-0">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 w-full">
          {row.map(key => {
            let bgColor = "bg-[#E5E5E5]";
            let textColor = "text-[#111111]";
            let borderColor = "border-[#111111]";
            
            if (correctKeys.has(key)) {
              bgColor = "bg-[#00CC66]";
              textColor = "text-white";
              borderColor = "border-[#00CC66]";
            } else if (presentKeys.has(key)) {
              bgColor = "bg-[#FFCC00]";
              textColor = "text-black";
              borderColor = "border-[#FFCC00]";
            } else if (absentKeys.has(key)) {
              bgColor = "bg-[#111111]";
              textColor = "text-white opacity-40";
              borderColor = "border-[#111111]";
            }

            const isAction = key === 'ENTER' || key === 'DEL';

            return (
              <button
                key={key}
                onClick={() => onKey(key === 'ENTER' ? 'ENTER' : key === 'DEL' ? 'BACK' : key)}
                className={`
                  ${isAction ? 'px-2 sm:px-4 text-[9px] sm:text-xs min-w-[50px] sm:min-w-[70px]' : 'flex-1'}
                  ${bgColor} ${textColor}
                  h-11 sm:h-14 border-2 ${borderColor} brutalist-shadow-sm
                  font-bold flex items-center justify-center
                  transition-all active:translate-y-0.5 active:shadow-none
                  hover:brightness-95 touch-manipulation select-none
                `}
              >
                {key === 'ENTER' ? 'ENTER' : key === 'DEL' ? 'DEL' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
