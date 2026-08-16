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

export function Instagram({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={className}>
      <rect x="3" y="3" width="14" height="14" rx="4.2" />
      <circle cx="10" cy="10" r="3.4" />
      <circle cx="14.4" cy="5.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
