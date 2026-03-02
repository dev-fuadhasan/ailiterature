/**
 * Rate limiting middleware using in-memory store
 * For production, use Redis-backed rate limiting
 */

import { NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Maximum requests allowed */
  limit: number;
  /** Time window in milliseconds */
  window: number;
  /** Custom identifier (defaults to user ID) */
  identifier?: string;
}

/**
 * Rate limit a user's requests
 * Returns null if allowed, or NextResponse with 429 if rate limited
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, window: 60000 }
): NextResponse | null {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  
  if (!store[key] || store[key].resetTime < now) {
    // First request or window expired
    store[key] = {
      count: 1,
      resetTime: now + options.window,
    };
    return null;
  }

  store[key].count++;
  
  if (store[key].count > options.limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    return NextResponse.json(
      { 
        error: "Too many requests. Please try again later.",
        retryAfter 
      },
      { 
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(store[key].resetTime),
        }
      }
    );
  }

  return null;
}
