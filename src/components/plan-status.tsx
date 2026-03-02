"use client";

import Link from "next/link";
import { AlertCircle, Crown, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PlanStatusProps {
  planType: "FREE" | "PREMIUM";
  subscriptionStatus: "ACTIVE" | "TRIALING" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
  literatureReviewCount: number;
  trialStartDate: string;
  trialEndDate?: string | null;
  subscriptionEndDate?: string | null;
  planPeriod?: "MONTHLY" | "YEARLY" | null;
}

export function PlanStatus({
  planType,
  subscriptionStatus,
  literatureReviewCount,
  trialStartDate,
  trialEndDate,
  subscriptionEndDate,
  planPeriod,
}: PlanStatusProps) {
  const now = new Date();
  const FREE_PLAN_LIMIT = 3;
  const FREE_TRIAL_DAYS = 30;

  // Calculate trial end date if not set
  const calculatedTrialEnd = trialEndDate 
    ? new Date(trialEndDate)
    : new Date(new Date(trialStartDate).getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const daysRemaining = Math.max(
    0,
    Math.ceil((calculatedTrialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  );

  const isTrialExpired = daysRemaining === 0 && planType === "FREE";
  const reviewsRemaining = Math.max(0, FREE_PLAN_LIMIT - literatureReviewCount);
  const progressPercentage = (literatureReviewCount / FREE_PLAN_LIMIT) * 100;

  // Premium active user
  if (planType === "PREMIUM" && subscriptionStatus === "ACTIVE") {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">Premium Plan</h3>
                <Badge className="bg-blue-600">
                  {planPeriod === "YEARLY" ? "Yearly" : "Monthly"}
                </Badge>
              </div>
              <p className="text-gray-700">
                Unlimited literature reviews • Priority support
              </p>
              {subscriptionEndDate && (
                <p className="text-sm text-gray-600 mt-2">
                  Renews on {new Date(subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              Manage Plan
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Free user with active trial
  if (planType === "FREE" && !isTrialExpired && reviewsRemaining > 0) {
    return (
      <Card className="p-6 border-2 border-orange-200 bg-orange-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">Free Trial</h3>
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                </Badge>
              </div>
              <p className="text-gray-700">
                {reviewsRemaining} of {FREE_PLAN_LIMIT} literature reviews remaining
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Upgrade Now
            </Button>
          </Link>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Usage</span>
            <span>{literatureReviewCount} / {FREE_PLAN_LIMIT}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </Card>
    );
  }

  // Trial expired or reviews exhausted
  return (
    <Card className="p-6 border-2 border-red-200 bg-red-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500 rounded-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {isTrialExpired ? "Trial Expired" : "Review Limit Reached"}
            </h3>
            <p className="text-gray-700 mb-2">
              {isTrialExpired
                ? `Your ${FREE_TRIAL_DAYS}-day trial has ended.`
                : `You've used all ${FREE_PLAN_LIMIT} free literature reviews.`}
            </p>
            <p className="text-sm text-gray-600">
              Upgrade to Premium for unlimited literature reviews and advanced features.
            </p>
          </div>
        </div>
        <Link href="/pricing">
          <Button className="bg-red-600 hover:bg-red-700">
            Upgrade to Premium
          </Button>
        </Link>
      </div>
    </Card>
  );
}
