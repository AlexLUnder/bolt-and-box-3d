import { BoltColor } from '../engine/types';
import { BOLT_COLORS } from '../economy/config';

export function GlossyHeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="heartGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff6b81" />
          <stop offset="55%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.2C11.6 21.2 11.2 21.05 10.9 20.8C6.3 17.1 2.5 13.7 2.5 9.2C2.5 5.9 5.1 3.3 8.3 3.3C10 3.3 11.3 4.1 12 5.1C12.7 4.1 14 3.3 15.7 3.3C18.9 3.3 21.5 5.9 21.5 9.2C21.5 13.7 17.7 17.1 13.1 20.8C12.8 21.05 12.4 21.2 12 21.2Z"
        fill="url(#heartGrad)"
        stroke="#991b1b"
        strokeWidth="1.2"
      />
      <ellipse cx="8" cy="7.5" rx="2.3" ry="1.3" transform="rotate(-30 8 7.5)" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

export function GoldCoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="coinOuter" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="coinInner" x1="6" y1="5" x2="18" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10.2" fill="url(#coinOuter)" stroke="#92400e" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="7.4" fill="url(#coinInner)" stroke="#fef08a" strokeWidth="0.9" opacity="0.95" />
      <path
        d="M12 7.2L13.3 10.1L16.5 10.5L14.1 12.7L14.8 15.8L12 14.2L9.2 15.8L9.9 12.7L7.5 10.5L10.7 10.1L12 7.2Z"
        fill="#fffbeb"
        opacity="0.92"
      />
    </svg>
  );
}

export function HexBoltIcon({ color, size = 26 }: { color: BoltColor; size?: number }) {
  const c = BOLT_COLORS[color];
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id={`bolt_${color}`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="52%" stopColor={c.hex} />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      {/* Chrome Washer */}
      <circle cx="14" cy="14.5" r="12.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      {/* Hex Head */}
      <polygon
        points="14,3.2 23.2,8.5 23.2,19.1 14,24.4 4.8,19.1 4.8,8.5"
        fill={`url(#bolt_${color})`}
        stroke="#ffffff"
        strokeWidth="1.1"
        strokeOpacity="0.65"
      />
      {/* Phillips Cross Slot */}
      <rect x="12.3" y="8.6" width="3.4" height="10.6" rx="1.2" fill="#0f172a" opacity="0.55" />
      <rect x="8.7" y="12.2" width="10.6" height="3.4" rx="1.2" fill="#0f172a" opacity="0.55" />
      <ellipse cx="10.5" cy="9" rx="2.4" ry="1.1" transform="rotate(-25 10.5 9)" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

export function SlotBoosterIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="slotBg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#slotBg)" stroke="#bae6fd" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="8.2" fill="#0c4a6e" opacity="0.45" stroke="#ffffff" strokeWidth="1.4" strokeDasharray="3 2.2" />
      <path d="M16 11V21M11 16H21" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function MagnetBoosterIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="magBg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#magBg)" stroke="#fecdd3" strokeWidth="1.5" />
      <path
        d="M10.5 11.5V17C10.5 20.04 12.96 22.5 16 22.5C19.04 22.5 21.5 20.04 21.5 17V11.5"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <rect x="8.7" y="9.2" width="3.6" height="3.2" rx="0.8" fill="#cbd5e1" />
      <rect x="19.7" y="9.2" width="3.6" height="3.2" rx="0.8" fill="#cbd5e1" />
      <path d="M14.5 7.5L16 10L17.5 7.5" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SweepBoosterIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="swpBg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#swpBg)" stroke="#fef08a" strokeWidth="1.5" />
      <path
        d="M16 7.5L17.9 13.1L23.5 15L17.9 16.9L16 22.5L14.1 16.9L8.5 15L14.1 13.1L16 7.5Z"
        fill="#ffffff"
      />
      <circle cx="22.5" cy="9.8" r="1.7" fill="#fef9c3" />
      <circle cx="9.8" cy="21.5" r="1.4" fill="#fef9c3" />
    </svg>
  );
}

export function AdBadgeIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2.5" width="14" height="11" rx="2.5" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1.4" />
      <polygon points="6.5,5.2 11.5,8 6.5,10.8" fill="currentColor" />
    </svg>
  );
}

export function PiggyMedallionIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <defs>
        <radialGradient id="pigBody" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="55%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>
      </defs>
      {/* Ears */}
      <ellipse cx="14" cy="12" rx="4.5" ry="6" transform="rotate(-22 14 12)" fill="#ec4899" stroke="#9d174d" strokeWidth="1.6" />
      <ellipse cx="30" cy="12" rx="4.5" ry="6" transform="rotate(22 30 12)" fill="#ec4899" stroke="#9d174d" strokeWidth="1.6" />
      {/* Body */}
      <ellipse cx="22" cy="24" rx="14.5" ry="12.5" fill="url(#pigBody)" stroke="#9d174d" strokeWidth="1.8" />
      {/* Coin slot */}
      <rect x="17.5" y="13.5" width="9" height="2.4" rx="1.2" fill="#831843" />
      {/* Snout */}
      <ellipse cx="22" cy="26.5" rx="6.2" ry="4.4" fill="#fbcfe8" stroke="#be185d" strokeWidth="1.4" />
      <circle cx="19.8" cy="26.5" r="1.2" fill="#9d174d" />
      <circle cx="24.2" cy="26.5" r="1.2" fill="#9d174d" />
      {/* Eyes */}
      <circle cx="15.5" cy="21.5" r="2" fill="#1e293b" />
      <circle cx="14.9" cy="20.9" r="0.7" fill="#ffffff" />
      <circle cx="28.5" cy="21.5" r="2" fill="#1e293b" />
      <circle cx="27.9" cy="20.9" r="0.7" fill="#ffffff" />
      {/* Gloss */}
      <ellipse cx="15" cy="17" rx="3.2" ry="1.4" transform="rotate(-25 15 17)" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

export function NoAdsMedallionIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id="shieldG" x1="22" y1="4" x2="22" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M22 4.5L36.5 9.5V21.5C36.5 30.8 30.2 37.2 22 40C13.8 37.2 7.5 30.8 7.5 21.5V9.5L22 4.5Z"
        fill="url(#shieldG)"
        stroke="#78350f"
        strokeWidth="2"
      />
      <path
        d="M22 8.2L32.8 12V21.2C32.8 28.2 28.1 33.2 22 35.6C15.9 33.2 11.2 28.2 11.2 21.2V12L22 8.2Z"
        fill="#fffbeb"
        opacity="0.28"
      />
      <text x="22" y="25.5" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="12" fill="#78350f">
        ADS
      </text>
      <line x1="12" y1="30" x2="32" y2="13" stroke="#dc2626" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export function StreakFlameIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id="flmOuter" x1="22" y1="4" x2="22" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <path
        d="M22.5 5C22.5 5 33.5 13 33.5 24.5C33.5 31.8 28.2 38 21.5 38C14.8 38 10 32.2 10 25.5C10 20.5 12.8 16.4 15.5 13.8C15.5 16.5 17.2 18.2 18.8 18.2C18.2 13.5 19.5 8.8 22.5 5Z"
        fill="url(#flmOuter)"
        stroke="#991b1b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 20C22 20 27 24.2 27 29C27 32.5 24.6 35 21.5 35C18.4 35 16 32.5 16 29.2C16 26.2 18.5 23 22 20Z"
        fill="#fef9c3"
      />
    </svg>
  );
}

export function GiftChestIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="12" width="24" height="15" rx="3.5" fill="#d97706" stroke="#78350f" strokeWidth="1.8" />
      <path d="M4 13C4 9 7.5 6 16 6C24.5 6 28 9 28 13H4Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1.8" />
      <rect x="13" y="10" width="6" height="8" rx="1.5" fill="#fef08a" stroke="#78350f" strokeWidth="1.4" />
      <circle cx="16" cy="14" r="1.4" fill="#78350f" />
    </svg>
  );
}
