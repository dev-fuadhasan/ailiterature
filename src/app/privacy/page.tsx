import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Research Room AI",
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Research Room AI ("we", "us", "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share information when you use our Service at researchroomai.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Account Information</h3>
            <p className="text-gray-700 leading-relaxed">
              When you create an account via Google OAuth, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Email address:</strong> Used for account identification and communication</li>
              <li><strong>Name:</strong> Retrieved from your Google profile for personalization</li>
              <li><strong>Profile picture:</strong> Retrieved from your Google account</li>
              <li><strong>Google User ID:</strong> Used for secure authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Usage Data</h3>
            <p className="text-gray-700 leading-relaxed">
              We automatically collect information about your use of the Service:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Research queries:</strong> Topics, year ranges, and search parameters you submit</li>
              <li><strong>Project data:</strong> Literature review projects you create, including status and metadata</li>
              <li><strong>Paper interactions:</strong> Papers you view, download, or analyze</li>
              <li><strong>API usage:</strong> Number of requests, processing times, and error logs</li>
              <li><strong>Device information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Session data:</strong> Login times, page views, feature usage</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Payment Information</h3>
            <p className="text-gray-700 leading-relaxed">
              Payment transactions are processed by <strong>Paddle.com</strong>, our payment processor. We do not store your full credit card information. Paddle collects and processes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Payment card details</li>
              <li>Billing address</li>
              <li>Transaction history</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              For Paddle's privacy practices, visit: <a href="https://paddle.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">paddle.com/privacy</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service integrates with the following third-party services that may collect data:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Authentication</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Google OAuth:</strong> For secure user authentication. Google's privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">policies.google.com/privacy</a></li>
              <li><strong>Supabase:</strong> Authentication and database infrastructure. Supabase privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/privacy</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 AI Processing</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Groq API:</strong> For fast AI text analysis and extraction. Your paper contents are processed by Groq's AI models.</li>
              <li><strong>Google Gemini API:</strong> Fallback AI service for text analysis when Groq is unavailable.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Paper text is sent to these AI services for analysis. These services may temporarily process but do not permanently store your research content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Authentication cookies:</strong> Keep you logged in (Supabase session tokens)</li>
              <li><strong>Preference cookies:</strong> Remember your settings</li>
              <li><strong>Security cookies:</strong> Prevent unauthorized access and CSRF attacks</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not currently use Google Analytics or other third-party analytics services, but may implement them in the future with prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">
              We use collected information to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Process your literature review requests</li>
              <li>Authenticate your account and maintain security</li>
              <li>Send service-related notifications and updates</li>
              <li>Process payments through Paddle</li>
              <li>Improve our AI models and Service quality</li>
              <li>Respond to support requests</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Database:</strong> PostgreSQL hosted by Supabase with row-level security</li>
              <li><strong>PDF Storage:</strong> Cloudflare R2 with pre-signed URLs for secure access</li>
              <li><strong>Encryption:</strong> Data in transit is encrypted using TLS/SSL</li>
              <li><strong>Authentication:</strong> OAuth 2.0 with secure token storage</li>
              <li><strong>Access Control:</strong> User data is isolated and access-controlled</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              While we implement robust security measures, no online service is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Account data:</strong> Until you delete your account</li>
              <li><strong>Project data:</strong> Until you delete specific projects</li>
              <li><strong>PDF files:</strong> Automatically deleted when associated projects are removed</li>
              <li><strong>Logs and analytics:</strong> Up to 90 days for security and debugging</li>
              <li><strong>Payment records:</strong> As required by Paddle and tax regulations (typically 7 years)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We do not sell your personal data. We may share your information only in these circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Service providers:</strong> Third-party services listed in Section 3 to operate the Service</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              <li><strong>With your consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your project data in CSV format</li>
              <li><strong>Objection:</strong> Object to certain data processing activities</li>
              <li><strong>Withdraw consent:</strong> Revoke consent for data processing (may affect Service access)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, contact us at: <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Users</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be transferred to and processed in countries other than your own. By using the Service, you consent to such transfers. We ensure appropriate safeguards are in place for international data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes via email or through the Service. Continued use of the Service after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions, concerns, or requests regarding this Privacy Policy or your data:
            </p>
            <ul className="list-none text-gray-700 space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:support@researchroomai.com" className="text-blue-600 hover:underline">support@researchroomai.com</a></li>
              <li><strong>Website:</strong> <a href="https://researchroomai.com/contact" className="text-blue-600 hover:underline">researchroomai.com/contact</a></li>
            </ul>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using Research Room AI, you acknowledge that you have read and understood this Privacy Policy.
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
