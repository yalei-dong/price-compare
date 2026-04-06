import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - PriceCompare",
  description: "PriceCompare terms of service.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-500 mb-8">Last updated: April 6, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
          <p>
            By using PriceCompare (&quot;the app&quot;), you agree to these terms. If you
            do not agree, please do not use the app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">2. Description of Service</h2>
          <p>
            PriceCompare is a free grocery price comparison tool that aggregates
            publicly available price data from flyers, search engines, and
            retailers. The app helps users find and compare prices across stores.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">3. Price Accuracy</h2>
          <p>
            Prices displayed in the app are sourced from third-party providers
            and may not always be accurate or up to date. PriceCompare does not
            guarantee the accuracy, completeness, or timeliness of any pricing
            information. Always verify prices at the store or retailer website
            before making purchasing decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">4. AI Advisor Disclaimer</h2>
          <p>
            The AI Deals Advisor provides suggestions based on available price data.
            AI-generated responses may contain errors or inaccuracies. Recommendations
            should not be considered financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">5. No Warranty</h2>
          <p>
            The app is provided &quot;as is&quot; without warranty of any kind, express or
            implied. We do not warrant that the service will be uninterrupted,
            error-free, or free of harmful components.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, PriceCompare and its creators
            shall not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of the app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">7. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the app for any unlawful purpose</li>
            <li>Attempt to overload, disrupt, or interfere with the service</li>
            <li>Scrape or harvest data from the app for commercial purposes</li>
            <li>Reverse engineer or attempt to extract source code beyond what is publicly available</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the app after
            changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact</h2>
          <p>
            Questions about these terms? Open an issue on our{" "}
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
