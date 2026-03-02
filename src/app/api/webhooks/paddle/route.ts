import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// Paddle webhook event types
type PaddleEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
    custom_data?: {
      user_id?: string;
    };
    items?: Array<{
      price: {
        id: string;
        billing_cycle?: {
          interval: string;
        };
      };
    }>;
    scheduled_change?: {
      action: string;
      effective_at: string;
    };
  };
};

// Verify Paddle webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  try {
    // Extract timestamp and signatures from Paddle signature format
    const parts = signature.split(';');
    const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
    const h1 = parts.find((p) => p.startsWith('h1='))?.split('=')[1];

    if (!ts || !h1) return false;

    // Create the signed payload
    const signedPayload = `${ts}:${payload}`;

    // Compute HMAC
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(hmac)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Map Paddle subscription status to our SubscriptionStatus enum
function mapPaddleStatus(paddleStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    canceled: 'CANCELLED',
    past_due: 'PAST_DUE',
    paused: 'CANCELLED',
  };
  return statusMap[paddleStatus] || 'ACTIVE';
}

// Determine plan period from price ID
function getPlanPeriod(priceId: string): 'MONTHLY' | 'YEARLY' {
  const monthlyPriceId = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;

  if (priceId === yearlyPriceId) return 'YEARLY';
  return 'MONTHLY';
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('PADDLE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('paddle-signature');

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event: PaddleEvent = JSON.parse(payload);
    console.log('Received Paddle webhook:', event.event_type, event.event_id);

    // Extract user ID from custom data
    const userId = event.data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in custom_data');
      return NextResponse.json(
        { error: 'Missing user_id in custom_data' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.created':
      case 'subscription.activated': {
        // Get price ID to determine period
        const priceId = event.data.items?.[0]?.price?.id;
        if (!priceId) {
          console.error('No price ID found in subscription');
          return NextResponse.json(
            { error: 'Missing price ID' },
            { status: 400 }
          );
        }

        const planPeriod = getPlanPeriod(priceId);
        const status = mapPaddleStatus(event.data.status);

        // Update user profile
        await prisma.profile.update({
          where: { userId },
          data: {
            planType: 'PREMIUM',
            planPeriod,
            subscriptionStatus: status,
            subscriptionId: event.data.id,
            paddleCustomerId: event.data.customer_id,
            subscriptionStartDate: new Date(event.occurred_at),
            // Keep trial dates if they exist
          } as any,
        });

        console.log(
          `Subscription ${event.event_type} for user ${userId}: ${event.data.id}`
        );
        break;
      }

      case 'subscription.updated': {
        const status = mapPaddleStatus(event.data.status);

        // Check if there's a scheduled cancellation
        const updateData = {
          subscriptionStatus: status,
        } as any;

        if (event.data.scheduled_change?.action === 'cancel') {
          updateData.subscriptionEndDate = new Date(
            event.data.scheduled_change.effective_at
          );
        }

        await prisma.profile.update({
          where: { userId },
          data: updateData as any,
        });

        console.log(`Subscription updated for user ${userId}`);
        break;
      }

      case 'subscription.canceled': {
        await prisma.profile.update({
          where: { userId },
          data: {
            subscriptionStatus: 'CANCELLED',
            subscriptionEndDate: new Date(event.occurred_at),
          } as any,
        });

        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      case 'subscription.past_due': {
        await prisma.profile.update({
          where: { userId },
          data: {
            subscriptionStatus: 'PAST_DUE',
          } as any,
        });

        console.log(`Subscription past due for user ${userId}`);
        break;
      }

      case 'subscription.paused': {
        await prisma.profile.update({
          where: { userId },
          data: {
            subscriptionStatus: 'CANCELLED',
          } as any,
        });

        console.log(`Subscription paused for user ${userId}`);
        break;
      }

      case 'transaction.completed': {
        // This is fired for successful recurring payments
        // Ensure subscription is active
        await prisma.profile.updateMany({
          where: {
            userId,
            subscriptionId: event.data.id,
          } as any,
          data: {
            subscriptionStatus: 'ACTIVE',
          } as any,
        });

        console.log(`Transaction completed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
