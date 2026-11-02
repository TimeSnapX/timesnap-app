import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is TimeSnap in one line?',
    a: 'A camera-first app that estimates an item’s real value using AI, converts it into your chosen asset (like BTC or Gold), and preserves that snapshot over time.',
  },
  {
    q: 'How accurate are the valuations?',
    a: 'We use advanced AI vision models (Gemini 2.5) to identify items and cross-reference them with market data. While estimates are highly sophisticated, they are for informational purposes and should be verified for insurance or sales.',
  },
  {
    q: 'What makes TimeSnap different from a normal price tracker?',
    a: 'TimeSnap starts with *your* reality—physical objects—not just a ticker tape. It connects your personal inventory to the global financial system, building a long-term archive of your purchasing power.',
  },
  {
    q: 'Why Bitcoin Block 1,000,000?',
    a: 'It represents a significant cultural and mathematical milestone in "Bitcoin Time". We align our Genesis Launch with this event to symbolize the permanence of the data we preserve.',
  },
  {
    q: 'Can I actually buy Gold through the app?',
    a: 'Not yet directly in the digital app, but physical metal delivery through our "Physical" subscription tiers is coming soon.',
  },
];

export default function FAQScreen() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="font-semibold text-white mb-8 flex items-center">
        <HelpCircle className="mr-3 text-indigo-500" /> Frequently Asked Questions
      </h1>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
             <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
             <p className="text-gray-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
