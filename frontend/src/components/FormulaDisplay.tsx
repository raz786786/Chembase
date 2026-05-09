

interface FormulaDisplayProps {
  formula: string;
  className?: string;
}

export function FormulaDisplay({ formula, className = '' }: FormulaDisplayProps) {
  if (!formula) return null;

  const parts = formula.match(/([A-Za-z]+|\d+|\(|\)|[\+\-])/g) || [formula];

  return (
    <span className={`inline-flex items-baseline font-medium ${className}`}>
      {parts.map((part, index) => {
        if (/^\d+$/.test(part)) {
          if (index === 0) {
              return <span key={index}>{part}</span>;
          }
          return <sub key={index} className="text-[0.7em] relative -bottom-[0.1em]">{part}</sub>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
