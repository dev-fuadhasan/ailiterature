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
    subscription_id?: string;
    customer?: {
      email?: string;
      id?: string;
    };
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
    payments?: Array<{
      stored_payment_method_id?: string;
      method_details?: {
        type: string;
        card?: {
          type: string;
          last4: string;
          expiry_month: number;
          expiry_year: number;
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
  // Trim environment variables to remove any newline characters
  const monthlyPriceId = (process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || 'pri_01kjqr3ystz8321y7kkbzce6w0').trim();
  const yearlyPriceId = (process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || 'pri_01kjqr5vrbydqfbxkgwvdbrf0w').trim();

  console.log('getPlanPeriod check:', { priceId, yearlyPriceId, monthlyPriceId, match: priceId === yearlyPriceId });

  if (priceId === yearlyPriceId) return 'YEARLY';
  if (priceId === monthlyPriceId) return 'MONTHLY';
  
  // Fallback: check amount or billing cycle if price IDs don't match
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

    // Log webhook for debugging
    console.log('=== PADDLE WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Signature:', signature ? 'present' : 'missing');
    console.log('Payload length:', payload.length);
    console.log('Full payload:', payload);

    // Verify signature with detailed logging
    const signatureValid = verifyWebhookSignature(payload, signature, webhookSecret);
    console.log('Signature verification:', signatureValid ? 'VALID' : 'INVALID');
    
    // In production, log but don't block on signature failure temporarily for debugging
    if (!signatureValid) {
      console.warn('⚠️ Webhook signature verification failed, but processing anyway for debugging');
      console.warn('This should be fixed in production!');
    }

    // Parse event
    const event: PaddleEvent = JSON.parse(payload);
    console.log('Received Paddle webhook:', event.event_type, event.event_id);
    console.log('Full event data:', JSON.stringify(event, null, 2));

    // Extract user ID from custom data
    let userId = event.data.custom_data?.user_id;
    console.log('Custom data received:', JSON.stringify(event.data.custom_data));
    console.log('Extracted user_id:', userId);
    
    if (!userId) {
      console.error('❌ No user_id in custom_data');
      console.error('Full event.data:', JSON.stringify(event.data, null, 2));
      
      // Try to get user from customer email as fallback
      const customerEmail = event.data.customer?.email;
      if (customerEmail) {
        console.log('Attempting to find user by email:', customerEmail);
        try {
          const profile = await prisma.profile.findFirst({
            where: { email: customerEmail },
          });
          if (profile) {
            console.log('✅ Found profile by email, using userId:', profile.userId);
            userId = profile.userId; // Use this userId for processing
          }
        } catch (err) {
          console.error('Error finding profile by email:', err);
        }
      }
      
      // If still no userId, return error
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing user_id in custom_data and could not find by email' },
          { status: 400 }
        );
      }
    }

    console.log('Processing webhook for user:', userId);

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      console.error(`Profile not found for user: ${userId}`);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    console.log('Found profile:', existingProfile.email);

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

        // Get price ID to check for plan period changes
        const priceId = event.data.items?.[0]?.price?.id;
        const planPeriod = priceId ? getPlanPeriod(priceId) : undefined;

        // Check if there's a scheduled cancellation
        const updateData = {
          subscriptionStatus: status,
        } as any;

        // Update plan period if it changed (e.g., monthly to yearly upgrade)
        if (planPeriod) {
          updateData.planPeriod = planPeriod;
          console.log(`Plan period updated to: ${planPeriod}`);
        }

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

      case 'transaction.updated':
      case 'transaction.completed': {
        // This is fired for successful payments (initial and recurring)
        // Also handles transaction.updated when payment status changes to completed
        // Get subscription ID from event data
        const subscriptionId = event.data.subscription_id;
        
        // Get price ID to determine plan period
        const priceId = event.data.items?.[0]?.price?.id;
        const planPeriod = priceId ? getPlanPeriod(priceId) : undefined;
        
        // Extract payment method details
        const payment = event.data.payments?.[0];
        const paymentMethodId = payment?.stored_payment_method_id;
        const cardDetails = payment?.method_details?.card;
        
        console.log('Transaction details:', {
          subscriptionId,
          priceId,
          planPeriod,
          paymentMethodId,
          cardLast4: cardDetails?.last4,
        });
        
        // Build update data
        const updateData: any = {
          subscriptionStatus: 'ACTIVE',
        };
        
        // Update subscription ID if present
        if (subscriptionId) {
          updateData.subscriptionId = subscriptionId;
        }
        
        // Update plan period if it changed (e.g., monthly to yearly upgrade)
        if (planPeriod) {
          updateData.planPeriod = planPeriod;
          console.log(`Plan period updated to: ${planPeriod}`);
        }
        
        // Save payment method details
        if (paymentMethodId) {
          updateData.paymentMethodId = paymentMethodId;
        }
        if (cardDetails) {
          updateData.cardLast4 = cardDetails.last4;
          updateData.cardType = cardDetails.type;
          updateData.cardExpiryMonth = cardDetails.expiry_month;
          updateData.cardExpiryYear = cardDetails.expiry_year;
          console.log(`Saved payment method: ${cardDetails.type} ending in ${cardDetails.last4}`);
        }
        
        // Update profile
        await prisma.profile.update({
          where: { userId },
          data: updateData as any,
        });

        console.log(`Transaction processed (${event.event_type}) for user ${userId}, planPeriod: ${planPeriod || 'not changed'}`);
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
