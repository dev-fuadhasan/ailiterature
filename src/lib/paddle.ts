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

  console.log('[Paddle] Initializing...', {
    hasClientToken: !!clientToken,
    environment,
    hasPaddleObject: !!window.Paddle,
  });

  if (!clientToken) {
    console.error('[Paddle] Client token not configured');
    alert('Payment system configuration error. Please contact support.');
    return false;
  }

  if (!window.Paddle) {
    console.error('[Paddle] Paddle object not found on window');
    return false;
  }

  try {
    // Set environment (sandbox or production)
    if (window.Paddle.Environment) {
      window.Paddle.Environment.set(environment || 'sandbox');
      console.log('[Paddle] Environment set to:', environment || 'sandbox');
    }

    // Initialize Paddle
    if (window.Paddle.Initialize) {
      window.Paddle.Initialize({
        token: clientToken,
        eventCallback: (data) => {
          console.log('[Paddle] Event received:', data);
          if (data.name === 'checkout.completed') {
            console.log('[Paddle] Checkout completed successfully');
          } else if (data.name === 'checkout.closed') {
            console.log('[Paddle] Checkout was closed');
          }
        },
      });
      console.log('[Paddle] Initialized successfully');
      return true;
    } else {
      console.error('[Paddle] Initialize method not available');
      return false;
    }
  } catch (error) {
    console.error('[Paddle] Initialization error:', error);
    return false;
  }
}

/**
 * Open Paddle checkout
 */
export function openPaddleCheckout(options: PaddleCheckoutOptions) {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = options;

  console.log('[Paddle] Opening checkout with options:', {
    priceId,
    userId,
    userEmail,
    hasPaddle: !!window.Paddle,
    hasCheckout: !!(window.Paddle?.Checkout),
  });

  if (!window.Paddle) {
    console.error('[Paddle] Paddle object not available');
    alert('Payment system not loaded. Please refresh the page and try again.');
    return;
  }

  if (!window.Paddle.Checkout) {
    console.error('[Paddle] Paddle.Checkout not available');
    alert('Payment checkout not available. Please refresh the page and try again.');
    return;
  }

  if (!priceId) {
    console.error('[Paddle] No price ID provided');
    alert('Payment configuration error. Please contact support.');
    return;
  }

  // Default URLs
  const defaultSuccessUrl = `${window.location.origin}/dashboard?payment=success`;
  const defaultCancelUrl = `${window.location.origin}/pricing?payment=cancelled`;

  const checkoutConfig = {
    items: [{ priceId, quantity: 1 }],
    customData: {
      user_id: userId,
    },
    customer: userEmail ? { email: userEmail } : undefined,
    successUrl: successUrl || defaultSuccessUrl,
  };

  console.log('[Paddle] Checkout config:', checkoutConfig);

  try {
    // Open checkout
    window.Paddle.Checkout.open(checkoutConfig);
    console.log('[Paddle] Checkout opened successfully');
  } catch (error) {
    console.error('[Paddle] Error opening checkout:', error);
    alert('Failed to open payment checkout. Please try again or contact support.');
  }
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
      console.log('[Paddle] Script loaded successfully');
      // Wait a bit for Paddle to be available
      setTimeout(() => {
        if (window.Paddle) {
          const initialized = initializePaddle();
          if (initialized) {
            resolve();
          } else {
            reject(new Error('Failed to initialize Paddle'));
          }
        } else {
          reject(new Error('Paddle object not found after script load'));
        }
      }, 100);
    };
    script.onerror = (error) => {
      console.error('[Paddle] Script load error:', error);
      reject(new Error('Failed to load Paddle script'));
    };
    console.log('[Paddle] Adding script to document:', script.src);
    document.head.appendChild(script);
  });
}

/**
 * Get price IDs from environment
 */
export function getPaddlePriceIds() {
  const monthly = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '';
  const yearly = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || '';
  
  console.log('[Paddle] Price IDs from environment:', {
    monthly,
    yearly,
    allEnvVars: {
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ? '✓' : '✗',
      sellerId: process.env.NEXT_PUBLIC_PADDLE_SELLER_ID || 'not set',
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'not set',
    }
  });
  
  return {
    monthly,
    yearly,
  };
}
