import React from 'react';
import { Camera, RefreshCw, Archive } from 'lucide-react';

export default function VisionScreen() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">The Vision</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          We believe everything has value. Our mission is to bridge the gap between the physical objects you own and the digital financial system of the future.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800 hover:border-indigo-500/50 transition-colors text-center group">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors">
            <Camera size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Capture</h3>
          <p className="text-gray-400">
            The world is full of value trapped in physical form. Photograph any item, from a vintage watch to a piece of furniture, and instantly digitize its worth.
          </p>
        </div>

        <div className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800 hover:border-indigo-500/50 transition-colors text-center group">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors">
            <RefreshCw size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Convert</h3>
          <p className="text-gray-400">
            Fiat currency depreciates. Real assets endure. We allow you to mentally convert your physical worth into sound money like Bitcoin, Gold, and Silver.
          </p>
        </div>

        <div className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800 hover:border-indigo-500/50 transition-colors text-center group">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors">
            <Archive size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Preserve</h3>
          <p className="text-gray-400">
            Build a "Time Vault" of your life's assets. Track how their purchasing power changes over time, protecting your legacy against inflation.
          </p>
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-3xl p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Why Now?</h2>
        <p className="text-indigo-200 mb-6">
          As we approach Bitcoin Block 1,000,000, the world is waking up to the reality of monetary debasement. 
          TimeSnap is the tool for the new era of value consciousness.
        </p>
        <div className="text-sm font-mono text-indigo-400">Target Launch: 2026</div>
      </div>
    </div>
  );
}
