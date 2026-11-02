import React from 'react';
import { Coins, Lock, Activity, Users } from 'lucide-react';

export default function TokenScreen() {
  return (
    <div className="space-y-10">
      <div className="text-center bg-gradient-to-b from-indigo-900/20 to-transparent p-10 rounded-3xl border border-indigo-500/10">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-2xl mb-6 shadow-xl shadow-indigo-500/20">
          <Coins size={48} className="text-white" />
        </div>
        <h1 className="text-[2.5rem] md:text-5xl font-semibold text-white mb-4">$TIME Token</h1>
        <p className="text-xl text-indigo-200 font-light">The Currency of Preservation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Ticker</div>
          <div className="text-2xl font-bold text-white">$TIME</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Total Supply</div>
          <div className="text-2xl font-bold text-white">100,000,000</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Initial Float</div>
          <div className="text-2xl font-bold text-white">1,000,000</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Network</div>
          <div className="text-2xl font-bold text-white">Solana</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700/50">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Activity className="mr-3 text-indigo-400" /> Token Utility
          </h3>
          <ul className="space-y-4">
             <li className="flex items-start">
               <div className="bg-gray-700 p-1 rounded mr-3 mt-1"><Activity size={12} /></div>
               <span className="text-gray-300"><b>Subscription Discounts:</b> Pay for Silver/Gold/Platinum tiers with $TIME for 20% off.</span>
             </li>
             <li className="flex items-start">
               <div className="bg-gray-700 p-1 rounded mr-3 mt-1"><Activity size={12} /></div>
               <span className="text-gray-300"><b>Governance:</b> Vote on new assets to be added to the valuation engine (e.g., Rolex, Pokemon Cards).</span>
             </li>
             <li className="flex items-start">
               <div className="bg-gray-700 p-1 rounded mr-3 mt-1"><Activity size={12} /></div>
               <span className="text-gray-300"><b>Staking:</b> Lock $TIME to earn yield in physical asset vouchers.</span>
             </li>
          </ul>
        </div>

        <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700/50">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Lock className="mr-3 text-indigo-400" /> Vesting & Allocation
          </h3>
          <div className="space-y-4">
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Community & Ecosystem</span>
                 <span className="text-white font-bold">40%</span>
               </div>
               <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 w-[40%]"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Treasury (Locked 1yr)</span>
                 <span className="text-white font-bold">30%</span>
               </div>
               <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500 w-[30%]"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Team & Founders (Vested 4yrs)</span>
                 <span className="text-white font-bold">20%</span>
               </div>
               <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 w-[20%]"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-300">Liquidity</span>
                 <span className="text-white font-bold">10%</span>
               </div>
               <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 w-[10%]"></div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
