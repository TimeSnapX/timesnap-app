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
    a: 'Not yet directly in the digital app, but our "Physical" subscription tiers provide a concierge service via our partner Liberty Bullion to ship physical metals to your door.',
  },
];

export default function FAQScreen() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
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

      <div className="mt-12 bg-gray-900 p-8 rounded-2xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Strategic Partners</h2>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center text-yellow-500 font-bold border border-yellow-600/50">
            LB
          </div>
          <div>
            <h3 className="font-bold text-white">Liberty Bullion</h3>
            <p className="text-sm text-gray-500">Melbourne, Australia</p>
            <p className="text-sm text-gray-400 mt-1">Official fulfillment partner for physical precious metal subscriptions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
