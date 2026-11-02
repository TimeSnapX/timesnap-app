import React, { useState } from 'react';
import { Check, Package, Smartphone } from 'lucide-react';

const digitalTiers = [
  { name: 'Silver', price: 2.99, color: 'border-gray-400', features: ['Snap → USD estimate (10/mo)', 'Convert to 1 asset', 'Basic snapshot history'] },
  { name: 'Gold', price: 4.99, color: 'border-yellow-500', isPopular: true, features: ['Unlimited Snaps', 'Value history + comparisons', 'Priority AI processing', 'Export Vault Data'] },
  { name: 'Platinum', price: 9.99, color: 'border-indigo-400', features: ['Everything in Gold', 'Unlimited asset tracking', 'Advanced analytics & alerts', 'API Access'] },
];

const physicalTiers = [
  { name: 'Stacker Silver', price: 100, value: 100, color: 'border-gray-300', features: ['Monthly 1oz Silver Coin', 'Timestamped Digital NFT', 'Free Digital Gold Sub'] },
  { name: 'Stacker Gold', price: 1000, value: 1000, color: 'border-yellow-500', features: ['Monthly Fractional Gold', 'Priority Fulfillment', 'Founder Club Access', 'Free Digital Platinum Sub'] },
  { name: 'Whale Platinum', price: 10000, value: 10000, color: 'border-indigo-300', features: ['Elite Allocation (Custom)', 'Vault Storage Services', 'Luxury Timepiece Sourcing', 'Concierge Support'] },
];

export default function SubscriptionsScreen() {
  const [activeTab, setActiveTab] = useState<'digital' | 'physical'>('digital');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-semibold text-white mb-4">Choose Your Tier</h1>
        <p className="text-gray-400 mb-8">Unlock the full power of time preservation.</p>
        
        <div className="inline-flex bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('digital')}
            className={`px-8 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'digital' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><Smartphone size={16} /> Digital</span>
          </button>
          <button 
            onClick={() => setActiveTab('physical')}
            className={`px-8 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'physical' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><Package size={16} /> Physical</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(activeTab === 'digital' ? digitalTiers : physicalTiers).map((tier) => (
          <div key={tier.name} className={`relative bg-gray-800 rounded-2xl p-6 border-2 ${tier.color} flex flex-col hover:transform hover:scale-105 transition-all duration-300`}>
             {'isPopular' in tier && tier.isPopular && (
               <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                 Most Popular
               </div>
             )}
             
             <div className="mb-4">
               <h3 className="text-xl font-bold text-white">{tier.name}</h3>
               <div className="flex items-baseline mt-2">
                 <span className="text-3xl font-extrabold text-white">${tier.price.toLocaleString()}</span>
                 <span className="text-gray-400 ml-1">/mo</span>
               </div>
               {'value' in tier && (
                 <p className="text-green-400 text-sm mt-1 font-medium">Est. Value Delivered: ${tier.value}</p>
               )}
             </div>

             <ul className="space-y-3 mb-8 flex-1">
               {tier.features.map((feature, i) => (
                 <li key={i} className="flex items-start text-gray-300 text-sm">
                   <Check size={16} className="text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                   {feature}
                 </li>
               ))}
             </ul>

             <button className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl border border-white/10 transition-colors">
               Select {tier.name}
             </button>
          </div>
        ))}
      </div>
      
      {activeTab === 'physical' && (
        <p className="text-center text-gray-500 text-sm mt-4">
          * Physical subscriptions are coming soon. Shipping restrictions may apply.
        </p>
      )}
    </div>
  );
}
