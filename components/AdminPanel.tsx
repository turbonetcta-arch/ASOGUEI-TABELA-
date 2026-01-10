
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Sparkles, Loader2, 
  Package, Tag, Settings2, CheckCircle2, Key, 
  Smartphone, Download, Wand2, FileUp, AlertCircle,
  RotateCcw, RotateCw, Monitor, Search, X, MonitorPlay,
  ChevronDown, ChevronUp, MousePointerSquareDashed, Star,
  Link2, RefreshCcw, Home, ArrowUp, ArrowDown, Layout,
  QrCode, ChevronLast, ChevronFirst, Wifi, Activity,
  Power, Send, Server, Globe, Radio, Zap, MonitorOff,
  Image as ImageIcon, Type, Cloud, ShieldCheck, ChevronRight,
  Cpu, Radar, BrainCircuit, Bot, Lightbulb, Languages,
  Eraser, Bomb
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from '../constants';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onEnterTvMode: () => void;
  onEnterControllerMode: () => void;
  isOnline?: boolean;
  sendRemoteCommand?: (command: string, payload?: any) => void;
  remoteIp?: string;
  activeDevices?: any[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode, isOnline, sendRemoteCommand, remoteIp, activeDevices = [] }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'AI_BRAIN' | 'SETTINGS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [aiThinking, setAiThinking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const syncCode = localStorage.getItem('acougue_sync_code') || '';
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
      const selected = shuffled.slice(0, 3);
      
      const newPromos: Promotion[] = await Promise.all(selected.map(async (p) => {
        const desc = await geminiService.generateCatchyDescription(p.name);
        return {
          id: `ai-${Date.now()}-${p.id}`,
          productId: p.id,
          offerPrice: p.price * 0.85,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
          description: desc.toUpperCase(),
          isActive: true
        };
      }));

      setState(prev => ({
        ...prev,
        promotions: [...newPromos, ...prev.promotions].slice(0, 10)
      }));
      
      alert("CÉREBRO IA: Novas ofertas geradas com sucesso!");
    } catch (e) {
      console.error(e);
    } finally {
      setAiThinking(false);
    }
  };

  const scanNetwork = () => {
    if (!sendRemoteCommand) return;
    setIsSearching(true);
    sendRemoteCommand('DEVICE_ANNOUNCE_REQUEST');
    setTimeout(() => setIsSearching(false), 3000);
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
      if (confirm("IA DESLIGADA. Deseja ligar agora conectando sua Conta Google?")) {
        await handleConnectGoogle();
      }
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

  const clearAllData = () => {
    if (confirm("ATENÇÃO: Isso apagará TODOS os produtos e promoções. Deseja continuar?")) {
      setState(prev => ({
        ...prev,
        products: [],
        promotions: [],
        superOffer: { productIds: [], discountPrices: {}, isActive: false }
      }));
      if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE');
    }
  };

  const factoryReset = () => {
    if (confirm("Deseja restaurar as configurações e dados originais de fábrica?")) {
      setState(prev => ({
        ...prev,
        products: INITIAL_PRODUCTS,
        promotions: INITIAL_PROMOTIONS,
        superOffer: { productIds: [], discountPrices: {}, isActive: false }
      }));
      if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-1000 ${hasGoogleKey ? 'bg-indigo-50/30' : 'bg-slate-50'}`}>
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
      
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 ${hasGoogleKey ? 'bg-indigo-600 shadow-indigo-200' : 'bg-red-600 shadow-red-200'}`}>
            {hasGoogleKey ? <BrainCircuit size={24} className="animate-pulse" /> : <Zap size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl tracking-tight uppercase leading-none">Fabio FCell</h1>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${hasGoogleKey ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasGoogleKey ? 'bg-indigo-500 animate-ping' : 'bg-slate-300'}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter">{hasGoogleKey ? 'IA ONLINE' : 'IA OFF'}</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Console de Comando</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('AI_BRAIN')} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border-2 flex-1 md:flex-none justify-center ${hasGoogleKey ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-400'}`}>
            <BrainCircuit size={18} />
            <span className="text-xs">Cérebro IA</span>
          </button>
          <button onClick={scanNetwork} disabled={isSearching} className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:border-red-500 transition-all flex-1 md:flex-none justify-center">
            {isSearching ? <Radar size={18} className="animate-spin text-red-500" /> : <Radar size={18} className="text-red-500" />}
            <span className="text-xs">Rede</span>
          </button>
          <button onClick={onEnterTvMode} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg flex-1 md:flex-none justify-center"><Tv size={18} /> TV</button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-full md:w-fit mb-8 shadow-sm overflow-x-auto">
          {[
            { id: 'AI_BRAIN', label: 'Cérebro IA', icon: BrainCircuit, color: 'text-indigo-600' },
            { id: 'PRODUCTS', label: 'Preços', icon: Package, color: 'text-slate-600' },
            { id: 'PROMOS', label: 'Ofertas', icon: Tag, color: 'text-slate-600' },
            { id: 'SETTINGS', label: 'Ajustes', icon: Settings2, color: 'text-slate-600' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === tab.id ? (tab.id === 'AI_BRAIN' ? 'bg-indigo-600 text-white shadow-md' : 'bg-red-600 text-white shadow-md') : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'AI_BRAIN' && (
          <div className="animate-in zoom-in duration-500 space-y-8">
            <div className={`rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl transition-all duration-700 ${hasGoogleKey ? 'bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-950' : 'bg-slate-800'}`}>
               <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><BrainCircuit size={200} /></div>
               
               <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${hasGoogleKey ? 'bg-white/10 border-white/20 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                      {hasGoogleKey ? 'SISTEMA NEURAL ATIVO' : 'SISTEMA DESLIGADO'}
                    </div>
                  </div>

                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none mb-6">
                    {hasGoogleKey ? 'A Inteligência está no Comando' : 'Ative o Cérebro do seu Açougue'}
                  </h2>

                  <p className="text-lg opacity-70 font-medium mb-10 leading-relaxed">
                    Com o modo IA ativado, o Fabio FCell cria ofertas, gera imagens profissionais e escreve frases de impacto automaticamente para suas TVs.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {!hasGoogleKey ? (
                      <button onClick={handleConnectGoogle} className="bg-white text-indigo-700 px-10 py-5 rounded-3xl font-black text-sm uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-xl">
                        <Key size={24} /> Ligar Cérebro IA
                      </button>
                    ) : (
                      <>
                        <button onClick={handleAiAutoPilot} disabled={aiThinking} className="bg-emerald-500 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-xl border-b-4 border-emerald-700">
                          {aiThinking ? <Loader2 size={24} className="animate-spin" /> : <Bot size={24} />}
                          Piloto Automático de Ofertas
                        </button>
                        <button onClick={handleConnectGoogle} className="bg-white/10 backdrop-blur-md text-white px-8 py-5 rounded-3xl font-black text-xs uppercase flex items-center gap-3 border border-white/20 hover:bg-white/20 transition-all">
                          Configurar Chave
                        </button>
                      </>
                    )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { title: 'Frases Criativas', icon: Lightbulb, desc: 'A IA escreve textos que vendem mais para cada corte.', color: 'bg-amber-500' },
                 { title: 'Fotos Realistas', icon: ImageIcon, desc: 'Geração de imagens de carnes suculentas em 4K.', color: 'bg-blue-500' },
                 { title: 'Smart Pricing', icon: Tag, desc: 'Sugestão de preços baseada em categorias e margens.', color: 'bg-emerald-500' }
               ].map((feat, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className={`w-14 h-14 ${feat.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <feat.icon size={28} />
                    </div>
                    <h3 className="font-black text-lg uppercase mb-2 tracking-tight">{feat.title}</h3>
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
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ofertas em Destaque</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">O que está aparecendo na TV</p>
              </div>
              <button onClick={addPromo} className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase flex items-center gap-2 shadow-xl shadow-red-200 active:scale-95 transition-all w-full md:w-auto justify-center">
                <Plus size={22} /> Nova Promoção
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.promotions.map((promo) => {
                const product = state.products.find(p => p.id === promo.productId);
                return (
                  <div key={promo.id} className={`bg-white rounded-[2.5rem] border-2 p-6 flex flex-col gap-6 shadow-sm transition-all ${promo.isActive ? 'border-emerald-100' : 'border-slate-100 opacity-80'}`}>
                    <div className="flex gap-5">
                      <div className="relative group flex-shrink-0">
                        <div className="w-32 h-32 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-lg relative">
                          <img src={promo.imageUrl} className="w-full h-full object-cover" alt="Promo" />
                          <button 
                            onClick={() => { setUploadTargetId(promo.id); fileInputRef.current?.click(); }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"
                          >
                            <FileUp size={24} />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleAiAction(promo.id, 'IMG', product?.name || '')}
                          disabled={loadingIds.has(`${promo.id}-IMG`)}
                          className={`absolute -bottom-2 -right-2 p-3 rounded-xl shadow-xl hover:scale-110 transition-all border-2 border-white ${hasGoogleKey ? 'bg-gradient-to-br from-indigo-600 to-blue-500 text-white' : 'bg-slate-300 text-slate-500'}`}
                        >
                          {loadingIds.has(`${promo.id}-IMG`) ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={18} />}
                        </button>
                      </div>

                      <div className="flex-grow flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${promo.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {promo.isActive ? 'Ativa' : 'Pausada'}
                          </span>
                          <button onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(p => p.id !== promo.id)}))} className="text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <select 
                          value={promo.productId} 
                          onChange={e => updatePromo(promo.id, { productId: e.target.value })}
                          className="bg-slate-50 px-4 py-2.5 rounded-2xl font-black text-xs outline-none border border-slate-100"
                        >
                          {state.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2">
                           <div className="bg-emerald-50 flex-grow px-4 py-2 rounded-2xl border border-emerald-100">
                             <label className="text-[8px] font-black text-emerald-600 uppercase block">Oferta R$</label>
                             <input 
                                type="number" 
                                step="0.01" 
                                value={promo.offerPrice} 
                                onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                className="bg-transparent font-black text-lg text-emerald-700 outline-none w-full"
                             />
                           </div>
                           <button 
                            onClick={() => sendRemoteCommand?.('SHOW_FULL_PROMO', { promoId: promo.id })}
                            className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
                            title="Transmitir para TV"
                           >
                             <MonitorPlay size={20} />
                           </button>
                           <button 
                            onClick={() => updatePromo(promo.id, { isActive: !promo.isActive })}
                            className={`p-4 rounded-2xl transition-all ${promo.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}
                           >
                             <Power size={20} />
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto da Oferta</label>
                          <button 
                            onClick={() => handleAiAction(promo.id, 'DESC', product?.name || '')}
                            disabled={loadingIds.has(`${promo.id}-DESC`)}
                            className={`text-[9px] font-black flex items-center gap-1.5 hover:underline transition-colors ${hasGoogleKey ? 'text-indigo-600' : 'text-slate-400'}`}
                          >
                            {loadingIds.has(`${promo.id}-DESC`) ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Gerar IA
                          </button>
                       </div>
                       <input 
                          value={promo.description}
                          onChange={e => updatePromo(promo.id, { description: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm outline-none focus:ring-4 focus:ring-red-50 transition-all"
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="relative w-full md:w-[450px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Buscar no estoque..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-3xl pl-14 pr-10 py-4 font-bold text-base outline-none shadow-sm focus:ring-4 focus:ring-red-50" />
              </div>
              <button onClick={() => setState(prev => ({ ...prev, products: [{ id: Date.now().toString(), name: 'NOVO ITEM', price: 0, unit: 'KG', category: 'Geral' }, ...prev.products] }))} className="bg-red-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase flex items-center gap-3 shadow-xl shadow-red-200 active:scale-95 transition-all w-full md:w-auto justify-center"><Plus size={22} /> Adicionar Item</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {state.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                const isSuper = state.superOffer.productIds.includes(p.id);
                return (
                  <div key={p.id} className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all group ${isSuper ? 'border-yellow-400 shadow-yellow-100 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-grow">
                        <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} className="w-full font-black text-slate-800 text-base uppercase outline-none bg-transparent" />
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
                          className={`p-2 rounded-xl transition-all ${isSuper ? 'bg-yellow-400 text-black' : 'bg-slate-50 text-slate-200'}`}
                        >
                          <Star size={18} fill={isSuper ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-grow bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Preço R$</label>
                        <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent outline-none font-mono font-black text-xl text-slate-700" />
                      </div>
                      <div className="w-24 bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Unid</label>
                          <select value={p.unit} onChange={e => updateProduct(p.id, { unit: e.target.value })} className="bg-transparent font-black text-sm outline-none cursor-pointer">
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
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-sm">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-4 uppercase italic"><Globe className="text-red-600" size={28} /> Sincronização Cloud</h3>
                  <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Nome da Loja</label>
                     <input value={state.storeName} onChange={e => setState(prev => ({...prev, storeName: e.target.value.toUpperCase()}))} className="w-full bg-transparent outline-none font-black text-2xl text-slate-800 uppercase" />
                  </div>
                  <div className="flex flex-col items-center gap-8 p-10 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="p-4 bg-white rounded-[2rem] shadow-2xl">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(controllerUrl)}`} className="w-48 h-48" alt="Sync QR" />
                    </div>
                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-widest text-center">Controle seu açougue pelo celular</p>
                  </div>
               </div>

               <div className="bg-[#0f172a] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={140} /></div>
                  <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/5">
                    <Link2 size={32} className="text-white/40" />
                  </div>
                  <h4 className="font-black text-white/40 uppercase tracking-[0.4em] text-[11px] mb-4 italic">Global Sync ID</h4>
                  <div className="text-8xl font-black text-white tracking-tighter mb-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{syncCode}</div>
                  <button onClick={() => { if(confirm("Redefinir o código global?")) { localStorage.removeItem('acougue_sync_code'); window.location.reload(); } }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl border-b-4 border-red-900">
                      <RefreshCcw size={18} /> Gerar Novo Código de Sincronização
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-sm space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <Bomb size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase italic">Limpeza de Dados</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cuidado: Estas ações são permanentes</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={clearAllData}
                    className="flex items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-600 px-8 py-5 rounded-[2rem] font-black uppercase text-xs border-2 border-slate-200 transition-all active:scale-95"
                  >
                    <Eraser size={20} /> Apagar Tudo (Limpar Listas)
                  </button>
                  <button 
                    onClick={factoryReset}
                    className="flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 px-8 py-5 rounded-[2rem] font-black uppercase text-xs border-2 border-red-200 transition-all active:scale-95"
                  >
                    <RefreshCcw size={20} /> Reset de Fábrica (Dados Demo)
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
