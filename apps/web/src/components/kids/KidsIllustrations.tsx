'use client';

import React from 'react';

export function PiggyBuddyIllustration({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Fondo circular soleado */}
      <circle cx="60" cy="64" r="46" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="3" />

      {/* Moneda dorada entrando */}
      <circle cx="62" cy="24" r="12" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
      <path d="M62 18V30M58 21.5C58 20 60 19 62 19C64 19 66 20 66 21.5C66 23 64 23.5 62 24C60 24.5 58 25 58 26.5C58 28 60 29 62 29C64 29 66 28 66 26.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />

      {/* Oreja derecha e izquierda */}
      <path d="M36 46C31 35 42 30 48 40" fill="#FB7185" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M84 46C89 35 78 30 72 40" fill="#FB7185" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />

      {/* Patitas */}
      <rect x="40" y="90" width="11" height="12" rx="5" fill="#F43F5E" stroke="#BE123C" strokeWidth="2.5" />
      <rect x="69" y="90" width="11" height="12" rx="5" fill="#F43F5E" stroke="#BE123C" strokeWidth="2.5" />

      {/* Cuerpo de la alcancía */}
      <ellipse cx="60" cy="68" rx="33" ry="27" fill="#FDA4AF" stroke="#BE123C" strokeWidth="3" />

      {/* Ranura de moneda */}
      <rect x="51" y="43" width="18" height="4" rx="2" fill="#881337" />

      {/* Ojos felices */}
      <circle cx="47" cy="62" r="3.5" fill="#1E1B4B" />
      <circle cx="48" cy="60.8" r="1.2" fill="#FFFFFF" />
      <circle cx="73" cy="62" r="3.5" fill="#1E1B4B" />
      <circle cx="74" cy="60.8" r="1.2" fill="#FFFFFF" />

      {/* Mejillas rosadas */}
      <ellipse cx="39" cy="69" rx="4.5" ry="2.8" fill="#FB7185" opacity="0.65" />
      <ellipse cx="81" cy="69" rx="4.5" ry="2.8" fill="#FB7185" opacity="0.65" />

      {/* Hocico sonriente */}
      <ellipse cx="60" cy="70" rx="11" ry="8" fill="#FB7185" stroke="#BE123C" strokeWidth="2.5" />
      <circle cx="56" cy="70" r="2" fill="#881337" />
      <circle cx="64" cy="70" r="2" fill="#881337" />

      {/* Estrellitas decorativas */}
      <path d="M18 36L20 41L25 43L20 45L18 50L16 45L11 43L16 41L18 36Z" fill="#38BDF8" />
      <path d="M101 44L102.8 48.2L107 50L102.8 51.8L101 56L99.2 51.8L95 50L99.2 48.2L101 44Z" fill="#34D399" />
    </svg>
  );
}

export function MissionTrophyIllustration({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="44" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="3" />
      {/* Asas del trofeo */}
      <path d="M31 32H22C19 32 18 46 29 50" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
      <path d="M69 32H78C81 32 82 46 71 50" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
      {/* Copa */}
      <path
        d="M31 26H69V46C69 57 60.5 65 50 65C39.5 65 31 57 31 46V26Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="3"
      />
      {/* Estrella central */}
      <path
        d="M50 35L53.2 41.8L60.6 42.8L55.2 48L56.5 55.3L50 51.8L43.5 55.3L44.8 48L39.4 42.8L46.8 41.8L50 35Z"
        fill="#FFFBEB"
        stroke="#B45309"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect x="46" y="65" width="8" height="10" fill="#D97706" />
      <rect x="35" y="75" width="30" height="8" rx="4" fill="#1E1B4B" />
    </svg>
  );
}
