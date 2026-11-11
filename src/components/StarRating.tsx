import React from 'react';
import { useLang } from '../contexts/LangContext';

const LABELS = {
  fr: { new: 'Nouveau', reviews: (n: number) => `${n} avis`, see: 'Voir le profil et les avis' },
  ar: { new: 'جديد', reviews: (n: number) => `${n} تقييم`, see: 'عرض الملف والتقييمات' },
  en: { new: 'New', reviews: (n: number) => `${n} review${n > 1 ? 's' : ''}`, see: 'See profile and reviews' },
};

interface BadgeProps {
  avg: number | null | undefined;
  count: number | undefined;
  onClick?: () => void;
  showCount?: boolean;
}

// Pastille façon Uber : « ★ 4,9 (12) », ou « Nouveau » sans avis
export function RatingBadge({ avg, count, onClick, showCount = true }: BadgeProps) {
  const { lang } = useLang();
  const l = LABELS[lang] ?? LABELS.fr;
  const has = !!avg && !!count;
  const content = has ? (
    <>
      <span className="rating-star" aria-hidden>★</span>
      <strong>{avg!.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
      {showCount && <span className="rating-count">({count})</span>}
    </>
  ) : (
    <span>✨ {l.new}</span>
  );
  const label = has ? `${avg} / 5 · ${l.reviews(count!)}` : l.new;
  if (!onClick) return <span className={'rating-badge' + (has ? '' : ' is-new')} title={label}>{content}</span>;
  return (
    <button
      type="button" className={'rating-badge is-button' + (has ? '' : ' is-new')}
      title={l.see} aria-label={`${label} — ${l.see}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {content}
    </button>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(value) ? 'on' : ''}>★</span>)}
    </span>
  );
}

interface InputProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}

export function StarInput({ value, onChange, size = 36 }: InputProps) {
  const [hovered, setHovered] = React.useState(0);
  const active = hovered || value;

  return (
    <div className="star-input" role="radiogroup" style={{ fontSize: size }} onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} / 5`}
          className={i <= active ? 'on' : ''}
          onMouseEnter={() => setHovered(i)}
          onClick={() => onChange(i)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
