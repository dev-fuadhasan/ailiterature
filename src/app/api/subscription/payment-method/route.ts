import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the current profile to check if auto-renewal is disabled
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { autoRenewal: true, paymentMethodId: true } as any,
    }) as any;

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.autoRenewal) {
      return NextResponse.json(
        { error: 'Please disable auto-renewal before removing payment method' },
        { status: 400 }
      );
    }

    // Remove payment method details from the database
    await prisma.profile.update({
      where: { userId },
      data: {
        paymentMethodId: null,
        cardLast4: null,
        cardType: null,
        cardExpiryMonth: null,
        cardExpiryYear: null,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
