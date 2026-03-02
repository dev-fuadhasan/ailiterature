"use client";

import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingPlansProps {
  currentPlan?: "FREE" | "PREMIUM";
  onSelectPlan?: (plan: "MONTHLY" | "YEARLY") => void;
  showCurrentBadge?: boolean;
}

export function PricingPlans({ currentPlan, onSelectPlan, showCurrentBadge = true }: PricingPlansProps) {
  const features = {
    free: [
      "3 literature reviews",
      "30-day trial period",
      "AI-powered paper analysis",
      "Export to CSV",
    ],
    premium: [
      "Unlimited literature reviews",
      "No time limits",
      "AI-powered paper analysis",
      "Export to CSV",
      "Priority support",
      "Advanced filters",
    ],
  };

  const handlePlanClick = (plan: "MONTHLY" | "YEARLY") => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
      {/* Free Plan */}
      <Card className="p-8 relative border-2 flex flex-col">
        {showCurrentBadge && currentPlan === "FREE" && (
          <Badge className="absolute top-4 right-4 bg-blue-600">Current Plan</Badge>
        )}
        <h3 className="text-2xl font-bold mb-2">Free</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold">$0</span>
          <span className="text-gray-500">/forever</span>
        </div>
        <p className="text-gray-600 mb-6">Perfect for testing the platform</p>
        <ul className="space-y-3 mb-6 flex-grow">
          {features.free.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        {onSelectPlan ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={currentPlan === "FREE"}
          >
            {currentPlan === "FREE" ? "Current Plan" : "Get Started"}
          </Button>
        ) : (
          <Link href="/login" className="w-full block">
            <Button
              variant="outline"
              className="w-full"
            >
              Get Started
            </Button>
          </Link>
        )}
      </Card>

      {/* Premium Monthly */}
      <Card className="p-8 relative border-2 border-blue-600 shadow-lg flex flex-col">
        {showCurrentBadge && currentPlan === "PREMIUM" && (
          <Badge className="absolute top-4 right-4 bg-blue-600">Current Plan</Badge>
        )}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4 py-1">
            <Zap className="w-3 h-3 mr-1 inline" />
            Most Popular
          </Badge>
        </div>
        <h3 className="text-2xl font-bold mb-2">Premium Monthly</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold">$19</span>
          <span className="text-gray-500">/month</span>
        </div>
        <p className="text-gray-600 mb-6">For active researchers</p>
        <ul className="space-y-3 mb-6 flex-grow">
          {features.premium.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        {onSelectPlan ? (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={currentPlan === "PREMIUM"}
            onClick={() => handlePlanClick("MONTHLY")}
          >
            {currentPlan === "PREMIUM" ? "Current Plan" : "Upgrade to Premium"}
          </Button>
        ) : (
          <Link href="/login" className="w-full block">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Upgrade to Premium
            </Button>
          </Link>
        )}
      </Card>

      {/* Premium Yearly */}
      <Card className="p-8 relative border-2 border-purple-600 flex flex-col">
        {showCurrentBadge && currentPlan === "PREMIUM" && (
          <Badge className="absolute top-4 right-4 bg-blue-600">Current Plan</Badge>
        )}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-600 text-white px-4 py-1">
            Save $79/year
          </Badge>
        </div>
        <h3 className="text-2xl font-bold mb-2">Premium Yearly</h3>
        <div className="mb-2">
          <span className="text-4xl font-bold">$149</span>
          <span className="text-gray-500">/year</span>
        </div>
        <p className="text-sm text-purple-600 font-semibold mb-4">
          Just $12.42/month
        </p>
        <p className="text-gray-600 mb-6">Best value for committed users</p>
        <ul className="space-y-3 mb-6 flex-grow">
          {features.premium.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        {onSelectPlan ? (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={currentPlan === "PREMIUM"}
            onClick={() => handlePlanClick("YEARLY")}
          >
            {currentPlan === "PREMIUM" ? "Current Plan" : "Upgrade to Premium"}
          </Button>
        ) : (
          <Link href="/login" className="w-full block">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Upgrade to Premium
            </Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
