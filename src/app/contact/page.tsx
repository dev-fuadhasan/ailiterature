import Link from "next/link";
import Image from "next/image";
import { Mail, Globe } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Research Room AI support team",
};

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-lg text-gray-600 mb-12">
          Have questions? We're here to help. Reach out to our support team and we'll get back to you as soon as possible.
        </p>

        <div className="grid md:grid-cols-1 gap-8 mb-12">
          {/* Email Support */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Email Support</h2>
            <p className="text-gray-600 mb-6">
              Send us an email and we'll respond within 24-48 hours on business days.
            </p>
            <a 
              href="mailto:support@researchroomai.com" 
              className="text-blue-600 hover:text-blue-700 font-semibold text-lg hover:underline"
            >
              support@researchroomai.com
            </a>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Business Information</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Business Name:</p>
              <p>Research Room AI</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Website:</p>
              <a href="https://researchroomai.com" className="text-blue-600 hover:underline flex items-center gap-2">
                <Globe className="h-4 w-4" />
                https://researchroomai.com
              </a>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Support Email:</p>
              <p>support@researchroomai.com</p>
            </div>
          </div>
        </div>

        {/* Common Questions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Common Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📧 What should I include in my support email?</h3>
              <p className="text-gray-700">
                Please include your registered email address, a clear description of your issue, and any relevant screenshots. This helps us resolve your issue faster.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">⏱️ How quickly will I receive a response?</h3>
              <p className="text-gray-700">
                We typically respond within 24-48 hours on business days (Monday-Friday). For urgent issues, please mark your email as "Urgent" in the subject line.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">💳 Need help with billing or refunds?</h3>
              <p className="text-gray-700">
                For billing inquiries or refund requests, email us at support@researchroomai.com with "Billing" or "Refund Request" in the subject line. Include your transaction ID from Paddle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔧 Experiencing technical issues?</h3>
              <p className="text-gray-700">
                Please include your browser type, operating system, and steps to reproduce the issue. Screenshots or screen recordings are extremely helpful.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            🔐 Security Notice
          </h3>
          <p className="text-sm text-gray-700">
            We will never ask for your password via email. If you receive suspicious emails claiming to be from Research Room AI, please forward them to security@researchroomai.com and do not click any links.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-block text-blue-600 hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
