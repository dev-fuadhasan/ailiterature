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
    console.log('[usePaddle] Starting to load Paddle...');
    loadPaddleScript()
      .then(() => {
        console.log('[usePaddle] Paddle loaded successfully');
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[usePaddle] Error loading Paddle:', err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  const openCheckout = (options: PaddleCheckoutOptions) => {
    console.log('[usePaddle] openCheckout called', { isLoaded, options });
    if (!isLoaded) {
      console.error('[usePaddle] Paddle is not loaded yet');
      alert('Payment system is still loading. Please wait a moment and try again.');
      return;
    }
    openPaddleCheckout(options);
  };

  const priceIds = getPaddlePriceIds();
  
  console.log('[usePaddle] Current state:', { isLoaded, isLoading, error, priceIds });

  return {
    isLoaded,
    isLoading,
    error,
    openCheckout,
    priceIds,
  };
}
