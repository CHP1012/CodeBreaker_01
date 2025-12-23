
import { CipherType } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const encrypt = (text: string, type: CipherType, rng: () => number): { ciphertext: string; key?: any } => {
  const upperText = text.toUpperCase();
  
  switch (type) {
    case CipherType.CAESAR: {
      const shift = Math.floor(rng() * 25) + 1;
      const result = upperText.split('').map(char => {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) return char;
        return ALPHABET[(idx + shift) % 26];
      }).join('');
      return { ciphertext: result, key: shift };
    }

    case CipherType.ATBASH: {
      const result = upperText.split('').map(char => {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) return char;
        return ALPHABET[25 - idx];
      }).join('');
      return { ciphertext: result };
    }

    case CipherType.A1Z26: {
      const result = upperText.split('').map(char => {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) return char;
        return (idx + 1).toString().padStart(2, '0');
      }).join('-');
      return { ciphertext: result };
    }

    case CipherType.KEYWORD: {
      const keywords = ['ZEBRA', 'JAZZ', 'GHOST', 'SILVER', 'VORTEX'];
      const keyword = keywords[Math.floor(rng() * keywords.length)];
      const uniqueKeywordChars = Array.from(new Set(keyword + ALPHABET));
      const result = upperText.split('').map(char => {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) return char;
        return uniqueKeywordChars[idx];
      }).join('');
      return { ciphertext: result, key: keyword };
    }

    case CipherType.RAIL_FENCE: {
      const rails = 2;
      const fence: string[][] = Array.from({ length: rails }, () => []);
      let rail = 0;
      let direction = 1;
      for (const char of upperText) {
        fence[rail].push(char);
        rail += direction;
        if (rail === 0 || rail === rails - 1) direction *= -1;
      }
      return { ciphertext: fence.flat().join('') };
    }

    case CipherType.VIGENERE: {
      const keys = ['ORBIT', 'PULSE', 'CODE', 'BEEP'];
      const key = keys[Math.floor(rng() * keys.length)];
      const result = upperText.split('').map((char, i) => {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) return char;
        const shift = ALPHABET.indexOf(key[i % key.length]);
        return ALPHABET[(idx + shift) % 26];
      }).join('');
      return { ciphertext: result, key };
    }

    case CipherType.PIGPEN: {
      // For the sake of this implementation, we use "Symbols" as placeholders or actual PIGPEN logic.
      // We will map them to a special visual rendering in the component.
      return { ciphertext: upperText };
    }

    default:
      return { ciphertext: upperText };
  }
};
