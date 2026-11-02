import React, { useState } from 'react';
import { useSnapsStore } from '../stores/snapsStore';
import { useAssets } from '../hooks/useAssets';
import { Trash2, TrendingUp, TrendingDown, Clock, Edit2, Tag, X, ExternalLink, Info, Eye, Calendar } from 'lucide-react';
import { Snap } from '../types';
import { Link } from 'react-router-dom';

export default function VaultScreen() {
  const { snaps, removeSnap, updateSnap } = useSnapsStore();
  const { prices, assets } = useAssets();
  
  const [editingSnap, setEditingSnap] = useState<Snap | null>(null);
  const [viewingSnap, setViewingSnap] = useState<Snap | null>(null);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editUsd, setEditUsd] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleEditClick = (snap: Snap, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSnap(snap);
    // Backward compatibility: if no title, try to split description or use default
    const title = snap.title || (snap.description.includes(' - ') ? snap.description.split(' - ')[0] : 'Untitled Item');
    const desc = snap.title ? snap.description : (snap.description.includes(' - ') ? snap.description.split(' - ')[1] : snap.description);
    
    setEditTitle(title);
    setEditUsd(snap.usdValue.toString());
    setEditDesc(desc);
    setEditTags(snap.tags || []);
    
    // Close view modal if open
    setViewingSnap(null);
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(window.confirm("Are you sure you want to delete this snap?")) {
        removeSnap(id);
        if (viewingSnap?.id === id) setViewingSnap(null);
    }
  };

  const handleSaveEdit = () => {
    if (!editingSnap) return;
    
    const usdValue = parseFloat(editUsd) || 0;
    
    updateSnap(editingSnap.id, {
      title: editTitle,
      usdValue: usdValue,
      description: editDesc,
      tags: editTags
    });
    
    setEditingSnap(null);
  };

  const addTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  const formatCryptoAmount = (amount: number) => {
    if (amount === 0) return '0';
    if (amount < 0.0001) {
      return amount.toLocaleString(undefined, { maximumFractionDigits: 8, minimumFractionDigits: 0 });
    } else if (amount < 1) {
       return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
    }
    return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-white mb-2">Your Vault</h1>
        <p className="text-ink-400">Your personal archive of captured value.</p>
      </div>
      <div className="card p-5 flex items-center justify-between bg-gradient-to-br from-gold-500/[0.12] via-ink-900/80 to-ink-900/80">
        <div>
           <span className="text-ink-300 text-xs uppercase tracking-wider font-semibold">Total Value Captured</span>
           <div className="font-display text-4xl font-semibold text-gold-200 mt-1">
             ${snaps.reduce((acc, curr) => acc + curr.usdValue, 0).toLocaleString()}
           </div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-semibold text-white">{snaps.length}</div>
          <span className="text-ink-400 text-xs">{snaps.length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      {snaps.length === 0 ? (
        <div className="text-center py-16 px-6 card">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center"><Clock className="text-gold-400" size={30} /></div>
          <h3 className="font-display text-2xl font-semibold text-white mb-2">The Vault is Empty</h3>
          <p className="text-gray-500 mb-6">Start by snapping an object to preserve its value.</p>
          <Link to="/" className="inline-flex items-center min-h-[48px] btn-gold shadow-glow px-6 rounded-2xl font-semibold">
            Go to Snap
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {snaps.map((snap) => {
             // Display logic fallback
             const displayTitle = snap.title || snap.description.split(' - ')[0] || "Untitled";
             const displayDesc = snap.title ? snap.description : (snap.description.split(' - ')[1] || snap.description);

             return (
              <div 
                key={snap.id} 
                onClick={() => setViewingSnap(snap)}
                className="card overflow-hidden flex flex-col group cursor-pointer hover:border-gold-500/40 transition-all active:scale-[0.99]"
              >
                <div className="w-full h-44 bg-ink-950 relative flex-shrink-0">
                  {snap.imageUri ? (
                     <img src={snap.imageUri} alt="Snap" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
                  <p className="absolute top-3 left-3 text-[11px] font-medium text-white/90 bg-ink-950/60 backdrop-blur px-2.5 py-1 rounded-full">{new Date(snap.timestamp).toLocaleDateString()}</p>
                </div>
                
                <div className="flex-1 p-4 pt-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-white line-clamp-1 mr-2" title={displayTitle}>{displayTitle}</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => handleEditClick(snap, e)} 
                          className="p-2.5 -my-1 text-ink-400 hover:text-gold-300 hover:bg-white/[0.06] rounded-xl transition-colors" aria-label="Edit"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(snap.id, e)} 
                          className="p-2.5 -my-1 text-ink-400 hover:text-red-400 hover:bg-white/[0.06] rounded-xl transition-colors" aria-label="Delete"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 line-clamp-2">{displayDesc}</div>
                    
                    {snap.tags && snap.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {snap.tags.map(tag => (
                          <span key={tag} className="chip !text-[11px] !px-2 !py-0.5">
                             #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="text-xs text-gray-400 uppercase">Value at Snap</span>
                      <span className="font-display text-2xl font-semibold text-gold-200">${snap.usdValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Performance Tracker</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Only showing top 4 holdings for brevity in card */}
                      {Object.entries(snap.conversions).slice(0, 4).map(([symbol, amount]) => {
                        const currentPrice = prices[symbol] || 0;
                        const currentValue = Number(amount) * currentPrice;
                        const startValue = Number(snap.usdValue);
                        const change = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;
                        const isProfit = change >= 0;

                        return (
                          <div key={symbol} className="bg-gray-900/50 rounded p-2 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-300">{symbol}</span>
                            <div className={`flex items-center text-xs font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                              {isProfit ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                              {Math.abs(change).toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      )}

      {/* View Details Modal */}
      {viewingSnap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-ink-900 w-full max-w-4xl rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            
            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative min-h-[300px] md:h-auto">
              {viewingSnap.imageUri ? (
                <img src={viewingSnap.imageUri} alt={viewingSnap.title} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-gray-600 flex flex-col items-center">
                   <Eye size={48} className="mb-2" />
                   <span>No Image Available</span>
                </div>
              )}
              <button 
                onClick={() => setViewingSnap(null)} 
                className="absolute top-4 left-4 md:hidden bg-black/50 p-2 rounded-full text-white backdrop-blur-md"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar bg-ink-900">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h2 className="text-3xl font-semibold text-white mb-1">
                     {viewingSnap.title || "Untitled Item"}
                   </h2>
                   <div className="flex items-center text-gray-400 text-sm">
                     <Calendar size={14} className="mr-1" />
                     {new Date(viewingSnap.timestamp).toLocaleDateString()} at {new Date(viewingSnap.timestamp).toLocaleTimeString()}
                   </div>
                 </div>
                 <button 
                    onClick={() => setViewingSnap(null)} 
                    className="hidden md:block text-gray-400 hover:text-white"
                 >
                    <X size={24} />
                 </button>
               </div>

               <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gold-100 to-gold-500 mb-6">
                  ${viewingSnap.usdValue.toLocaleString()} <span className="text-lg text-gray-400 font-normal">USD</span>
               </div>

               <div className="space-y-6 flex-1">
                 <div>
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                   <p className="text-gray-300 leading-relaxed">
                     {viewingSnap.title 
                        ? viewingSnap.description 
                        : (viewingSnap.description.includes(' - ') 
                            ? viewingSnap.description.split(' - ')[1] 
                            : viewingSnap.description)
                     }
                   </p>
                 </div>

                 {viewingSnap.valuationReasoning && (
                    <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-xl">
                      <div className="flex items-center text-xs font-bold text-indigo-400 uppercase mb-2">
                        <Info size={14} className="mr-1.5" /> AI Valuation Insight
                      </div>
                      <p className="text-sm text-indigo-200 leading-relaxed">{viewingSnap.valuationReasoning}</p>
                    </div>
                  )}

                 {viewingSnap.tags && viewingSnap.tags.length > 0 && (
                   <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
                     <div className="flex flex-wrap gap-2">
                       {viewingSnap.tags.map(tag => (
                         <span key={tag} className="flex items-center text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-md">
                            <Tag size={10} className="mr-1" /> {tag}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 {viewingSnap.sources && viewingSnap.sources.length > 0 && (
                   <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sources</h3>
                      <ul className="space-y-1">
                        {viewingSnap.sources.map((source, i) => (
                          <li key={i}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 hover:underline">
                              <ExternalLink size={12} className="mr-2" /> 
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                   </div>
                 )}

                 <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Asset Performance</h3>
                    <div className="grid grid-cols-1 gap-3">
                       {assets.map(({ symbol, name }) => {
                          const originalAmount = viewingSnap.conversions[symbol] || 0;
                          const currentPrice = prices[symbol] || 0;
                          const currentValue = originalAmount * currentPrice;
                          const startValue = viewingSnap.usdValue;
                          const changePct = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;
                          const isProfit = changePct >= 0;

                          return (
                            <div key={symbol} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                               <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                    {symbol}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-white">{name}</div>
                                    <div className="text-xs text-gray-500">{formatCryptoAmount(originalAmount)} {symbol}</div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="text-sm font-bold text-white">${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                  <div className={`text-xs font-bold flex items-center justify-end ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                     {isProfit ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                     {Math.abs(changePct).toFixed(2)}%
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               </div>

               <div className="mt-8 flex gap-3 pt-4 border-t border-gray-700 sticky bottom-0 bg-ink-900">
                  <button 
                    onClick={() => handleEditClick(viewingSnap)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                  >
                    <Edit2 size={18} className="mr-2" /> Edit Details
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(viewingSnap.id)}
                    className="flex-1 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-xl font-medium transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={18} className="mr-2" /> Delete
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Existing) */}
      {editingSnap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 w-full max-w-md rounded-2xl p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Snap</h2>
              <button onClick={() => setEditingSnap(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">USD Value</label>
                <input 
                  type="number" 
                  value={editUsd}
                  onChange={(e) => setEditUsd(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTags.map(tag => (
                    <span key={tag} className="flex items-center bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded text-sm border border-indigo-500/20">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-white"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button onClick={addTag} className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-lg text-sm">Add</button>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setEditingSnap(null)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}