/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTextSize?: string;
}

export default function ProductImage({ src, alt, className, fallbackTextSize = "text-4xl" }: ProductImageProps) {
  const [isError, setIsError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || isError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-[#1f2937] text-[#f3f4f6]',
          className
        )}
      >
        <span className={cn("font-serif tracking-widest uppercase text-[#D4AF37]", fallbackTextSize)}>
          {getInitials(alt)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      onError={() => setIsError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
