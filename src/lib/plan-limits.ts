export const PLAN_LIMITS = {
  FREE: {
    maxLiteratureReviews: 3,
    trialDays: 30,
  },
  PREMIUM: {
    maxLiteratureReviews: Infinity,
    trialDays: 0,
  },
} as const;

export const PRICING = {
  MONTHLY: {
    amount: 19,
    currency: "USD",
    interval: "month",
  },
  YEARLY: {
    amount: 149,
    currency: "USD",
    interval: "year",
  },
} as const;

export type PlanType = "FREE" | "PREMIUM";
export type SubscriptionStatus = "ACTIVE" | "TRIALING" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
export type PlanPeriod = "MONTHLY" | "YEARLY";

export interface PlanCheckResult {
  canCreateProject: boolean;
  reason?: string;
  remainingReviews?: number;
  daysRemaining?: number;
  isTrialExpired?: boolean;
  needsUpgrade?: boolean;
}

export function checkPlanLimits(profile: {
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  literatureReviewCount: number;
  trialStartDate: Date;
  trialEndDate?: Date | null;
  subscriptionEndDate?: Date | null;
}): PlanCheckResult {
  const now = new Date();

  // Premium users with active subscription
  if (
    profile.planType === "PREMIUM" &&
    profile.subscriptionStatus === "ACTIVE"
  ) {
    // Check if subscription has ended
    if (
      profile.subscriptionEndDate &&
      now > new Date(profile.subscriptionEndDate)
    ) {
      return {
        canCreateProject: false,
        reason: "Your subscription has expired. Please renew to continue.",
        needsUpgrade: true,
      };
    }
    return { canCreateProject: true };
  }

  // Free users
  if (profile.planType === "FREE") {
    const limits = PLAN_LIMITS.FREE;

    // Check literature review count
    if (profile.literatureReviewCount >= limits.maxLiteratureReviews) {
      return {
        canCreateProject: false,
        reason: `You've reached the limit of ${limits.maxLiteratureReviews} literature reviews on the free plan.`,
        remainingReviews: 0,
        needsUpgrade: true,
      };
    }

    // Check trial period
    const trialEndDate = profile.trialEndDate || 
      new Date(profile.trialStartDate.getTime() + limits.trialDays * 24 * 60 * 60 * 1000);
    
    if (now > trialEndDate) {
      return {
        canCreateProject: false,
        reason: `Your ${limits.trialDays}-day trial has expired.`,
        isTrialExpired: true,
        needsUpgrade: true,
      };
    }

    // Calculate remaining
    const remainingReviews = limits.maxLiteratureReviews - profile.literatureReviewCount;
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
      canCreateProject: true,
      remainingReviews,
      daysRemaining,
    };
  }

  // Trialing premium users
  if (profile.subscriptionStatus === "TRIALING") {
    return {
      canCreateProject: true,
    };
  }

  // Past due or cancelled
  if (
    profile.subscriptionStatus === "PAST_DUE" ||
    profile.subscriptionStatus === "CANCELLED" ||
    profile.subscriptionStatus === "EXPIRED"
  ) {
    return {
      canCreateProject: false,
      reason: "Your subscription is inactive. Please update your payment method or upgrade.",
      needsUpgrade: true,
    };
  }

  return {
    canCreateProject: false,
    reason: "Unable to verify your plan status. Please contact support.",
  };
}

export function getPlanDisplayName(planType: PlanType): string {
  return planType === "PREMIUM" ? "Premium" : "Free";
}

export function getSubscriptionStatusDisplay(status: SubscriptionStatus): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    ACTIVE: "Active",
    TRIALING: "Trial",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    PAST_DUE: "Payment Due",
  };
  return statusMap[status] || status;
}
