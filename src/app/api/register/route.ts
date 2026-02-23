import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, referralCode } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !referralCode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate referral code format (must start with BHIM-)
    if (!referralCode.startsWith('BHIM-')) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Validate referral code
    const referral = await prisma.referralCode.findUnique({
      where: { code: referralCode }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    if (!referral.active) {
      return NextResponse.json(
        { error: 'Referral code is inactive' },
        { status: 400 }
      );
    }

    if (referral.currentUses >= referral.maxUses) {
      return NextResponse.json(
        { error: 'Referral code has reached maximum uses' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and increment referral usage in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'MEMBER',
          referredBy: referralCode,
        }
      });

      // Increment referral code usage
      await tx.referralCode.update({
        where: { code: referralCode },
        data: {
          currentUses: {
            increment: 1
          }
        }
      });

      return user;
    });

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          role: result.role
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}