
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
  Cpu
} from 'lucide-react';
import { geminiService } from '../services/gemini';

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
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'SETTINGS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const syncCode = localStorage.getItem('acougue_sync_code') || '';
  const controllerUrl = useMemo(() => {
    return `${window.location.origin}${window.location.pathname}?sync=${syncCode}&mode=controller`;
  }, [syncCode]);

  // Sincronização de status da chave Google em background
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

  const handleManualSync = () => {
    if (!isOnline) return;
    setIsSyncing(true);
    if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE', state);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const scanNetwork = () => {
    if (!sendRemoteCommand) return;
    setIsSearching(true);
    sendRemoteCommand('DEVICE_ANNOUNCE_REQUEST');
    setTimeout(() => setIsSearching(false), 2000);
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
      // "Ligar a IA" automaticamente se o usuário tentar usar e estiver desligada
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

  const toggleSuperOffer = (productId: string) => {
    setState(prev => {
      const isSelected = prev.superOffer.productIds.includes(productId);
      let newIds = [...prev.superOffer.productIds];
      if (isSelected) {
        newIds = newIds.filter(id => id !== productId);
      } else {
        newIds.push(productId);
      }
      return {
        ...prev,
        superOffer: {
          ...prev.superOffer,
          productIds: newIds,
          isActive: newIds.length > 0,
          discountPrices: {
            ...prev.superOffer.discountPrices,
            [productId]: prev.products.find(p => p.id === productId)?.price || 0
          }
        }
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      updatePromo(uploadTargetId, { imageUrl: event.target?.result as string });
      setUploadTargetId(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
            <Zap size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">Fabio FCell</h1>
              {/* Botão de Status IA - Clique para Ligar */}
              <button 
                onClick={handleConnectGoogle}
                className={`px-3 py-1 rounded-full flex items-center gap-2 transition-all shadow-sm ${hasGoogleKey ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'}`}
              >
                {hasGoogleKey ? <ShieldCheck size={12} /> : <Cpu size={12} />}
                <span className="text-[9px] font-black uppercase tracking-widest">{hasGoogleKey ? 'IA LIGADA' : 'LIGAR IA'}</span>
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Console de Gerenciamento</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={handleManualSync} disabled={isSyncing} className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:border-emerald-500 transition-all flex-1 md:flex-none justify-center">
            {isSyncing ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <RefreshCcw size={18} />}
            <span className="text-xs">Sincronizar</span>
          </button>
          <button onClick={onEnterControllerMode} className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 flex-1 md:flex-none justify-center"><Smartphone size={18} /> Celular</button>
          <button onClick={onEnterTvMode} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg flex-1 md:flex-none justify-center"><Tv size={18} /> Abrir TV</button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-full md:w-fit mb-8 shadow-sm overflow-x-auto">
          {[
            { id: 'PRODUCTS', label: 'Tabela Preços', icon: Package },
            { id: 'PROMOS', label: 'Ofertas TV', icon: Tag },
            { id: 'SETTINGS', label: 'Configurações', icon: Settings2 }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'PROMOS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ofertas em Destaque</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie o que aparece no painel da TV</p>
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
                        {/* BOTÃO GERAR IMAGEM IA */}
                        <button 
                          onClick={() => handleAiAction(promo.id, 'IMG', product?.name || '')}
                          disabled={loadingIds.has(`${promo.id}-IMG`)}
                          className={`absolute -bottom-2 -right-2 p-3 rounded-xl shadow-xl hover:scale-110 transition-all border-2 border-white ${hasGoogleKey ? 'bg-gradient-to-br from-indigo-600 to-blue-500 text-white' : 'bg-slate-300 text-slate-500'}`}
                          title={hasGoogleKey ? "Gerar Arte IA" : "Ligar IA primeiro"}
                        >
                          {loadingIds.has(`${promo.id}-IMG`) ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={18} />}
                        </button>
                      </div>

                      <div className="flex-grow flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${promo.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {promo.isActive ? 'No Ar' : 'Pausada'}
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
                             <label className="text-[8px] font-black text-emerald-600 uppercase block">Preço Promo R$</label>
                             <input 
                                type="number" 
                                step="0.01" 
                                value={promo.offerPrice} 
                                onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                className="bg-transparent font-black text-lg text-emerald-700 outline-none w-full"
                             />
                           </div>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frase de Marketing (TV)</label>
                          {/* BOTÃO GERAR FRASE IA */}
                          <button 
                            onClick={() => handleAiAction(promo.id, 'DESC', product?.name || '')}
                            disabled={loadingIds.has(`${promo.id}-DESC`)}
                            className={`text-[9px] font-black flex items-center gap-1.5 hover:underline transition-colors ${hasGoogleKey ? 'text-indigo-600' : 'text-slate-400'}`}
                          >
                            {loadingIds.has(`${promo.id}-DESC`) ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Gerar com IA
                          </button>
                       </div>
                       <input 
                          value={promo.description}
                          onChange={e => updatePromo(promo.id, { description: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm outline-none focus:ring-4 focus:ring-red-50 transition-all"
                          placeholder="EX: SABOR INCOMPARÁVEL PARA SEU DIA!"
                       />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`col-span-1 md:col-span-2 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden transition-all duration-700 ${hasGoogleKey ? 'bg-gradient-to-br from-indigo-700 to-blue-900' : 'bg-white border-2 border-slate-200 text-slate-800'}`}>
                <div className={`absolute top-0 right-0 p-12 opacity-10 ${hasGoogleKey ? 'text-white' : 'text-slate-300'}`}><Cloud size={140} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-8">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${hasGoogleKey ? 'bg-white text-indigo-600 shadow-2xl' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      <Cpu size={36} className={hasGoogleKey ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Google Gemini IA</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${hasGoogleKey ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${hasGoogleKey ? 'opacity-90' : 'text-slate-400'}`}>
                          {hasGoogleKey ? 'INTELIGÊNCIA ATIVADA' : 'IA DESCONECTADA'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={`text-sm font-bold mb-10 max-w-lg leading-relaxed ${hasGoogleKey ? 'opacity-80' : 'text-slate-500'}`}>
                    {hasGoogleKey 
                      ? "O sistema Fabio FCell está turbinado com IA. Suas ofertas serão criadas com a melhor tecnologia do Google."
                      : "Ligue a IA para automatizar a criação de ofertas e imagens profissionais para o seu açougue."}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handleConnectGoogle}
                      className={`px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase flex items-center gap-3 transition-all active:scale-95 shadow-2xl border-b-4 ${hasGoogleKey ? 'bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50' : 'bg-indigo-600 text-white border-indigo-900 hover:bg-indigo-700'}`}
                    >
                      <Key size={22} />
                      {hasGoogleKey ? 'Trocar Conta Google' : 'Ligar IA via Conta Google'}
                    </button>
                    {hasGoogleKey && (
                      <div className="bg-white/10 backdrop-blur-xl px-6 py-5 rounded-[1.5rem] border border-white/20 flex items-center gap-3">
                        <ShieldCheck className="text-emerald-400" size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Servidor Inteligente Ativo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 border border-red-100">
                    <Activity size={44} className="text-red-600 animate-pulse" />
                 </div>
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Servidor Fabio FCell</h4>
                 <div className="text-5xl font-black text-slate-900 tracking-tighter italic">ONLINE</div>
                 <div className="mt-6 flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
                    <Wifi size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{remoteIp}</span>
                 </div>
              </div>
            </div>

            <div className="bg-[#0f172a] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={140} /></div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
                  <div>
                    <h3 className="text-4xl font-black tracking-tighter mb-3 italic flex items-center gap-4">
                       <Radio className="text-red-500" size={40} /> Central de Terminais
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        {activeDevices.length} TELAS CONECTADAS
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={scanNetwork} disabled={isSearching} className="bg-white/5 hover:bg-white/10 px-8 py-5 rounded-2xl font-black text-xs uppercase flex items-center gap-3 border border-white/10 transition-all active:scale-95 flex-grow md:flex-grow-0 justify-center">
                      {isSearching ? <Loader2 size={22} className="animate-spin text-red-500" /> : <RefreshCcw size={22} className="text-red-500" />}
                      Escanear Rede
                    </button>
                    <button onClick={() => handleToggleTvMode(sendRemoteCommand)} className="bg-red-600 hover:bg-red-700 px-10 py-5 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-[0_10px_40px_rgba(220,38,38,0.4)] transition-all active:scale-95 flex-grow md:flex-grow-0 justify-center border-b-8 border-red-950">
                      <Tv size={22} /> Ativar Tudo
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {activeDevices.length > 0 ? activeDevices.map((device, i) => (
                    <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col gap-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex justify-between items-start">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${device.mode === 'TV' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'}`}>
                          {device.mode === 'TV' ? <Tv size={32} /> : <Smartphone size={32} />}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20">
                           <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                           {device.status || 'CONECTADO'}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black uppercase tracking-tight italic">{device.mode === 'TV' ? 'TV Mídia' : 'Celular Gerente'}</p>
                          <ChevronRight size={16} className="text-white/20" />
                        </div>
                        <p className="text-[10px] font-mono text-white/40 mt-2 uppercase tracking-tighter">ID: {device.id} • IP: {device.ip}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-10 border-4 border-dashed border-white/10 rounded-[4rem]">
                      <Radio size={100} className="mb-8" />
                      <p className="text-2xl font-black uppercase tracking-[0.5em]">Buscando Terminais...</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-sm">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-4 uppercase italic"><Smartphone className="text-red-600" size={28} /> Controle Mobile</h3>
                  <div className="flex flex-col items-center gap-8 p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="p-6 bg-white rounded-[2rem] shadow-2xl">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(controllerUrl)}`} className="w-48 h-48" alt="Sync QR" />
                    </div>
                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-widest text-center">Transforme seu celular em controle remoto</p>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 border border-slate-100">
                    <Link2 size={32} className="text-slate-400" />
                  </div>
                  <h4 className="font-black text-slate-400 uppercase tracking-[0.4em] text-[11px] mb-4 italic">Global Sync ID</h4>
                  <div className="text-8xl font-black text-slate-900 tracking-tighter mb-10 drop-shadow-xl">{syncCode}</div>
                  <button onClick={() => { if(confirm("Redefinir o código global?")) { localStorage.removeItem('acougue_sync_code'); window.location.reload(); } }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl">
                      <RefreshCcw size={18} /> Novo Código de Sincronização
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* LISTA DE PRODUTOS */}
        {activeTab === 'PRODUCTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="relative w-full md:w-[450px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Pesquisar estoque..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-3xl pl-14 pr-10 py-4 font-bold text-base outline-none shadow-sm focus:ring-4 focus:ring-red-50" />
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
                          onClick={() => toggleSuperOffer(p.id)} 
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
      </main>
    </div>
  );
};

const handleToggleTvMode = (sendRemoteCommand: any, targetId?: string, forceMode?: 'TV' | 'ADMIN') => {
    if (sendRemoteCommand) {
        sendRemoteCommand('SET_MODE', { 
            targetId, 
            mode: forceMode || 'TV' 
        });
    }
};

export default AdminPanel;
