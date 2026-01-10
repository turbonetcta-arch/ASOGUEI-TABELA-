
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Sparkles, Loader2, 
  Package, Tag, Settings2, Key, 
  MonitorPlay, Wand2, FileUp, 
  Star, RefreshCcw, Search, Power, Zap, BrainCircuit,
  Lightbulb, ImageIcon, Eraser, Bomb, ChevronRight, Globe, Radar, Bot
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from '../constants';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onEnterTvMode: () => void;
  onEnterControllerMode: () => void;
  sendRemoteCommand?: (command: string, payload?: any) => void;
  activeDevices?: any[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, sendRemoteCommand }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'AI_BRAIN' | 'SETTINGS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [aiThinking, setAiThinking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const syncCode = localStorage.getItem('acougue_sync_code') || '0000';
  const controllerUrl = useMemo(() => {
    return `${window.location.origin}${window.location.pathname}?sync=${syncCode}&mode=controller`;
  }, [syncCode]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const active = await window.aistudio.hasSelectedApiKey();
        setHasGoogleKey(active);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectGoogle = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasGoogleKey(true);
    }
  };

  const handleAiAutoPilot = async () => {
    if (!hasGoogleKey) {
      handleConnectGoogle();
      return;
    }
    setAiThinking(true);
    try {
      const shuffled = [...state.products].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2);
      
      const newPromos: Promotion[] = await Promise.all(selected.map(async (p) => {
        const desc = await geminiService.generateCatchyDescription(p.name);
        const img = await geminiService.generateProductImage(p.name, false, "16:9");
        return {
          id: `ai-${Date.now()}-${p.id}`,
          productId: p.id,
          offerPrice: Math.floor(p.price * 0.8),
          imageUrl: img || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
          description: desc,
          isActive: true
        };
      }));

      setState(prev => ({
        ...prev,
        promotions: [...newPromos, ...prev.promotions].slice(0, 10)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiThinking(false);
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const updatePromo = (id: string, updates: Partial<Promotion>) => {
    setState(prev => ({
      ...prev,
      promotions: prev.promotions.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const addPromo = () => {
    if (state.products.length === 0) {
      alert("Adicione produtos primeiro!");
      setActiveTab('PRODUCTS');
      return;
    }
    const id = Date.now().toString();
    const firstProduct = state.products[0];
    setState(prev => ({
      ...prev,
      promotions: [{
        id,
        productId: firstProduct.id,
        offerPrice: firstProduct.price * 0.9,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        description: 'QUALIDADE PREMIUM PARA VOCÊ!',
        isActive: true
      }, ...prev.promotions]
    }));
  };

  const handleAiAction = async (promoId: string, type: 'DESC' | 'IMG', productName: string) => {
    if (!hasGoogleKey) {
      await handleConnectGoogle();
      return;
    }
    const key = `${promoId}-${type}`;
    setLoadingIds(prev => new Set(prev).add(key));
    try {
      if (type === 'DESC') {
        const desc = await geminiService.generateCatchyDescription(productName);
        updatePromo(promoId, { description: desc });
      } else {
        const img = await geminiService.generateProductImage(productName, true, "16:9");
        if (img) updatePromo(promoId, { imageUrl: img });
      }
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTargetId) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          updatePromo(uploadTargetId, { imageUrl: event.target?.result as string });
          setUploadTargetId(null);
        };
        reader.readAsDataURL(file);
      }} />
      
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight uppercase leading-none text-slate-900">{state.storeName}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Painel Administrativo v3.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onEnterTvMode} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
            <Tv size={18} /> Transmitir
          </button>
        </div>
      </header>

      <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
        <nav className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 mb-8 shadow-sm w-fit overflow-x-auto">
          {[
            { id: 'AI_BRAIN', label: 'Cérebro IA', icon: BrainCircuit, color: 'text-indigo-600' },
            { id: 'PRODUCTS', label: 'Estoque & Preços', icon: Package, color: 'text-slate-600' },
            { id: 'PROMOS', label: 'Promoções', icon: Tag, color: 'text-slate-600' },
            { id: 'SETTINGS', label: 'Configurações', icon: Settings2, color: 'text-slate-600' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'AI_BRAIN' && (
          <div className="animate-in zoom-in duration-500 space-y-8">
            <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all duration-700 ${hasGoogleKey ? 'bg-gradient-to-br from-indigo-700 to-indigo-950' : 'bg-slate-800'}`}>
               <div className="absolute -top-10 -right-10 p-20 opacity-10 rotate-12"><BrainCircuit size={300} /></div>
               <div className="relative z-10 max-w-3xl">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${hasGoogleKey ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                    {hasGoogleKey ? 'SISTEMA NEURAL CONECTADO' : 'CÉREBRO DESATIVADO'}
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.9] mb-6">
                    {hasGoogleKey ? 'A Inteligência Criando Ofertas' : 'Potencialize suas Vendas com IA'}
                  </h2>
                  <p className="text-xl opacity-70 font-medium mb-10 leading-relaxed max-w-2xl">
                    Com o Gemini, seu açougue cria fotos profissionais, frases de impacto e ofertas inteligentes automaticamente.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {!hasGoogleKey ? (
                      <button onClick={handleConnectGoogle} className="bg-white text-indigo-700 px-10 py-5 rounded-3xl font-black text-sm uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-2xl">
                        <Key size={24} /> Conectar com Google
                      </button>
                    ) : (
                      <button onClick={handleAiAutoPilot} disabled={aiThinking} className="bg-emerald-500 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-xl border-b-4 border-emerald-700">
                        {aiThinking ? <Loader2 size={24} className="animate-spin" /> : <Bot size={24} />}
                        Gerar Ofertas Inteligentes
                      </button>
                    )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { title: 'Copywriting IA', icon: Lightbulb, desc: 'Frases curtas e persuasivas que aumentam o apetite dos clientes.', color: 'bg-amber-500' },
                 { title: 'Estúdio Virtual', icon: ImageIcon, desc: 'Fotos realistas de carnes frescas com iluminação profissional.', color: 'bg-blue-500' },
                 { title: 'Automação', icon: Zap, desc: 'Sincronização instantânea com todas as TVs da loja.', color: 'bg-red-500' }
               ].map((feat, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className={`w-14 h-14 ${feat.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <feat.icon size={28} />
                    </div>
                    <h3 className="font-black text-lg uppercase mb-2 tracking-tight text-slate-800">{feat.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'PROMOS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel de Ofertas</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie o que aparece no lado direito da TV</p>
              </div>
              <button onClick={addPromo} className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase flex items-center gap-2 shadow-xl shadow-red-100 transition-all w-full md:w-auto justify-center active:scale-95">
                <Plus size={22} /> Nova Promoção
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {state.promotions.map((promo) => {
                const product = state.products.find(p => p.id === promo.productId);
                const isLoadingImg = loadingIds.has(`${promo.id}-IMG`);
                const isLoadingDesc = loadingIds.has(`${promo.id}-DESC`);

                return (
                  <div key={promo.id} className={`bg-white rounded-[3rem] border-2 p-8 flex flex-col gap-8 shadow-sm transition-all ${promo.isActive ? 'border-emerald-100' : 'border-slate-100 opacity-80'}`}>
                    <div className="flex gap-6">
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-[2rem] bg-slate-50 overflow-hidden border-4 border-white shadow-xl relative">
                          {isLoadingImg ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                               <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                          ) : (
                            <img src={promo.imageUrl} className="w-full h-full object-cover" alt="Promo" />
                          )}
                          <button 
                            onClick={() => { setUploadTargetId(promo.id); fileInputRef.current?.click(); }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"
                          >
                            <FileUp size={24} />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleAiAction(promo.id, 'IMG', product?.name || '')}
                          disabled={isLoadingImg}
                          className={`absolute -bottom-3 -right-3 p-4 rounded-2xl shadow-2xl transition-all border-4 border-white ${hasGoogleKey ? 'bg-indigo-600 text-white hover:scale-110' : 'bg-slate-200 text-slate-400'}`}
                          title="Gerar Foto com IA"
                        >
                          <ImageIcon size={20} />
                        </button>
                      </div>

                      <div className="flex-grow flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${promo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {promo.isActive ? 'Em Exibição' : 'Pausada'}
                          </span>
                          <button onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(p => p.id !== promo.id)}))} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                        
                        <select 
                          value={promo.productId} 
                          onChange={e => updatePromo(promo.id, { productId: e.target.value })}
                          className="bg-slate-50 px-5 py-3 rounded-2xl font-black text-xs outline-none border border-slate-100 text-slate-700"
                        >
                          {state.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-3">
                           <div className="bg-red-50 flex-grow px-5 py-3 rounded-2xl border border-red-100">
                             <label className="text-[9px] font-black text-red-400 uppercase block mb-1">Preço Promo R$</label>
                             <input 
                                type="number" 
                                step="0.01" 
                                value={promo.offerPrice} 
                                onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                className="bg-transparent font-black text-xl text-red-600 outline-none w-full"
                             />
                           </div>
                           <button 
                            onClick={() => sendRemoteCommand?.('SHOW_FULL_PROMO', { promoId: promo.id })}
                            className="p-5 rounded-2xl bg-slate-900 text-white hover:bg-red-600 transition-all shadow-lg active:scale-95"
                            title="Destacar na TV Agora"
                           >
                             <MonitorPlay size={20} />
                           </button>
                           <button 
                            onClick={() => updatePromo(promo.id, { isActive: !promo.isActive })}
                            className={`p-5 rounded-2xl transition-all ${promo.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                           >
                             <Power size={20} />
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto de Apoio (IA)</label>
                          <button 
                            onClick={() => handleAiAction(promo.id, 'DESC', product?.name || '')}
                            disabled={isLoadingDesc}
                            className={`text-[10px] font-black flex items-center gap-2 hover:underline transition-colors ${hasGoogleKey ? 'text-indigo-600' : 'text-slate-400'}`}
                          >
                            {isLoadingDesc ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Gerar Texto IA
                          </button>
                       </div>
                       <input 
                          value={promo.description}
                          onChange={e => updatePromo(promo.id, { description: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-red-50 transition-all placeholder:text-slate-300"
                          placeholder="EX: A MELHOR PICANHA PARA SEU CHURRASCO!"
                       />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'PRODUCTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
              <div className="relative w-full md:w-[500px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                <input 
                  type="text" 
                  placeholder="Pesquisar no catálogo..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-lg outline-none shadow-sm focus:ring-4 focus:ring-red-50 transition-all" 
                />
              </div>
              <button 
                onClick={() => setState(prev => ({ ...prev, products: [{ id: Date.now().toString(), name: 'NOVO ITEM', price: 0, unit: 'KG' }, ...prev.products] }))} 
                className="bg-red-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase flex items-center gap-3 shadow-xl hover:scale-105 transition-all w-full md:w-auto justify-center"
              >
                <Plus size={24} /> Adicionar Corte
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                const isSuper = state.superOffer.productIds.includes(p.id);
                return (
                  <div key={p.id} className={`bg-white p-8 rounded-[3rem] border-2 transition-all group relative ${isSuper ? 'border-yellow-400 shadow-yellow-100 shadow-2xl' : 'border-slate-100 shadow-sm'}`}>
                    {isSuper && (
                      <div className="absolute -top-3 -right-3 bg-yellow-400 text-black px-4 py-1 rounded-full text-[9px] font-black uppercase shadow-lg border-2 border-white flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Oferta do Dia
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-grow pr-4">
                        <input 
                          value={p.name} 
                          onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} 
                          className="w-full font-black text-slate-800 text-xl uppercase outline-none bg-transparent placeholder:text-slate-200"
                          placeholder="NOME DO CORTE"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setState(prev => {
                              const isSelected = prev.superOffer.productIds.includes(p.id);
                              let newIds = [...prev.superOffer.productIds];
                              if (isSelected) {
                                newIds = newIds.filter(id => id !== p.id);
                              } else {
                                newIds.push(p.id);
                              }
                              return {
                                ...prev,
                                superOffer: {
                                  ...prev.superOffer,
                                  productIds: newIds,
                                  isActive: newIds.length > 0,
                                  discountPrices: {
                                    ...prev.superOffer.discountPrices,
                                    [p.id]: prev.products.find(item => item.id === p.id)?.price || 0
                                  }
                                }
                              };
                            });
                          }} 
                          className={`p-3 rounded-2xl transition-all ${isSuper ? 'bg-yellow-400 text-black' : 'bg-slate-50 text-slate-300 hover:text-yellow-500'}`}
                        >
                          <Star size={20} fill={isSuper ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-3 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-grow bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 group-hover:border-red-100 transition-colors">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Preço KG R$</label>
                        <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent outline-none font-mono font-black text-2xl text-slate-700" />
                      </div>
                      <div className="w-24 bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 flex flex-col items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Unid</label>
                          <select value={p.unit} onChange={e => updateProduct(p.id, { unit: e.target.value })} className="bg-transparent font-black text-sm outline-none cursor-pointer text-slate-600">
                              {['KG', 'UN', 'PC', 'BD'].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-2xl mb-10 flex items-center gap-4 uppercase italic"><Globe className="text-red-600" size={32} /> Identidade Visual</h3>
                  <div className="bg-slate-50 p-8 rounded-[2rem] mb-10 border border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nome do Estabelecimento</label>
                     <input value={state.storeName} onChange={e => setState(prev => ({...prev, storeName: e.target.value.toUpperCase()}))} className="w-full bg-transparent outline-none font-black text-3xl text-slate-800 uppercase" />
                  </div>
                  <div className="flex flex-col items-center gap-8 p-10 bg-[#FAFAFA] rounded-[3rem] border-4 border-dashed border-slate-200">
                    <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl transform hover:rotate-2 transition-transform">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(controllerUrl)}`} className="w-48 h-48" alt="Sync QR" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Controle via Smartphone</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Aponte a câmera para parear o controle remoto</p>
                    </div>
                  </div>
               </div>

               <div className="bg-[#0F172A] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-12 opacity-5"><Zap size={200} /></div>
                  <div className="mb-12">
                    <div className="w-20 h-20 bg-white/10 rounded-[1.8rem] flex items-center justify-center mb-6 border border-white/5">
                      <Radar size={40} className="text-white animate-pulse" />
                    </div>
                    <h4 className="font-black text-white/40 uppercase tracking-[0.4em] text-xs mb-4 italic">Sistema de Sincronização</h4>
                    <div className="text-9xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">{syncCode}</div>
                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest">ID Global de Acesso Único</p>
                  </div>
                  <button onClick={() => { if(confirm("Deseja redefinir o ID global?")) { localStorage.removeItem('acougue_sync_code'); window.location.reload(); } }} className="mt-auto w-full bg-red-600 text-white py-6 rounded-3xl font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl border-b-4 border-red-900 active:scale-95">
                      <RefreshCcw size={22} /> Gerar Novo ID de Sincronização
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center text-red-600 shadow-inner">
                    <Bomb size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl uppercase italic text-slate-800">Manutenção do Banco de Dados</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Operações críticas e restauração</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => { if(confirm("Apagar todos os itens e ofertas?")) setState(prev => ({...prev, products: [], promotions: []})); }}
                    className="flex items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 text-slate-600 px-10 py-6 rounded-[2rem] font-black uppercase text-xs border-2 border-slate-200 transition-all active:scale-95"
                  >
                    <Eraser size={24} /> Limpar Todas as Listas
                  </button>
                  <button 
                    onClick={() => { if(confirm("Restaurar dados de demonstração?")) setState(prev => ({...prev, products: INITIAL_PRODUCTS, promotions: INITIAL_PROMOTIONS})); }}
                    className="flex items-center justify-center gap-4 bg-red-50 hover:bg-red-100 text-red-600 px-10 py-6 rounded-[2rem] font-black uppercase text-xs border-2 border-red-200 transition-all active:scale-95"
                  >
                    <RefreshCcw size={24} /> Restaurar Fábrica (Demo)
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-12 text-center">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] italic">Media Indoor Zero Engine • Fabio FCell</p>
      </footer>
    </div>
  );
};

export default AdminPanel;
