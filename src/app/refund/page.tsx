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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 7-Day Money-Back Guarantee</h2>
            <p className="text-gray-700 leading-relaxed">
              We offer a <strong>7-day money-back guarantee</strong> for all new subscriptions to Research Room AI. If you are not satisfied with our Service for any reason, you may request a full refund within 7 days of your initial purchase.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              The 7-day period begins at the time of your initial payment and applies only to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>First-time subscribers to any paid plan</li>
              <li>Upgrades from a free tier to a paid plan (for the first time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Refund Eligibility Conditions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To qualify for a refund, the following conditions must be met:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-3">
              <li>
                <strong>Timeframe:</strong> The refund request must be submitted within 7 calendar days of your initial subscription purchase date.
              </li>
              <li>
                <strong>First Purchase Only:</strong> The 7-day guarantee applies only to your first subscription payment. Renewal payments and subsequent subscription purchases are not eligible for refunds.
              </li>
              <li>
                <strong>Legitimate Use:</strong> Accounts suspected of abuse, fraudulent activity, or violation of our Terms of Service are not eligible for refunds.
              </li>
              <li>
                <strong>No Excessive Usage:</strong> Accounts that have processed an unreasonable volume of requests (as determined at our sole discretion) may not be eligible for a full refund.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Non-Refundable Situations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following situations are <strong>not eligible</strong> for refunds:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Requests made after the 7-day refund window</li>
              <li>Automatic subscription renewals (monthly or annual)</li>
              <li>Partial billing periods after a cancellation</li>
              <li>Change of mind after the 7-day period</li>
              <li>Account terminations due to Terms of Service violations</li>
              <li>Downgrade requests from a higher to a lower plan</li>
              <li>Unused portions of subscription periods</li>
              <li>Chargebacks or payment disputes after receiving a refund</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How to Request a Refund</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To request a refund during the 7-day guarantee period, please follow these steps:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-3">
              <li>
                <strong>Contact Support:</strong> Email us at <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a> with the subject line "Refund Request"
              </li>
              <li>
                <strong>Provide Details:</strong> Include the following information in your email:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Your registered email address</li>
                  <li>Your order/transaction ID (found in your Paddle receipt email)</li>
                  <li>Reason for requesting a refund (optional but helpful)</li>
                  <li>Date of purchase</li>
                </ul>
              </li>
              <li>
                <strong>Wait for Confirmation:</strong> We will review your request within 2-3 business days and send you a confirmation email.
              </li>
              <li>
                <strong>Refund Processing:</strong> Once approved, refunds are processed through Paddle and typically appear in your account within 5-10 business days, depending on your payment method and financial institution.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Refund Processing Time</h2>
            <p className="text-gray-700 leading-relaxed">
              Approved refunds are processed as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Request Review:</strong> 2-3 business days from submission</li>
              <li><strong>Refund Initiation:</strong> Within 24 hours of approval</li>
              <li><strong>Credit Card:</strong> 5-10 business days to appear in your account</li>
              <li><strong>PayPal:</strong> 3-5 business days</li>
              <li><strong>Other Payment Methods:</strong> Varies by provider, typically 5-10 business days</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Refunds are issued to the original payment method used for purchase. We cannot issue refunds to a different payment method or account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cancellations</h2>
            <p className="text-gray-700 leading-relaxed">
              You may cancel your subscription at any time through your account dashboard or by contacting support. Cancellations take effect at the end of your current billing period.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Important:</strong> Cancelling your subscription is different from requesting a refund. Cancellation stops future charges but does not refund the current period unless you're within the 7-day guarantee window.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              After cancellation, you will retain access to paid features until the end of your prepaid billing period.
            </p>
         </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription Renewals</h2>
            <p className="text-gray-700 leading-relaxed">
              Subscription renewals are <strong>not covered</strong> by the 7-day guarantee and are non-refundable. To avoid unwanted charges:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Cancel your subscription before your renewal date</li>
              <li>Monitor renewal reminder emails we send before each billing cycle</li>
              <li>Check your account dashboard for upcoming renewal dates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Issues and Technical Problems</h2>
            <p className="text-gray-700 leading-relaxed">
              If you experience technical difficulties or service outages that prevent you from using the Service, please contact our support team immediately. We will investigate the issue and may offer:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Technical support to resolve the issue</li>
              <li>Account credit for extended outages</li>
              <li>Prorated refunds in exceptional circumstances</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Such considerations are evaluated on a case-by-case basis and are at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Chargebacks and Payment Disputes</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Please contact us before initiating a chargeback.</strong> Initiating a chargeback before attempting to resolve the issue with us may result in immediate account suspension and ineligibility for future refunds.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Fraudulent chargebacks may result in permanent account termination and may be reported to relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For refund requests, questions, or concerns about this policy:
            </p>
            <ul className="list-none text-gray-700 space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a></li>
              <li><strong>Subject Line:</strong> "Refund Request" or "Refund Policy Inquiry"</li>
              <li><strong>Response Time:</strong> Within 2-3 business days</li>
            </ul>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              This refund policy is part of our Terms of Service. By subscribing to Research Room AI, you acknowledge that you have read and agree to this Refund Policy.
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
