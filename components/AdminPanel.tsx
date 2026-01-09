
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
  Power, Send
} from 'lucide-react';
import { geminiService } from '../services/gemini';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onEnterTvMode: () => void;
  onEnterControllerMode: () => void;
  isOnline?: boolean;
  sendRemoteCommand?: (command: string, payload?: any) => void;
}

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode, isOnline, sendRemoteCommand }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'SETTINGS'>('PRODUCTS');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
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
        alert("Você está offline. Verifique sua conexão com a Internet.");
        return;
    }
    setIsSyncing(true);
    // Força a atualização do estado enviando para o relay
    if (sendRemoteCommand) {
        sendRemoteCommand('FORCE_UPDATE', state);
    }
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return state.products;
    const term = searchTerm.toLowerCase();
    return state.products.filter(p => p.name.toLowerCase().includes(term));
  }, [state.products, searchTerm]);

  const scrollToBottom = () => {
    promosEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const scrollToTop = () => {
    promosStartRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (navigator.vibrate) navigator.vibrate(20);
  };

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
    if (navigator.vibrate) navigator.vibrate(40);
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
      const base64 = e.target?.result as string;
      updatePromo(activePromoUploadId, { imageUrl: base64 });
      setActivePromoUploadId(null);
      if (promoFileInputRef.current) promoFileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const triggerManualUpload = (promoId: string) => {
    setActivePromoUploadId(promoId);
    promoFileInputRef.current?.click();
  };

  const addProduct = () => {
    const id = Date.now().toString();
    const newProduct: Product = { id, name: 'NOVA CARNE', price: 0, unit: 'KG', category: 'Geral' };
    setState(prev => ({ ...prev, products: [newProduct, ...prev.products] }));
    setSearchTerm(''); 
  };

  const addPromo = () => {
    if (state.products.length === 0) {
      alert("Adicione primeiro um produto na Tabela de Preços para criar uma oferta.");
      setActiveTab('PRODUCTS');
      return;
    }
    const id = Date.now().toString();
    const firstProduct = state.products[0];
    const newPromo: Promotion = {
      id,
      productId: firstProduct.id,
      offerPrice: firstProduct.price > 0 ? firstProduct.price * 0.9 : 0,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      description: `OFERTA IMPERDÍVEL: ${firstProduct.name}!`,
      isActive: true
    };
    setState(prev => ({ ...prev, promotions: [newPromo, ...prev.promotions] }));
    setTimeout(scrollToTop, 100);
  };

  const handleAiAction = async (promoId: string, type: 'DESC' | 'IMG_1_1' | 'IMG_16_9', productName: string) => {
    const loadingKey = `${promoId}-${type}`;
    setLoadingIds(prev => new Set(prev).add(loadingKey));
    try {
      if (type === 'DESC') {
        const desc = await geminiService.generateCatchyDescription(productName);
        updatePromo(promoId, { description: desc });
      } else {
        const ratio = type === 'IMG_16_9' ? '16:9' : '1:1';
        const img = await geminiService.generateProductImage(productName, false, ratio);
        if (img) updatePromo(promoId, { imageUrl: img });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(loadingKey);
        return next;
      });
    }
  };

  const handleRemoteSetTv = () => {
    if (sendRemoteCommand) {
        sendRemoteCommand('SET_MODE', 'TV');
        alert("Comando de ativação enviado para as telas pareadas!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      <input 
        type="file" 
        ref={promoFileInputRef} 
        onChange={handleManualImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <header className="bg-white border-b border-slate-200 px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
            <Package size={22} />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-3">
              <h1 className="font-extrabold text-xl tracking-tight">Painel Açougue</h1>
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${saveStatus === 'SAVING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {saveStatus === 'SAVING' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                {saveStatus === 'SAVING' ? 'Salvando' : 'Salvo'}
              </div>
            </div>
            <input 
              value={state.storeName}
              onChange={e => setState(prev => ({ ...prev, storeName: e.target.value.toUpperCase() }))}
              className="bg-transparent border-none p-0 h-5 text-slate-400 text-xs font-bold focus:ring-0 outline-none w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* BOTÃO DE ATUALIZAÇÃO / SINCRONIZAÇÃO */}
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all flex-1 md:flex-none whitespace-nowrap border-2 ${isSyncing ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'}`}
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
            <span className="text-xs md:text-sm">{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
          </button>

          <button onClick={onEnterControllerMode} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all flex-1 md:flex-none justify-center whitespace-nowrap">
            <Smartphone size={18} /> Celular
          </button>
          <button onClick={onEnterTvMode} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 flex-1 md:flex-none justify-center whitespace-nowrap">
            <Tv size={18} /> Modo TV
          </button>
        </div>
      </header>

      {activeTab === 'PROMOS' && state.promotions.length > 2 && (
        <div className="fixed right-4 bottom-24 flex flex-col gap-3 z-[60] animate-in slide-in-from-right duration-500">
          <button onClick={scrollToTop} className="w-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-red-600 transition-all group">
            <ChevronFirst size={24} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button onClick={addPromo} className="w-12 h-12 bg-red-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-red-700 transition-all">
            <Plus size={24} />
          </button>
          <button onClick={scrollToBottom} className="w-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-red-600 transition-all group">
            <ChevronLast size={24} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-full md:w-fit mb-8 shadow-sm overflow-x-auto sticky top-[90px] md:top-[100px] z-20">
          {[
            { id: 'PRODUCTS', label: 'Tabela Preços', icon: Package },
            { id: 'PROMOS', label: 'Ofertas TV', icon: Tag },
            { id: 'SETTINGS', label: 'Configurações', icon: Settings2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-1 ${activeTab === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
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
                  <input type="text" placeholder="Buscar carne..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 py-3 font-bold text-sm focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all outline-none shadow-sm" />
                </div>
              </div>
              <button onClick={addProduct} className="bg-white border-2 border-slate-200 hover:border-red-600 hover:text-red-600 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-sm w-full md:w-auto justify-center">
                <Plus size={20} /> Novo Item
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 relative group animate-in fade-in duration-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow mr-8">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome do Produto</label>
                      <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-black text-slate-800 text-sm focus:ring-2 focus:ring-red-100 outline-none" />
                    </div>
                    <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-grow">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Preço (R$)</label>
                      <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-mono font-black text-slate-700 text-lg focus:ring-2 focus:ring-red-100 outline-none" />
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
            <div ref={promosStartRef} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ofertas em Destaque</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Gerencie as promoções que aparecem na TV</p>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button onClick={addPromo} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95 group justify-center">
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" /> NOVA PROMOÇÃO
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={scrollToTop} className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-sm"><ChevronUp size={16} /> <span className="hidden sm:inline">Topo</span></button>
                  <button onClick={scrollToBottom} className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-sm"><ChevronDown size={16} /> <span className="hidden sm:inline">Final</span></button>
                  <button onClick={() => setShowMultiSelect(true)} className="bg-yellow-400 hover:bg-yellow-500 text-black p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-md"><Star size={16} className="fill-black" /> <span className="hidden sm:inline">Flash</span></button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.promotions.map((promo, index) => {
                const product = state.products.find(p => p.id === promo.productId);
                return (
                  <div key={promo.id} className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm relative animate-in zoom-in-95 duration-300">
                    <div className="absolute top-2 right-12 flex items-center gap-1.5 z-10">
                      <button disabled={index === 0} onClick={() => movePromo(index, 'UP')} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 disabled:opacity-20 flex items-center justify-center transition-all shadow-sm active:scale-90"><ArrowUp size={16} /></button>
                      <button disabled={index === state.promotions.length - 1} onClick={() => movePromo(index, 'DOWN')} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 disabled:opacity-20 flex items-center justify-center transition-all shadow-sm active:scale-90"><ArrowDown size={16} /></button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="relative flex-shrink-0 group/img">
                        <div className="w-full sm:w-36 h-44 sm:h-44 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-100 shadow-sm transition-transform group-hover/img:scale-[1.02]">
                          <img src={promo.imageUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <button onClick={() => triggerManualUpload(promo.id)} className="bg-white/90 text-slate-900 p-2.5 rounded-full shadow-xl hover:bg-white active:scale-95 transition-all"><FileUp size={20} /></button>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow space-y-3 pt-4 sm:pt-0">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Arte por IA</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleAiAction(promo.id, 'IMG_1_1', product?.name || 'Carne')} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all disabled:opacity-50"><Sparkles size={12} className="text-yellow-400" /> Arte 1:1</button>
                            <button onClick={() => handleAiAction(promo.id, 'IMG_16_9', product?.name || 'Carne')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all disabled:opacity-50"><MonitorPlay size={12} /> Arte 16:9</button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Produto</label>
                          <select value={promo.productId} onChange={e => updatePromo(promo.id, { productId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                            {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase block">Oferta R$</label>
                            <input type="number" step="0.01" value={promo.offerPrice} onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent text-sm font-black outline-none" />
                          </div>
                          <button onClick={() => handleAiAction(promo.id, 'DESC', product?.name || 'Carne')} className="bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-red-100"><Wand2 size={12} /> Frase IA</button>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <ToggleSwitch checked={promo.isActive} onChange={(val) => updatePromo(promo.id, { isActive: val })} />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{promo.isActive ? 'Ativo na TV' : 'Pausado'}</span>
                        </div>
                      </div>
                    </div>
                    <textarea value={promo.description} onChange={e => updatePromo(promo.id, { description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none h-20 resize-none mt-2" placeholder="Frase de marketing..." />
                    <button onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(item => item.id !== promo.id)}))} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
            <div ref={promosEndRef} className="h-10 w-full" />
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto space-y-6">
            
            {/* ÁREA DE TV ATIVA NO PAINEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-xl relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 p-4 ${isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'} rounded-bl-3xl transition-colors duration-500`}>
                     <Tv size={32} className={isOnline ? 'animate-pulse' : ''} />
                  </div>
                  <h3 className="font-black text-2xl mb-2 flex items-center gap-3">
                    Monitor da TV Ativa
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">Controle o status de exibição em tempo real</p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                     <div className="relative">
                        <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isOnline ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-slate-200 bg-slate-50'}`}>
                           <Activity size={48} className={isOnline ? 'text-emerald-500' : 'text-slate-300'} />
                        </div>
                        {isOnline && <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full animate-ping" />}
                     </div>
                     
                     <div className="flex-grow space-y-4 text-center sm:text-left">
                        <div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status da Nuvem</span>
                           <div className="flex items-center justify-center sm:justify-start gap-2">
                              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className={`text-xl font-black ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>{isOnline ? 'SINCRO ATIVA' : 'DESCONECTADO'}</span>
                           </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                           <button 
                             onClick={handleRemoteSetTv}
                             disabled={!isOnline}
                             className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-200 transition-all flex items-center gap-2 active:scale-95"
                           >
                              <Power size={18} /> Ligar Modo TV Remoto
                           </button>
                           <button 
                             onClick={() => isOnline && sendRemoteCommand?.('SET_MODE', 'ADMIN')}
                             disabled={!isOnline}
                             className="bg-slate-800 hover:bg-black disabled:bg-slate-200 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg transition-all flex items-center gap-2 active:scale-95"
                           >
                              <Monitor size={18} /> Resetar Painel Remoto
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-white shadow-2xl relative">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Código de Pareamento</span>
                  <div className="bg-white/10 p-4 rounded-3xl mb-4 border border-white/5 backdrop-blur-md">
                     <span className="text-5xl font-black tracking-tighter text-white">{syncCode}</span>
                  </div>
                  <button onClick={generateNewSyncCode} className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase hover:bg-white/5 px-4 py-2 rounded-xl transition-all">
                    <RefreshCcw size={14} /> Atualizar Código
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 bg-emerald-50 text-emerald-600 rounded-bl-3xl">
                  <Link2 size={24} />
               </div>
              <h3 className="font-black text-lg mb-2 flex items-center gap-2">Sincronização Cloud (WiFi)</h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase">Pareie sua TV e Celular instantaneamente</p>
              
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center gap-6">
                <div className="flex flex-col md:flex-row items-center gap-8 w-full justify-center">
                  <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(controllerUrl)}`} alt="QR Code" className="w-40 h-40" />
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">Escaneie para Conectar</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3 text-left max-w-xs">
                    <QrCode className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase">Aponte a câmera do seu celular para o QR Code. O controle remoto abrirá já conectado ao seu açougue.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                 <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Monitor className="text-red-600" /> Orientação da TV</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setState(prev => ({...prev, tvOrientation: 0}))} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${state.tvOrientation === 0 ? 'bg-red-50 border-red-600 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                     <RotateCcw size={32} /><span className="font-black uppercase text-[10px] tracking-widest">Horizontal</span>
                   </button>
                   <button onClick={() => setState(prev => ({...prev, tvOrientation: 90}))} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${state.tvOrientation === 90 ? 'bg-red-50 border-red-600 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                     <RotateCw size={32} /><span className="font-black uppercase text-[10px] tracking-widest">Vertical</span>
                   </button>
                 </div>
               </div>

               <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                 <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Settings2 className="text-red-600" /> Sistema</h3>
                 <div className="space-y-4">
                   <button onClick={exportData} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200"><Download size={18} /> Backup dos Dados</button>
                   <button onClick={() => window.aistudio?.openSelectKey()} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><Key size={18} /> Chave API Google</button>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {showMultiSelect && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col p-6 items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] flex flex-col p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3"><Star className="text-yellow-500 fill-yellow-500" /><h3 className="text-xl font-black text-slate-800 uppercase italic">Multi-Flash do Dia</h3></div>
              <button onClick={() => setShowMultiSelect(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-red-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-3 max-h-[60vh] pr-2">
              {state.products.map(p => {
                const isSelected = state.superOffer.productIds.includes(p.id);
                return (
                  <div key={p.id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'bg-yellow-50 border-yellow-400 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <p className={`font-bold text-sm uppercase ${isSelected ? 'text-yellow-700' : 'text-slate-700'}`}>{p.name}</p>
                      {isSelected && <CheckCircle2 size={18} className="text-yellow-500" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 20, 30].map(pct => (
                        <button key={pct} onClick={() => toggleSuperOfferProduct(p, pct)} className={`py-2 rounded-xl font-black text-[9px] uppercase transition-all ${isSelected ? 'bg-yellow-400 text-black shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:border-yellow-200'}`}>-{pct}% OFF</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowMultiSelect(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm mt-6 shadow-xl active:scale-95 transition-all">Confirmar Seleção</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
