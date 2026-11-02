import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, Save, Tag, ExternalLink, Info } from 'lucide-react';
import { useAssets } from '../hooks/useAssets';
import { useSnapsStore } from '../stores/snapsStore';
import { analyzeImage } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { downscaleImage } from '../services/imageUtils';
import { useCurrency } from '../stores/currencyStore';
import { RatesNote } from '../components/CurrencyPicker';
import { MarketsPanel } from '../components/MarketsPanel';
import { InstallBanner } from '../components/Install';

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
  const currency = useCurrency();

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
        <h1 className="text-white mb-2">Snap & Estimate</h1>
        <p className="text-ink-400">Capture any object to instantly value it using AI and convert it to sound money.</p>
      </div>

      {!image && <InstallBanner />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        
        {/* Left Col: Upload/Preview */}
        <div className="flex flex-col space-y-4">
          {/* Inputs live outside the clickable drop zone so programmatic clicks can't bubble into it */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange} 
            onClick={(e) => e.stopPropagation()}
          />
          <input 
            type="file" 
            ref={galleryInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            onClick={(e) => e.stopPropagation()}
          />
          <div 
            className={`
              border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 transition-colors
              min-h-[320px] relative overflow-hidden
              ${image ? 'border-transparent bg-ink-900' : 'border-gold-500/35 bg-gradient-to-b from-gold-500/[0.07] to-transparent hover:border-gold-500/60 cursor-pointer'}
            `}
            onClick={() => !loading && !image && fileInputRef.current?.click()}
          >
            
            {image ? (
              <>
                <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-black" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); }}
                  className="absolute top-3 right-3 bg-ink-950/70 backdrop-blur p-3 rounded-full text-white hover:bg-red-500 transition-colors"
                >
                  <RefreshCw size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="btn-gold w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow rotate-3">
                  <Camera size={30} />
                </div>
                <h3 className="font-display text-2xl font-semibold text-white mb-2">Take a Photo</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Click or tap here to upload an image of the item you want to value.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    data-testid="take-photo"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="inline-flex items-center justify-center gap-2 px-5 min-h-[52px] rounded-2xl btn-gold shadow-glow font-semibold transition-transform active:scale-[0.98]"
                  >
                    <Camera size={18} />
                    <span>Take photo</span>
                  </button>
                  <button
                    type="button"
                    data-testid="choose-gallery"
                    onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }}
                    className="inline-flex items-center justify-center gap-2 px-5 min-h-[52px] rounded-2xl border border-white/10 bg-white/[0.04] text-ink-100 hover:bg-white/[0.08] font-semibold transition-transform active:scale-[0.98]"
                  >
                    <Upload size={18} />
                    <span>Choose from gallery</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Results */}
        <div className="flex flex-col justify-center space-y-6">
          {loading && (
            <div className="card flex flex-col items-center justify-center p-12">
              <RefreshCw className="animate-spin text-gold-400 mb-4" size={44} />
              <h3 className="text-xl font-semibold text-white">Analyzing...</h3>
              <p className="text-gray-400 text-center mt-2">Searching markets and estimating value...</p>
            </div>
          )}

          {!loading && !result && !image && (
             <div className="hidden md:flex flex-col items-center justify-center p-12 card text-center">
               <Upload size={44} className="text-gold-500/60 mb-4" />
               <p className="text-ink-400">Upload an image to see the magic happen.</p>
             </div>
          )}

          {!loading && result && (
            <div className="card overflow-hidden animate-rise" data-testid="result-card">
              <div className="p-5 pb-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold-400 font-semibold mb-1">Estimated value</p>
                <h2 className="text-2xl font-semibold text-white leading-snug">{result.name}</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-br from-gold-100 via-gold-300 to-gold-500">
                    {currency.format(result.usd)}
                  </span>
                  <span className="text-sm text-ink-400 font-medium">{currency.code}</span>
                </div>
                {currency.code !== 'USD' && <p className="text-xs text-ink-400 mt-1">≈ ${result.usd.toLocaleString()} USD estimate</p>}
                <RatesNote className="mt-1" />
                <p className="text-ink-300 mt-3 text-sm leading-relaxed">{result.description}</p>

                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {result.tags.map(tag => (
                      <span key={tag} className="chip"><Tag size={11} /> {tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {result.valuationReasoning && (
                <div className="mx-5 mb-4 p-4 rounded-2xl bg-gold-500/[0.07] border border-gold-500/20">
                  <div className="flex items-center text-[11px] font-semibold text-gold-300 uppercase tracking-wider mb-1.5">
                    <Info size={13} className="mr-1.5" /> AI Valuation Insight
                  </div>
                  <p className="text-sm text-ink-200 leading-relaxed">{result.valuationReasoning}</p>
                </div>
              )}

              {result.sources && result.sources.length > 0 && (
                <div className="px-5 pb-4">
                  <h3 className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2">Valuation Sources</h3>
                  <ul className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.06] overflow-hidden">
                    {result.sources.map((source, i) => (
                      <li key={i}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm text-ink-200 hover:bg-white/[0.04] active:bg-white/[0.06]">
                          <span className="w-6 h-6 rounded-full bg-ink-800 text-[11px] text-gold-300 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="flex-1 truncate">{source.title}</span>
                          <ExternalLink size={14} className="text-ink-500 flex-shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <MarketsPanel usd={result.usd} />

              <div className="p-5 pt-4">
                <button 
                  onClick={saveSnap}
                  className="w-full btn-gold shadow-glow font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <Save size={20} />
                  <span>Save to Vault</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}