import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, subscriptionId } = await request.json();

    // Verify user owns this subscription
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if within 7 days
    const subscriptionStart = (profile as any).subscriptionStartDate;
    if (!subscriptionStart) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const daysSinceStart = Math.floor(
      (Date.now() - new Date(subscriptionStart).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceStart > 7) {
      return NextResponse.json(
        { error: 'Cancellation period has expired (7 days)' },
        { status: 400 }
      );
    }

    // Cancel subscription with Paddle
    const paddleApiKey = process.env.PADDLE_API_KEY;
    if (paddleApiKey && subscriptionId) {
      try {
        const paddleResponse = await fetch(
          `https://sandbox-api.paddle.com/subscriptions/${subscriptionId}/cancel`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${paddleApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              effective_from: 'immediately',
            }),
          }
        );

        if (!paddleResponse.ok) {
          console.error('Paddle cancellation failed:', await paddleResponse.text());
        } else {
          console.log('Paddle subscription cancelled successfully');
        }
      } catch (paddleError) {
        console.error('Error calling Paddle API:', paddleError);
        // Continue with local cancellation even if Paddle fails
      }
    }

    // Update profile to FREE
    await prisma.profile.update({
      where: { userId },
      data: {
        planType: 'FREE',
        planPeriod: null,
        subscriptionStatus: 'CANCELLED',
        subscriptionEndDate: new Date(),
      } as any,
    });

    console.log(`Subscription cancelled for user ${userId} within 7-day window`);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
