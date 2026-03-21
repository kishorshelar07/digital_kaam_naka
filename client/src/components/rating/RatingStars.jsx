import React, { useState } from 'react';

export const RatingStars = ({ value = 0, onChange, readonly = false, size = 24 }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className={`stars ${readonly ? 'stars-static' : ''}`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= (hovered || value) ? 'filled' : ''}`}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{ cursor: readonly ? 'default' : 'pointer', fontSize: size }}
        >★</span>
      ))}
    </div>
  );
};

export const RatingDisplay = ({ rating = 0, count = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <RatingStars value={Math.round(rating)} readonly size={16} />
    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
      {parseFloat(rating).toFixed(1)}
    </span>
    {count > 0 && (
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>({count})</span>
    )}
  </div>
);

export default RatingStars;
