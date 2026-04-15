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
}

export default function ProductImage({ src, alt, className }: ProductImageProps) {
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
          'flex flex-col items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
      >
        <Package className="w-1/3 h-1/3 mb-1 opacity-50" />
        <span className="text-[10px] font-bold tracking-tighter opacity-70">
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
