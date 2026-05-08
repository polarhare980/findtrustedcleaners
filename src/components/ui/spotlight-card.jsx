'use client';

import React, { useEffect, useMemo, useRef } from 'react';

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

const glowCardStyles = `
  [data-glow-card]::before,
  [data-glow-card]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--border-size) * -1);
    border: var(--border-size) solid transparent;
    border-radius: calc(var(--radius) * 1px);
    background-attachment: fixed;
    background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    mask-composite: intersect;
    -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    -webkit-mask-clip: padding-box, border-box;
    -webkit-mask-composite: source-in;
  }

  [data-glow-card]::before {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 74) * 1%) calc(var(--lightness, 52) * 1%) / var(--border-spot-opacity, 0.72)), transparent 100%
    );
    filter: brightness(1.6);
  }

  [data-glow-card]::after {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(0 100% 100% / var(--border-light-opacity, 0.68)), transparent 100%
    );
  }

  [data-glow-card] [data-glow-card-inner] {
    position: absolute;
    inset: 0;
    will-change: filter;
    opacity: var(--outer, 1);
    border-radius: calc(var(--radius) * 1px);
    filter: blur(calc(var(--border-size) * 10));
    background: none;
    pointer-events: none;
    border: none;
  }

  [data-glow-card] > [data-glow-card-inner]::before {
    content: "";
    position: absolute;
    inset: -10px;
    border: 10px solid transparent;
    border-radius: inherit;
    background: radial-gradient(
      calc(var(--spotlight-size) * 0.8) calc(var(--spotlight-size) * 0.8) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 74) * 1%) calc(var(--lightness, 62) * 1%) / 0.24), transparent 100%
    );
  }
`;

function GlowCard({
  children = null,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false,
}) {
  const cardRef = useRef(null);
  const { base, spread } = glowColorMap[glowColor] || glowColorMap.blue;

  useEffect(() => {
    const syncPointer = (event) => {
      const { clientX: x, clientY: y } = event;

      if (!cardRef.current) return;

      cardRef.current.style.setProperty('--x', x.toFixed(2));
      cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty('--y', y.toFixed(2));
      cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    };

    document.addEventListener('pointermove', syncPointer, { passive: true });
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const inlineStyles = useMemo(() => {
    const styles = {
      '--base': base,
      '--spread': spread,
      '--radius': '42',
      '--border': '1',
      '--backdrop': 'hsl(0 0% 100% / 0.58)',
      '--backup-border': 'hsl(0 0% 100% / 0.7)',
      '--size': '220',
      '--outer': '1',
      '--saturation': '74',
      '--lightness': '58',
      '--border-size': 'calc(var(--border, 1) * 1px)',
      '--spotlight-size': 'calc(var(--size, 220) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 74) * 1%) calc(var(--lightness, 58) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: 'pan-y',
    };

    if (width !== undefined) styles.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) styles.height = typeof height === 'number' ? `${height}px` : height;

    return styles;
  }, [base, spread, width, height]);

  const sizeClasses = customSize ? '' : sizeMap[size] || sizeMap.md;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: glowCardStyles }} />
      <div
        ref={cardRef}
        data-glow-card
        style={inlineStyles}
        className={`
          ${sizeClasses}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl
          relative
          grid
          grid-rows-[1fr_auto]
          shadow-[0_1rem_2rem_-1rem_black]
          p-4
          gap-4
          backdrop-blur-[5px]
          ${className}
        `}
      >
        <div data-glow-card-inner />
        {children}
      </div>
    </>
  );
}

export { GlowCard };
export default GlowCard;
