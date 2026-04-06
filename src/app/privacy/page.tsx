import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - PriceCompare",
  description: "PriceCompare privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: April 6, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Overview</h2>
          <p>
            PriceCompare (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a free grocery price
            comparison tool. We are committed to protecting your privacy. This
            policy explains what data we collect, how we use it, and your rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">2. Data We Collect</h2>
          <h3 className="text-lg font-medium mt-4 mb-2">Data stored on your device only:</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Shopping list items</li>
            <li>Watch list / price alerts</li>
            <li>Scanned receipt data</li>
            <li>Budget settings</li>
            <li>Preferred postal code / location</li>
          </ul>
          <p className="mt-3">
            This data is stored in your browser&apos;s local storage and <strong>never sent
            to our servers</strong>. If you clear your browser data, it is permanently deleted.
          </p>

          <h3 className="text-lg font-medium mt-4 mb-2">Data processed on our servers:</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Search queries</strong> — when you search for a product, the search term
              is sent to our server to fetch prices from third-party sources
              (Flipp, Brave Search, SerpAPI).
            </li>
            <li>
              <strong>Approximate location</strong> — your IP address may be used to detect
              your country/region to show relevant local store prices. We do not
              store your IP address.
            </li>
            <li>
              <strong>AI Deals chat messages</strong> — if you use the AI Deals Advisor,
              your messages are sent to third-party AI providers (Google Gemini,
              Groq) to generate responses. We do not store your chat history.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">3. Third-Party Services</h2>
          <p>We use the following third-party services to provide functionality:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Flipp</strong> — flyer and deal data</li>
            <li><strong>Brave Search</strong> — supplementary price search</li>
            <li><strong>SerpAPI</strong> — Google Shopping price data</li>
            <li><strong>Google Gemini / Groq</strong> — AI-powered deal advisor</li>
            <li><strong>Vercel</strong> — hosting and deployment</li>
          </ul>
          <p className="mt-2">
            Each of these services has its own privacy policy. We encourage you to
            review them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">4. Cookies &amp; Tracking</h2>
          <p>
            PriceCompare <strong>does not use cookies</strong> for tracking or advertising.
            We do not use any analytics or advertising SDKs. We do not track you
            across websites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Retention</h2>
          <p>
            We do not maintain user accounts or databases of personal data. Search
            queries may be temporarily cached in server memory (up to 24 hours)
            to reduce API calls, then automatically discarded.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Children&apos;s Privacy</h2>
          <p>
            PriceCompare is a general-audience app. We do not knowingly collect
            personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Your Rights</h2>
          <p>Since all personal data is stored locally on your device, you can:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>View all your data in your browser&apos;s developer tools (Application → Local Storage)</li>
            <li>Delete all data by clearing your browser storage or uninstalling the app</li>
            <li>Use the app without providing any personal information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. Changes will be
            posted on this page with an updated date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact</h2>
          <p>
            If you have questions about this privacy policy, please open an issue
            on our{" "}
            <a
              href="https://github.com/yalei-dong/price-compare"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
