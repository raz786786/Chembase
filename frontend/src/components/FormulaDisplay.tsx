interface FormulaDisplayProps {
  formula: string;
  className?: string;
}

export function FormulaDisplay({ formula, className = '' }: FormulaDisplayProps) {
  if (!formula) return null;

  // Normalize ASCII arrows to Unicode arrows with spacing
  const normalized = formula
    .replace(/\s*<=>\s*/g, ' ⇌ ')
    .replace(/\s*<->\s*/g, ' ⇌ ')
    .replace(/\s*->\s*/g, ' → ')
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s*⇌\s*/g, ' ⇌ ')
    .replace(/\s+\+\s+/g, ' + ');

  // Tokenize preserving spaces, arrows, operators, parentheses, phase tags, letters, numbers
  const tokens = normalized.match(/(→|⇌|\s+|\+|-|\(|\)|[A-Za-z]+|\d+|\^[\d+-]*|.)/g) || [normalized];

  return (
    <span className={`inline-flex flex-wrap items-baseline font-medium ${className}`}>
      {tokens.map((token, index) => {
        if (token === '→' || token === '⇌') {
          return (
            <span key={index} className="mx-1.5 text-primary-500 font-bold">
              {token}
            </span>
          );
        }
        if (/^\s+$/.test(token)) {
          return <span key={index}>&nbsp;</span>;
        }
        if (/^\d+$/.test(token)) {
          // Only subscript digits that immediately follow an element letter or closing parenthesis
          const prev = index > 0 ? tokens[index - 1] : '';
          const shouldSubscript = /[A-Za-z)]$/.test(prev);
          if (shouldSubscript) {
            return (
              <sub key={index} className="text-[0.72em] leading-none relative -bottom-[0.12em]">
                {token}
              </sub>
            );
          }
          return <span key={index}>{token}</span>;
        }
        return <span key={index}>{token}</span>;
      })}
    </span>
  );
}
