'use client';

import { useEffect, useState } from 'react';
import {
  loadPaddleScript,
  openPaddleCheckout,
  getPaddlePriceIds,
  type PaddleCheckoutOptions,
} from '@/lib/paddle';

export function usePaddle() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadPaddleScript()
      .then(() => {
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  const openCheckout = (options: PaddleCheckoutOptions) => {
    if (!isLoaded) {
      console.error('Paddle is not loaded yet');
      return;
    }
    openPaddleCheckout(options);
  };

  const priceIds = getPaddlePriceIds();

  return {
    isLoaded,
    isLoading,
    error,
    openCheckout,
    priceIds,
  };
}
