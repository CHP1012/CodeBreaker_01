
export enum CipherType {
  CAESAR = 'Caesar',
  ATBASH = 'Atbash',
  A1Z26 = 'A1Z26',
  KEYWORD = 'Keyword',
  PIGPEN = 'Pigpen',
  RAIL_FENCE = 'Rail Fence',
  VIGENERE = 'Vigenère'
}

export interface GameStats {
  played: number;
  won: number;
  streak: number;
  distribution: number[]; // Index 0-5 for attempts 1-6
}

export interface GameState {
  lastPlayed: string; // ISO Date YYYY-MM-DD
  status: 'PLAYING' | 'WON' | 'LOST';
  guesses: string[];
  currentGuess: string;
  hintsUsed: boolean;
  dailySeed: number;
}

export interface Puzzle {
  ciphertext: string;
  answer: string;
  type: CipherType;
  description: string;
  decryptionTips: string;
  beginnerGuide: string; // 입문자를 위한 구체적인 단계별 가이드
  key?: string | number;
}
