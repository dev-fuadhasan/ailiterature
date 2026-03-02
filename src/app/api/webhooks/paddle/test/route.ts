import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to check webhook configuration
 * Access at: /api/webhooks/paddle/test
 */
export async function GET() {
  const config = {
    webhookSecretConfigured: !!process.env.PADDLE_WEBHOOK_SECRET,
    webhookSecretLength: process.env.PADDLE_WEBHOOK_SECRET?.length || 0,
    apiKeyConfigured: !!process.env.PADDLE_API_KEY,
    clientTokenConfigured: !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'not set',
    nodeEnv: process.env.NODE_ENV,
    webhookUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://www.researchroomai.com' : 'http://localhost:3000'}/api/webhooks/paddle`,
    priceIds: {
      monthly: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || 'not set',
      yearly: process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || 'not set',
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    message: 'Paddle Webhook Diagnostic',
    config,
    instructions: {
      step1: 'Go to Paddle Sandbox Dashboard: https://sandbox-vendors.paddle.com',
      step2: 'Navigate to: Developer Tools → Notifications',
      step3: `Add webhook URL: ${config.webhookUrl}`,
      step4: 'Select events: subscription.created, subscription.activated, subscription.updated, transaction.completed',
      step5: 'Copy the webhook secret and set it in Vercel environment variables as PADDLE_WEBHOOK_SECRET',
      step6: 'Make a test payment and check Vercel logs for webhook entries',
    },
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    note: 'This is a test response. Real webhooks from Paddle will be processed differently.',
  });
}
