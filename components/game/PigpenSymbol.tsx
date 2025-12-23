
import React from 'react';

// Simplified representation of Pigpen using SVG
export const PigpenSymbol: React.FC<{ char: string }> = ({ char }) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const index = alphabet.indexOf(char.toUpperCase());
  if (index === -1) return <span>{char}</span>;

  // Render a simple unique-ish SVG for each letter to represent the "feeling" of Pigpen
  // A real pigpen has a specific grid/cross structure, but we'll simulate the look
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 border border-black p-1 bg-white inline-block">
      <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="2" />
      {index % 4 === 0 && <line x1="20" y1="5" x2="20" y2="35" stroke="black" strokeWidth="2" />}
      {index % 4 === 1 && <line x1="5" y1="20" x2="35" y2="20" stroke="black" strokeWidth="2" />}
      {index % 4 === 2 && <circle cx="20" cy="20" r="5" fill="black" />}
      {index % 4 === 3 && <line x1="5" y1="5" x2="35" y2="35" stroke="black" strokeWidth="2" />}
      {index > 13 && <rect x="15" y="15" width="10" height="10" fill="red" />}
    </svg>
  );
};
