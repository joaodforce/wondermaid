import Image from 'next/image';
import { enkaIconUrl } from '@/modules/calculator/data';

// Enka serves ready-sized PNGs, so they skip Next's image optimizer (and its remote host allowlist)
export function EnkaIcon({ icon, size, alt = '', className }: { icon: string; size: number; alt?: string; className?: string }) {
  return <Image src={enkaIconUrl(icon)} alt={alt} width={size} height={size} unoptimized className={className} />;
}
