/**
 * Mask buyer / user name for review privacy.
 * Examples:
 * - 'Gabriel'     -> 'G***l'
 * - 'sameth'      -> 's***h'
 * - 'Sameth'      -> 'S***h'
 * - 'Korb Sameth' -> 'K***b S***h'
 * - 'John Doe'    -> 'J***n D***e'
 */
export const maskName = (name) => {
  if (!name || typeof name !== 'string') return 'U***r';
  const clean = name.trim();
  if (!clean || clean.toLowerCase() === 'anonymous' || clean === 'អតិថិជន') return 'U***r';
  
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words.map(w => maskSingleWord(w)).join(' ');
  }
  return maskSingleWord(clean);
};

const maskSingleWord = (w) => {
  if (!w) return '';
  if (w.length <= 1) return w + '***';
  if (w.length === 2) return w[0] + '***';
  return w[0] + '***' + w[w.length - 1];
};

export default maskName;
