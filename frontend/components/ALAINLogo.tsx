import React from 'react';

interface ALAINLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'light' | 'dark';
  className?: string;
}

export default function ALAINLogo({
  size = 'md',
  variant = 'default',
  className = ''
}: ALAINLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    default: 'text-primary',
    light: 'text-white',
    dark: 'text-slate-900'
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* ALAIN Logo Mark - Notebook + Spark */}
      <div className={`${sizeClasses[size]} ${colorClasses[variant]} relative`}>
        {/* Notebook base */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Notebook pages */}
          <rect
            x="4"
            y="6"
            width="20"
            height="20"
            rx="2"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          {/* Notebook lines (3 horizontal lines) */}
          <line
            x1="8"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          <line
            x1="8"
            y1="16"
            x2="20"
            y2="16"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          <line
            x1="8"
            y1="20"
            x2="16"
            y2="20"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />

          {/* Spark accent - positioned at top-right */}
          <circle
            cx="24"
            cy="8"
            r="3"
            fill="var(--brand-spark)"
            className="animate-pulse"
          />

          {/* Spark rays */}
          <line x1="24" y1="5" x2="24" y2="3" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="24" y1="11" x2="24" y2="13" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="21" y1="8" x2="19" y2="8" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="27" y1="8" x2="29" y2="8" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="21.5" y1="5.5" x2="19.5" y2="3.5" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="26.5" y1="5.5" x2="28.5" y2="3.5" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="21.5" y1="10.5" x2="19.5" y2="12.5" stroke="var(--brand-spark)" strokeWidth="1" />
          <line x1="26.5" y1="10.5" x2="28.5" y2="12.5" stroke="var(--brand-spark)" strokeWidth="1" />
        </svg>
      </div>

      {/* Wordmark */}
      <span className={`font-semibold ${colorClasses[variant]}`}>
        ALAIN
      </span>
    </div>
  );
}

// Logo mark only (for favicons, etc.)
export function ALAINLogoMark({
  size = 'md',
  variant = 'default',
  className = ''
}: Omit<ALAINLogoProps, 'size'> & { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const colorClasses = {
    default: 'text-primary',
    light: 'text-white',
    dark: 'text-slate-900'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[variant]} ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Notebook pages */}
        <rect
          x="4"
          y="6"
          width="20"
          height="20"
          rx="2"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Notebook lines */}
        <line
          x1="8"
          y1="12"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        <line
          x1="8"
          y1="16"
          x2="20"
          y2="16"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        <line
          x1="8"
          y1="20"
          x2="16"
          y2="20"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />

        {/* Spark accent */}
        <circle
          cx="24"
          cy="8"
          r="3"
          fill="var(--brand-spark)"
        />

        {/* Spark rays */}
        <line x1="24" y1="5" x2="24" y2="3" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="24" y1="11" x2="24" y2="13" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="21" y1="8" x2="19" y2="8" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="27" y1="8" x2="29" y2="8" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="21.5" y1="5.5" x2="19.5" y2="3.5" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="26.5" y1="5.5" x2="28.5" y2="3.5" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="21.5" y1="10.5" x2="19.5" y2="12.5" stroke="var(--brand-spark)" strokeWidth="1" />
        <line x1="26.5" y1="10.5" x2="28.5" y2="12.5" stroke="var(--brand-spark)" strokeWidth="1" />
      </svg>
    </div>
  );
}
