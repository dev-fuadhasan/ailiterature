import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Research Room AI",
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Description</h2>
            <p className="text-gray-700 leading-relaxed">
              Research Room AI ("Service", "we", "us") provides an AI-powered automated literature review platform that enables researchers to search, download, analyze, and synthesize academic papers from various open-access repositories. Our Service uses artificial intelligence to extract key information including methodology, findings, limitations, and future work from academic publications.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              The Service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Searching across 250+ million academic papers from multiple scientific databases</li>
              <li>Automated PDF downloading from legal open-access sources</li>
              <li>AI-powered full-text analysis and information extraction</li>
              <li>Structured data export capabilities (CSV format)</li>
              <li>Project management dashboard for organizing literature reviews</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Account Registration and Use</h2>
            <p className="text-gray-700 leading-relaxed">
              To use the Service, you must create an account using Google OAuth authentication. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Not share your account with others</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Use the Service only for lawful academic and research purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Certain features of the Service may require payment. All payments are processed securely through our payment processor, Paddle. By subscribing to a paid plan, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Pay all applicable fees for your chosen subscription plan</li>
              <li>Provide valid payment information</li>
              <li>Authorize us to charge your payment method on a recurring basis</li>
              <li>Pay all applicable taxes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right to modify our pricing at any time. Price changes will be communicated to you in advance and will not affect your current billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Renewal and Cancellation</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Automatic Renewal:</strong> Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date. You will be charged at the then-current rate for your subscription plan.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Cancellation:</strong> You may cancel your subscription at any time through your account dashboard or by contacting our support team. Cancellations take effect at the end of your current billing period. You will retain access to paid features until the end of the prepaid period.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              No refunds will be provided for partial billing periods. Please refer to our Refund Policy for complete details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to circumvent any usage limitations or access controls</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated means to access the Service in a manner that exceeds reasonable request volume</li>
              <li>Redistribute, sell, or resell any content obtained through the Service</li>
              <li>Violate any applicable copyright, trademark, or intellectual property laws</li>
              <li>Use the Service to upload or transmit malicious code or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service, including its software, algorithms, design, and content (excluding user-generated content and third-party academic papers), is owned by Research Room AI and protected by intellectual property laws. Academic papers accessed through the Service remain the property of their respective copyright holders and are subject to their individual licenses.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              You retain ownership of any research data, notes, or analyses you create using the Service. By using the Service, you grant us a limited license to process and analyze your inputs solely for the purpose of providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Content</h2>
            <p className="text-gray-700 leading-relaxed">
              We access academic papers only from legal open-access sources and authorized repositories. We do not provide access to paywalled or copyrighted content without proper authorization. Users are responsible for ensuring their use of downloaded papers complies with applicable copyright laws and institutional policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED</li>
              <li>WE DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR QUALITY OF AI-GENERATED SUMMARIES</li>
              <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM</li>
              <li>WE ARE NOT RESPONSIBLE FOR SERVICE INTERRUPTIONS, DATA LOSS, OR ERRORS IN THIRD-PARTY DATABASES</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Users must verify all AI-generated information independently. We are not responsible for academic decisions made based on Service outputs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimer of Academic Responsibility</h2>
            <p className="text-gray-700 leading-relaxed">
              Research Room AI is a tool to assist with literature review. The Service does not replace professional academic judgment. Users are solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Verifying the accuracy of all extracted information</li>
              <li>Proper citation and attribution of sources</li>
              <li>Compliance with academic integrity policies</li>
              <li>Final research conclusions and publications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Service Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with or without notice. We may also impose usage limits or restrictions on certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your access to the Service immediately if you violate these Terms. Upon termination, your right to use the Service ceases immediately. You may also terminate your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Research Room AI from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Research Room AI operates, without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by email or through the Service. Your continued use of the Service after such notice constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, please contact us at: <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a>
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using Research Room AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
