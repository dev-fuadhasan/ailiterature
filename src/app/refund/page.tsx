import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund Policy for Research Room AI",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-block">
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
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14-Day Money-Back Guarantee</h2>
            <p className="text-gray-700 leading-relaxed">
              We offer a <strong>14-day money-back guarantee</strong> for all new subscriptions to Research Room AI. If you are not satisfied with our service for any reason, you may request a full refund within 14 days of your initial purchase.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              This guarantee applies to first-time Premium subscribers only. The 14-day period begins from the date of your initial payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To request a refund within the 14-day guarantee period:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-3">
              <li>
                Email us at <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a> with the subject line "Refund Request"
              </li>
              <li>
                Include your registered email address and transaction ID from your Paddle receipt
              </li>
              <li>
                We will process your request and issue a full refund to your original payment method
              </li>
            </ol>
            <p className="text-gray-700 leading-relaxed mt-4">
              All refunds are processed in accordance with <a href="https://www.paddle.com/legal/refund-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Paddle's refund policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing Time</h2>
            <p className="text-gray-700 leading-relaxed">
              Once your refund request is approved:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
              <li>Refunds are processed immediately through Paddle</li>
              <li>The refund will appear in your account within 5-10 business days, depending on your payment provider</li>
              <li>You will receive a confirmation email once the refund has been initiated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Renewals</h2>
            <p className="text-gray-700 leading-relaxed">
              The 14-day money-back guarantee applies only to your initial subscription purchase. Automatic renewal payments are not covered by this guarantee.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can cancel your subscription at any time from your account dashboard. After cancellation, you will retain access to Premium features until the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For refund requests or questions about this policy, please contact us at:
            </p>
            <p className="text-gray-700 mt-3">
              <strong>Email:</strong> <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a>
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Response Time:</strong> We typically respond within 1-2 business days
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              This refund policy is part of our Terms of Service. By subscribing to Research Room AI, you acknowledge that you have read and agree to this policy.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
