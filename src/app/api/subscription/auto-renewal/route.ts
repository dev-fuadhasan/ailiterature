import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, autoRenewal } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (typeof autoRenewal !== 'boolean') {
      return NextResponse.json({ error: 'autoRenewal must be a boolean' }, { status: 400 });
    }

    // Update the auto_renewal setting in the database
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { autoRenewal } as any,
    });

    return NextResponse.json({
      success: true,
      autoRenewal: (updatedProfile as any).autoRenewal,
      message: `Auto-renewal ${autoRenewal ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Error updating auto-renewal:', error);
    return NextResponse.json(
      { error: 'Failed to update auto-renewal setting' },
      { status: 500 }
    );
  }
}
