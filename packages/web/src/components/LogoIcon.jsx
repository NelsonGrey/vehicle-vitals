import React from 'react';

export default function LogoIcon({ size = 20, color = 'currentColor', accent = '#334155' }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer dial */}
      <circle cx="32" cy="32" r="27" stroke={color} strokeWidth="2.5" />
      {/* Top arc highlight */}
      <path d="M14 30 a18 18 0 0 1 36 0" stroke={color} strokeOpacity="0.6" strokeWidth="2" fill="none" />
      {/* Needle pivot */}
      <circle cx="32" cy="32" r="2.2" fill={color} />
      {/* Needle */}
      <path d="M32 32 L48 20" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      {/* Subtle inner ring */}
      <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="1" opacity="0.2" />
    </svg>
  );
}
