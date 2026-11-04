import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { APP_LOGO_URL, APP_NAME } from '../../lib/constants';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  // Tile shown when no custom logo is configured.
  gradient?: string;
  icon?: ReactNode;
  className?: string;
}

export default function BrandLogo({
  size = 'md',
  gradient = 'from-emerald-500 to-teal-400 shadow-emerald-500/25',
  icon,
  className = '',
}: BrandLogoProps) {
  const box = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 rounded-2xl';

  if (APP_LOGO_URL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={APP_LOGO_URL} alt={`${APP_NAME} logo`} className={`${box} object-contain shrink-0 ${className}`} />
    );
  }

  return (
    <div className={`${box} bg-gradient-to-tr ${gradient} flex items-center justify-center shadow-lg shrink-0 ${className}`}>
      {icon ?? <Sparkles className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-slate-950 stroke-[2.5]`} />}
    </div>
  );
}
