
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
  Power, Send, Server, Globe, Radio
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

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode, isOnline, sendRemoteCommand, remoteIp, activeDevices = [] }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'SETTINGS'>('PRODUCTS');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  const promosStartRef = useRef<HTMLDivElement>(null);
  const promosEndRef = useRef<HTMLDivElement>(null);
  const [activePromoUploadId, setActivePromoUploadId] = useState<string | null>(null);

  const syncCode = localStorage.getItem('acougue_sync_code') || '';
  const controllerUrl = useMemo(() => {
    return `${window.location.origin}${window.location.pathname}?sync=${syncCode}&mode=controller`;
  }, [syncCode]);

  useEffect(() => {
    setSaveStatus('SAVING');
    const timer = setTimeout(() => setSaveStatus('SAVED'), 600);
    return () => clearTimeout(timer);
  }, [state]);

  const handleManualSync = () => {
    if (!isOnline) {
        alert("Você está offline.");
        return;
    }
    setIsSyncing(true);
    if (sendRemoteCommand) {
        sendRemoteCommand('FORCE_UPDATE', state);
    }
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const scanNetwork = () => {
    setIsSearching(true);
    if (sendRemoteCommand) {
      sendRemoteCommand('DEVICE_ANNOUNCE_REQUEST');
    }
    setTimeout(() => setIsSearching(false), 3000);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return state.products;
    const term = searchTerm.toLowerCase();
    return state.products.filter(p => p.name.toLowerCase().includes(term));
  }, [state.products, searchTerm]);

  const scrollToBottom = () => promosEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToTop = () => promosStartRef.current?.scrollIntoView({ behavior: 'smooth' });

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_acougue_${new Date().toLocaleDateString()}.json`);
    linkElement.click();
  };

  const generateNewSyncCode = () => {
    if (confirm("Isso desconectará outros dispositivos. Deseja continuar?")) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('acougue_sync_code', newCode);
      window.location.reload();
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

  const movePromo = (index: number, direction: 'UP' | 'DOWN') => {
    const newPromos = [...state.promotions];
    if (direction === 'UP' && index > 0) {
      [newPromos[index], newPromos[index - 1]] = [newPromos[index - 1], newPromos[index]];
    } else if (direction === 'DOWN' && index < newPromos.length - 1) {
      [newPromos[index], newPromos[index + 1]] = [newPromos[index + 1], newPromos[index]];
    }
    setState(prev => ({ ...prev, promotions: newPromos }));
  };

  const toggleSuperOfferProduct = (product: Product, discountPercent: number) => {
    setState(prev => {
      const isSelected = prev.superOffer.productIds.includes(product.id);
      let newIds = [...prev.superOffer.productIds];
      let newPrices = { ...prev.superOffer.discountPrices };

      if (isSelected) {
        newIds = newIds.filter(id => id !== product.id);
        delete newPrices[product.id];
      } else {
        newIds.push(product.id);
        newPrices[product.id] = parseFloat((product.price * (1 - discountPercent / 100)).toFixed(2));
      }

      return {
        ...prev,
        superOffer: {
          productIds: newIds,
          discountPrices: newPrices,
          isActive: newIds.length > 0
        }
      };
    });
  };

  const handleManualImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activePromoUploadId) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updatePromo(activePromoUploadId, { imageUrl: e.target?.result as string });
      setActivePromoUploadId(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerManualUpload = (promoId: string) => {
    setActivePromoUploadId(promoId);
    promoFileInputRef.current?.click();
  };

  const addProduct = () => {
    const id = Date.now().toString();
    setState(prev => ({ ...prev, products: [{ id, name: 'NOVA CARNE', price: 0, unit: 'KG', category: 'Geral' }, ...prev.products] }));
  };

  const addPromo = () => {
    if (state.products.length === 0) { setActiveTab('PRODUCTS'); return; }
    const id = Date.now().toString();
    const firstProduct = state.products[0];
    setState(prev => ({ ...prev, promotions: [{ id, productId: firstProduct.id, offerPrice: firstProduct.price * 0.9, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', description: `OFERTA: ${firstProduct.name}!`, isActive: true }, ...prev.promotions] }));
  };

  const handleAiAction = async (promoId: string, type: 'DESC' | 'IMG_1_1' | 'IMG_16_9', productName: string) => {
    const loadingKey = `${promoId}-${type}`;
    setLoadingIds(prev => new Set(prev).add(loadingKey));
    try {
      if (type === 'DESC') {
        const desc = await geminiService.generateCatchyDescription(productName);
        updatePromo(promoId, { description: desc });
      } else {
        const img = await geminiService.generateProductImage(productName, false, type === 'IMG_16_9' ? '16:9' : '1:1');
        if (img) updatePromo(promoId, { imageUrl: img });
      }
    } catch (e) {} finally {
      setLoadingIds(prev => { const next = new Set(prev); next.delete(loadingKey); return next; });
    }
  };

  const handleRemoteSetTv = () => {
    if (sendRemoteCommand) {
        sendRemoteCommand('SET_MODE', 'TV');
        alert("Comando de ativação enviado para os terminais encontrados!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      <input type="file" ref={promoFileInputRef} onChange={handleManualImageUpload} accept="image/*" className="hidden" />

      <header className="bg-white border-b border-slate-200 px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200"><Package size={22} /></div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-extrabold text-xl tracking-tight">Painel Açougue</h1>
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${saveStatus === 'SAVING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {saveStatus === 'SAVING' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} {saveStatus === 'SAVING' ? 'Sincronizando' : 'Nuvem OK'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={handleManualSync} disabled={isSyncing} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all flex-1 md:flex-none whitespace-nowrap border-2 ${isSyncing ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'}`}>
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />} <span className="text-xs md:text-sm">Sincronizar</span>
          </button>
          <button onClick={onEnterControllerMode} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all flex-1 md:flex-none justify-center whitespace-nowrap"><Smartphone size={18} /> Celular</button>
          <button onClick={onEnterTvMode} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 flex-1 md:flex-none justify-center whitespace-nowrap"><Tv size={18} /> Modo TV</button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-full md:w-fit mb-8 shadow-sm overflow-x-auto sticky top-[90px] md:top-[100px] z-20">
          {[
            { id: 'PRODUCTS', label: 'Tabela Preços', icon: Package },
            { id: 'PROMOS', label: 'Ofertas TV', icon: Tag },
            { id: 'SETTINGS', label: 'Configuração Rede', icon: Globe }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-1 ${activeTab === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'PRODUCTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
              <div className="w-full md:w-auto">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Lista de Preços</h2>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 py-3 font-bold text-sm outline-none shadow-sm" />
                </div>
              </div>
              <button onClick={addProduct} className="bg-white border-2 border-slate-200 hover:border-red-600 hover:text-red-600 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-sm w-full md:w-auto justify-center"><Plus size={20} /> Novo Item</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 animate-in fade-in duration-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow mr-8">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome</label>
                      <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-black text-slate-800 text-sm outline-none" />
                    </div>
                    <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-grow">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Preço R$</label>
                      <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-mono font-black text-slate-700 text-lg outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Unidade</label>
                      <select value={p.unit} onChange={e => updateProduct(p.id, { unit: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-black outline-none h-[44px]">
                        {['KG', 'UN', 'PC', 'BD'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'PROMOS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Ofertas TV</h2><p className="text-xs text-slate-400 font-bold uppercase mt-1">Destaques automáticos na TV</p></div>
              <button onClick={addPromo} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 group justify-center"><Plus size={20} /> NOVA PROMOÇÃO</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.promotions.map((promo, index) => {
                const product = state.products.find(p => p.id === promo.productId);
                return (
                  <div key={promo.id} className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm relative animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="relative flex-shrink-0">
                        <div className="w-full sm:w-36 h-44 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-100 shadow-sm relative group">
                          <img src={promo.imageUrl} className="w-full h-full object-cover" />
                          <button onClick={() => triggerManualUpload(promo.id)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white"><FileUp size={24} /></button>
                        </div>
                      </div>
                      <div className="flex-grow space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => handleAiAction(promo.id, 'IMG_1_1', product?.name || '')} className="bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase">Arte IA 1:1</button>
                           <button onClick={() => handleAiAction(promo.id, 'IMG_16_9', product?.name || '')} className="bg-blue-600 text-white py-2 rounded-xl text-[9px] font-black uppercase">Arte TV</button>
                        </div>
                        <select value={promo.productId} onChange={e => updatePromo(promo.id, { productId: e.target.value })} className="w-full bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                          {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Oferta R$</label>
                          <input type="number" step="0.01" value={promo.offerPrice} onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent text-sm font-black outline-none" />
                        </div>
                        <div className="flex items-center gap-3"><ToggleSwitch checked={promo.isActive} onChange={(val) => updatePromo(promo.id, { isActive: val })} /><span className="text-[10px] font-bold text-slate-600 uppercase">Na TV</span></div>
                      </div>
                    </div>
                    <button onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(item => item.id !== promo.id)}))} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto space-y-6">
            
            {/* NOVO MONITOR DE RADAR E DISPOSITIVOS */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight mb-2">Monitor de Rede Local</h3>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Servidor Fabio FCell • {remoteIp}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={scanNetwork} disabled={isSearching} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 border border-white/5 transition-all active:scale-95">
                      {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      {isSearching ? 'Buscando...' : 'Buscar na Rede'}
                    </button>
                    <button onClick={handleRemoteSetTv} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl transition-all active:scale-95">
                      <Power size={18} /> Ligar Modo TV (Global)
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <div className={`w-32 h-32 rounded-full border-2 border-white/10 flex items-center justify-center ${isSearching ? 'animate-pulse scale-110' : ''}`}>
                         <Radio size={48} className={isSearching ? 'text-red-500' : 'text-white/20'} />
                      </div>
                      {isSearching && <div className="absolute inset-[-20px] rounded-full border border-red-500/50 animate-ping" />}
                    </div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Status de Varredura</p>
                    <p className="text-xl font-black mt-1 text-emerald-400">{isOnline ? 'REDE OPERACIONAL' : 'OFFLINE'}</p>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Terminais Encontrados</h4>
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-md">{activeDevices.length} ATIVOS</span>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {activeDevices.length > 0 ? activeDevices.map((device, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              {device.mode === 'TV' ? <Tv size={20} className="text-red-400" /> : <Smartphone size={20} className="text-blue-400" />}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase">{device.mode === 'TV' ? 'Painel TV' : 'Celular'}</p>
                              <p className="text-[10px] font-mono text-white/40">{device.ip} • ID: {device.id}</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                      )) : (
                        <div className="py-10 text-center opacity-30 flex flex-col items-center gap-3">
                          <Activity size={32} />
                          <p className="text-[10px] font-black uppercase">Nenhum terminal na rede local</p>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 bg-emerald-50 text-emerald-600 rounded-bl-3xl"><Link2 size={24} /></div>
               <h3 className="font-black text-lg mb-2">Pareamento via QR Code</h3>
               <p className="text-xs text-slate-400 mb-6 font-bold uppercase">Conecte TVs ou Celulares usando o WiFi Local</p>
               <div className="flex flex-col md:flex-row items-center gap-8 justify-center p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="bg-white p-4 rounded-3xl shadow-xl">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(controllerUrl)}`} className="w-40 h-40" />
                    <p className="text-[9px] font-black text-center text-slate-400 uppercase mt-2">Ler ID de Sincro</p>
                  </div>
                  <div className="text-left max-w-xs space-y-3">
                     <p className="text-[11px] text-slate-600 font-bold leading-relaxed uppercase">O código de pareamento <span className="text-red-600 font-black">{syncCode}</span> vincula todos os aparelhos na sua rede virtual. Qualquer dispositivo que ler este código aparecerá no seu monitor acima.</p>
                     <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-2 rounded-lg"><Wifi size={14} /> WiFi Integrado</div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="font-black text-lg mb-4">Código do Terminal</h3>
              <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-4xl tracking-tighter shadow-2xl mb-4">{syncCode}</div>
              <button onClick={generateNewSyncCode} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-600 transition-colors"><RefreshCcw size={14} /> Redefinir Código Global</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
