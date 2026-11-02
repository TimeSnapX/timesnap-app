import React from 'react';
import { Flag, CheckCircle, Clock, Zap } from 'lucide-react';

const roadmapStages = [
  { 
    title: 'NOW: MVP Foundation', 
    status: 'active',
    icon: Zap,
    details: ['AI Object Valuation Engine', 'Real-time Crypto & Metal Conversion', 'Secure Personal Vault', 'Brand & Community Launch'] 
  },
  { 
    title: 'NEXT: Data Gold Mine', 
    status: 'upcoming',
    icon: CheckCircle,
    details: ['Enhanced 100+ Asset Database', 'Historical Inflation Calculator', 'Subscriber Insights (Trends, Alerts)', 'Web3 Wallet Integration'] 
  },
  { 
    title: 'APPROACHING BLOCK 1,000,000', 
    status: 'future',
    icon: Clock,
    details: ['Digital Subscriptions Scaling', 'Physical Precious Metal Delivery Logistics', 'Founder Artifacts Shipping', '$TIME Token Ecosystem Integration'] 
  },
  { 
    title: 'BLOCK 1,000,000: GENESIS', 
    status: 'milestone',
    icon: Flag,
    details: ['Genesis Event Launch', 'Founder Drop: Physical Artifacts', 'TimeSnap Narrative Immutable Lock', 'Global Marketing Push'] 
  },
];

export default function RoadmapScreen() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="font-semibold text-white mb-4">Roadmap to Block 1,000,000</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          We are building the ultimate bridge between physical objects and digital value. 
          Follow our journey as we march towards the historic Bitcoin Block 1,000,000.
        </p>
      </div>

      <div className="relative border-l-2 border-gray-800 ml-4 md:ml-10 space-y-12 pb-12">
        {roadmapStages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.status === 'active';
          
          return (
            <div key={index} className="relative pl-8 md:pl-12">
              <div className={`
                absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 
                ${isActive ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-gray-900 border-gray-700'}
              `}></div>
              
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-700/20 text-gray-400'}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{stage.title}</h3>
                </div>
                
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stage.details.map((detail, i) => (
                    <li key={i} className="flex items-start space-x-2 text-gray-400">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-gray-600 rounded-full flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
