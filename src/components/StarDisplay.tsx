export function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.max(0, Math.min(max, Math.round(rating)));
  const label = `${Math.round(rating * 10) / 10} out of ${max} stars`;
  return (
    <span className="star-display" role="img" aria-label={label}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className="star" data-filled={index < filled} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
