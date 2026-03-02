// Paddle.js TypeScript definitions
declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (environment: 'sandbox' | 'production') => void;
      };
      Initialize: (config: {
        token: string;
        eventCallback?: (data: any) => void;
      }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, any>;
          customer?: { email?: string };
          successUrl?: string;
          closeUrl?: string;
        }) => void;
      };
      Setup: (config: { vendor: number }) => void;
    };
  }
}

export type PaddleCheckoutOptions = {
  priceId: string;
  userId: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
};

/**
 * Initialize Paddle.js
 * Call this in your app before using Paddle checkout
 */
export function initializePaddle() {
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as
    | 'sandbox'
    | 'production';

  if (!clientToken) {
    console.error('Paddle client token not configured');
    return;
  }

  // Set environment (sandbox or production)
  if (window.Paddle?.Environment) {
    window.Paddle.Environment.set(environment || 'sandbox');
  }

  // Initialize Paddle
  if (window.Paddle?.Initialize) {
    window.Paddle.Initialize({
      token: clientToken,
      eventCallback: (data) => {
        console.log('Paddle event:', data);
      },
    });
  }
}

/**
 * Open Paddle checkout
 */
export function openPaddleCheckout(options: PaddleCheckoutOptions) {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = options;

  if (!window.Paddle) {
    console.error('Paddle is not initialized');
    return;
  }

  // Default URLs
  const defaultSuccessUrl = `${window.location.origin}/dashboard?payment=success`;
  const defaultCancelUrl = `${window.location.origin}/pricing?payment=cancelled`;

  // Open checkout
  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customData: {
      user_id: userId, // This will be sent to webhook
    },
    customer: userEmail ? { email: userEmail } : undefined,
    successUrl: successUrl || defaultSuccessUrl,
    closeUrl: cancelUrl || defaultCancelUrl,
  });
}

/**
 * Load Paddle.js script
 * Call this in your component to ensure Paddle is loaded
 */
export function loadPaddleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Paddle) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    if (document.querySelector('script[src*="paddle.js"]')) {
      // Wait for it to load
      const checkPaddle = setInterval(() => {
        if (window.Paddle) {
          clearInterval(checkPaddle);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkPaddle);
        reject(new Error('Paddle script load timeout'));
      }, 10000);
      return;
    }

    // Load script
    const script = document.createElement('script');
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;
    
    // Use sandbox or production CDN
    if (environment === 'sandbox') {
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    } else {
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    }

    script.async = true;
    script.onload = () => {
      initializePaddle();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Paddle script'));
    document.head.appendChild(script);
  });
}

/**
 * Get price IDs from environment
 */
export function getPaddlePriceIds() {
  return {
    monthly: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || '',
  };
}
