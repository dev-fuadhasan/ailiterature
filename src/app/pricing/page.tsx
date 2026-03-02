"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PricingPlans } from "@/components/pricing-plans";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";

type UserProfile = {
  planType: "FREE" | "PREMIUM";
};

export default function PricingPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function handleSelectPlan(plan: "MONTHLY" | "YEARLY") {
    // TODO: Integrate with Paddle payment
    alert(`Paddle payment integration will be added here for ${plan} plan`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="Research Room AI Logo" 
              width={120} 
              height={120}
              className="object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a free trial, then upgrade to Premium for unlimited literature reviews
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <PricingPlans
            currentPlan={profile?.planType}
            onSelectPlan={handleSelectPlan}
            showCurrentBadge={true}
          />
        )}

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="What happens after my free trial?"
              answer="After 30 days or 3 literature reviews (whichever comes first), you'll need to upgrade to Premium to continue creating new reviews. Your existing reviews remain accessible."
            />
            <FAQItem
              question="Can I cancel my Premium subscription anytime?"
              answer="Yes! You can cancel anytime from your dashboard. You'll retain Premium access until the end of your billing period, and then your account will revert to Free."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, PayPal, and other payment methods through Paddle, our secure payment processor."
            />
            <FAQItem
              question="Is there a refund policy?"
              answer="Yes! We offer a 7-day money-back guarantee for first-time Premium subscribers. See our Refund Policy for details."
            />
            <FAQItem
              question="What's the difference between Monthly and Yearly?"
              answer="Both plans include unlimited literature reviews and all Premium features. The Yearly plan saves you $79/year ($149/year vs $19/month = $228/year)."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-24 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>
            Questions? Contact us at{" "}
            <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">
              support@researchroomai.com
            </a>
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/refund" className="hover:text-gray-900">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}
