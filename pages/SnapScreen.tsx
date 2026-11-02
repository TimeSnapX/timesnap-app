import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, Save, Tag, ExternalLink, Info } from 'lucide-react';
import { useAssets } from '../hooks/useAssets';
import { useSnapsStore } from '../stores/snapsStore';
import { analyzeImage } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { downscaleImage } from '../services/imageUtils';

export default function SnapScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    name: string; 
    usd: number; 
    description: string; 
    tags: string[];
    valuationReasoning?: string;
    sources?: { title: string; uri: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const { prices, assets, isLoading: isAssetsLoading } = useAssets();
  const { addSnap } = useSnapsStore();
  const navigate = useNavigate();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = ''; // allow re-selecting the same file
    try {
      // Downscale client-side (max 1600px JPEG) before sending
      const base64String = await downscaleImage(file, 1600, 0.85);
      setImage(base64String);
      setResult(null); // Reset previous result
      processImage(base64String);
    } catch (e) {
      console.error(e);
      alert("Could not read that image. Please try another photo.");
    }
  };

  const processImage = async (base64Img: string) => {
    setLoading(true);
    try {
      const valuation = await analyzeImage(base64Img);
      setResult({
        name: valuation.name,
        usd: valuation.usdValue,
        description: valuation.description,
        tags: valuation.tags || [],
        valuationReasoning: valuation.valuationReasoning,
        sources: valuation.sources
      });
    } catch (e) {
      console.error(e);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveSnap = () => {
    if (!result || !image) return;
    
    const conversions = assets.reduce((acc, { symbol }) => {
      const price = prices[symbol];
      acc[symbol] = price > 0 ? result.usd / price : 0;
      return acc;
    }, {} as Record<string, number>);

    addSnap({
      timestamp: Date.now(),
      imageUri: image,
      usdValue: result.usd,
      title: result.name,
      description: result.description,
      tags: result.tags,
      valuationReasoning: result.valuationReasoning,
      sources: result.sources,
      conversions,
    });
    
    navigate('/vault');
  };

  const formatCryptoAmount = (amount: number) => {
    if (amount === 0) return '0';
    if (amount < 0.0001) {
      // Use standard decimal notation with up to 8 places for very small amounts (satoshis)
      return amount.toLocaleString(undefined, { maximumFractionDigits: 8, minimumFractionDigits: 0 });
    } else if (amount < 1) {
       return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
    }
    return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">Snap & Estimate</h1>
        <p className="text-gray-400">Capture any object to instantly value it using AI and convert it to sound money.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Col: Upload/Preview */}
        <div className="flex flex-col space-y-4">
          <div 
            className={`
              border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors
              min-h-[300px] relative overflow-hidden
              ${image ? 'border-gray-700 bg-gray-900' : 'border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer'}
            `}
            onClick={() => !loading && !image && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange} 
            />
            <input 
              type="file" 
              ref={galleryInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            
            {image ? (
              <>
                <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-black" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); }}
                  className="absolute top-4 right-4 bg-gray-900/80 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                >
                  <RefreshCw size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                  <Camera size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Take a Photo</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Click or tap here to upload an image of the item you want to value.
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }}
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-sm"
                >
                  <Upload size={16} />
                  <span>Choose from gallery</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Results */}
        <div className="flex flex-col justify-center space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-900 rounded-2xl border border-gray-800 animate-pulse">
              <RefreshCw className="animate-spin text-indigo-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white">Analyzing...</h3>
              <p className="text-gray-400 text-center mt-2">Searching markets and estimating value...</p>
            </div>
          )}

          {!loading && !result && !image && (
             <div className="flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-2xl border border-gray-800/50 text-center">
               <Upload size={48} className="text-gray-600 mb-4" />
               <p className="text-gray-500">Upload an image to see the magic happen.</p>
             </div>
          )}

          {!loading && result && (
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <div className="border-b border-gray-700 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mt-2">
                  ${result.usd.toLocaleString()} <span className="text-lg text-gray-400 font-normal">USD</span>
                </div>
                <p className="text-gray-400 mt-2 text-sm italic">{result.description}</p>
                
                {result.valuationReasoning && (
                  <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                    <div className="flex items-center text-xs font-bold text-indigo-400 uppercase mb-1">
                      <Info size={12} className="mr-1" /> AI Valuation Insight
                    </div>
                    <p className="text-xs text-indigo-200">{result.valuationReasoning}</p>
                  </div>
                )}

                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.tags.map(tag => (
                      <span key={tag} className="flex items-center text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/20">
                         <Tag size={10} className="mr-1" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
                {result.sources && result.sources.length > 0 && (
                  <div className="mt-3 text-xs">
                    <span className="text-gray-500 block mb-1">Valuation Sources:</span>
                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((source, i) => (
                        <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-400 hover:text-indigo-300 hover:underline">
                          <ExternalLink size={10} className="mr-1" /> {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Purchasing Power Conversions</h3>
                {isAssetsLoading ? (
                  <p className="text-gray-500">Loading live prices...</p>
                ) : (
                  assets.map(({ symbol, name }) => {
                    const price = prices[symbol] || 0;
                    const amount = price > 0 ? result.usd / price : 0;
                    return (
                      <div key={symbol} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-200">{name}</span>
                          <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">{symbol}</span>
                        </div>
                        <span className="font-mono font-medium text-white">
                          {formatCryptoAmount(amount)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <button 
                onClick={saveSnap}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02]"
              >
                <Save size={20} />
                <span>Save to Vault</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}