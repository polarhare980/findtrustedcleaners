export default function RatingStars({ value = 0, count = 0, size = 16 }) {
  const full = Math.floor(value); const half = value - full >= 0.5; const total = 5; const stars = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="flex items-center gap-2" aria-label={`Rating ${value ? value.toFixed(1) : 0} out of 5`}>
      <div className="flex items-center">
        {stars.map(i => {
          const filled = i < full || (i === full && half);
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .587l3.668 7.429L24 9.748l-6 5.853 1.417 8.262L12 19.771l-7.417 4.092L6 15.601 0 9.748l8.332-1.732z"
                fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" />
            </svg>
          );
        })}
      </div>
      <span className="text-sm text-slate-700">{value ? value.toFixed(1) : '—'}{count ? ` (${count})` : ''}</span>
    </div>
  );
}
