import React from 'react';

interface DisplayProps {
  avg: number | null | undefined;
  count: number | undefined;
  size?: number;
}

export function StarDisplay({ avg, count, size = 14 }: DisplayProps) {
  if (!avg || !count) return null;
  const full = Math.floor(avg);
  const half = avg - full >= 0.4;

  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= full ? '#f5a623' : (i === full + 1 && half ? '#f5a623' : '#d1d5db') }}>
          {i <= full ? '★' : (i === full + 1 && half ? '½' : '☆')}
        </span>
      ))}
      <span style={{ fontSize: size - 1, color: '#6b7280', fontWeight: 500 }}>
        {avg.toFixed(1)} <span style={{ fontWeight: 400 }}>({count} avis)</span>
      </span>
    </span>
  );
}

interface InputProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarInput({ value, onChange }: InputProps) {
  const [hovered, setHovered] = React.useState(0);
  const active = hovered || value;

  return (
    <div className="d-flex gap-1" style={{ fontSize: 32, cursor: 'pointer', lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ color: i <= active ? '#f5a623' : '#d1d5db', transition: 'color .1s' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
