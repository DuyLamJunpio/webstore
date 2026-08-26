type IconProps = { className?: string };

const base = "h-[18px] w-[18px]";

/** small rotated square used as the brand separator in tickers and quotes */
export function Diamond({ className = "h-2 w-2" }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" fill="currentColor" aria-hidden className={className}>
      <path d="M5 0 10 5 5 10 0 5Z" />
    </svg>
  );
}

export function Search({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" strokeLinecap="round" />
    </svg>
  );
}

export function Heart({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path
        d="M10 16.2S3.3 12.4 3.3 8a3.3 3.3 0 0 1 6.7-1 3.3 3.3 0 0 1 6.7 1c0 4.4-6.7 8.2-6.7 8.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Bag({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="M4.6 6.5h10.8l.9 9.4a1 1 0 0 1-1 1.1H4.7a1 1 0 0 1-1-1.1l.9-9.4Z" strokeLinejoin="round" />
      <path d="M7.4 8.3V5.6a2.6 2.6 0 0 1 5.2 0v2.7" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowUpRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={className}>
      <path d="M4.5 11.5 11.5 4.5" strokeLinecap="round" />
      <path d="M5.8 4.5h5.7v5.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={className}>
      <path d="M2.5 8h11" strokeLinecap="round" />
      <path d="M9.5 4 13.5 8l-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeft({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={className}>
      <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={className}>
      <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Menu({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
    </svg>
  );
}

export function Close({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}

export function Ship({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <path d="M1.8 6.6h11.4v10H1.8z" strokeLinejoin="round" />
      <path d="M13.2 9.6h4.3l3.4 3.4v3.6h-7.7z" strokeLinejoin="round" />
      <circle cx="6.4" cy="18" r="1.9" />
      <circle cx="16.6" cy="18" r="1.9" />
    </svg>
  );
}

export function Leaf({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <path d="M20 4c0 9-5 13-11 13H5c0-8 5-12 11-12h4Z" strokeLinejoin="round" />
      <path d="M15 8 4 20" strokeLinecap="round" />
    </svg>
  );
}

export function Return({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" strokeLinecap="round" />
      <path d="M20 3.5V8h-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shield({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6L12 3Z" strokeLinejoin="round" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const promiseIcons = {
  ship: Ship,
  leaf: Leaf,
  return: Return,
  shield: Shield,
};

export function Phone({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path
        d="M7.1 3.5 8.5 6.6 7 8.1a9.4 9.4 0 0 0 4.9 4.9l1.5-1.5 3.1 1.4v2.6a1.4 1.4 0 0 1-1.5 1.4A13.5 13.5 0 0 1 3.1 5a1.4 1.4 0 0 1 1.4-1.5h2.6Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** dấu "f" của Facebook — là nhãn thương hiệu nên để nét đặc, không viền */
export function Facebook({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M20 10a10 10 0 1 0-11.6 9.9v-7H5.9V10h2.5V7.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V10h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 20 10Z" />
    </svg>
  );
}

export function HomeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="m3 8.5 7-5.5 7 5.5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8Z" strokeLinejoin="round" />
      <path d="M7.5 17.5v-6h5v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Store({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="M3 4.5h14l-1 5.5H4L3 4.5Z" strokeLinejoin="round" />
      <path d="M4.5 10v6.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V10" strokeLinejoin="round" />
      <path d="M8 17.5v-4h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Filter({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="M3 4.5h14M5.5 10h9M8 15.5h4" strokeLinecap="round" />
    </svg>
  );
}

export function Plus({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={className}>
      <path d="M10 4.5v11M4.5 10h11" strokeLinecap="round" />
    </svg>
  );
}

export function Check({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className={className}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sparkles({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="m10 2.5 1.8 4.7 4.7 1.8-4.7 1.8L10 15.5l-1.8-4.7-4.7-1.8 4.7-1.8L10 2.5Z" strokeLinejoin="round" />
      <path d="m15.5 13.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" strokeLinejoin="round" />
    </svg>
  );
}

export function Instagram({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <rect x="3" y="3" width="14" height="14" rx="4.2" />
      <circle cx="10" cy="10" r="3.4" />
      <circle cx="14.4" cy="5.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Messenger({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 2C5.58 2 2 5.34 2 9.47c0 2.35 1.18 4.45 3.03 5.81v2.85l2.74-1.51c.71.2 1.46.3 2.23.3 4.42 0 8-3.34 8-7.47S14.42 2 10 2Zm1.08 10.05-2.22-2.37-4.33 2.37 4.77-5.06 2.27 2.37 4.28-2.37-4.77 5.06Z" />
    </svg>
  );
}

export function Mail({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <rect x="2.5" y="4" width="15" height="12" rx="2" strokeLinejoin="round" />
      <path d="m3 5.5 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Clock({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <circle cx="10" cy="10" r="7.5" strokeLinejoin="round" />
      <path d="M10 6v4.5l3 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MapPin({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className={className}>
      <path d="M10 18s6-5.5 6-10a6 6 0 1 0-12 0c0 4.5 6 10 6 10Z" strokeLinejoin="round" />
      <circle cx="10" cy="8" r="2.5" />
    </svg>
  );
}



