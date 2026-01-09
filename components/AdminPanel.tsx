
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Sparkles, Loader2, 
  Package, Tag, Settings2, CheckCircle2, Key, 
  Smartphone, Download, Wand2, FileUp, AlertCircle,
  RotateCcw, RotateCw, Monitor, Search, X, MonitorPlay,
  ChevronDown, ChevronUp, MousePointerSquareDashed, Star,
  Link2, RefreshCcw, Home, ArrowUp, ArrowDown, Layout,
  QrCode, ChevronLast, ChevronFirst
} from 'lucide-react';
import { geminiService } from '../services/gemini';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onEnterTvMode: () => void;
  onEnterControllerMode: () => void;
}

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'SETTINGS'>('PRODUCTS');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  
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
    // Pequeno atraso para garantir que o elemento foi renderizado
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
          <button onClick={onEnterControllerMode} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all flex-1 md:flex-none justify-center">
            <Smartphone size={18} /> Celular
          </button>
          <button onClick={onEnterTvMode} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 flex-1 md:flex-none justify-center">
            <Tv size={18} /> Modo TV
          </button>
        </div>
      </header>

      {/* BOTÕES DE ROLAGEM FLUTUANTES (LADO DIREITO) - APENAS NA ABA PROMOS */}
      {activeTab === 'PROMOS' && state.promotions.length > 2 && (
        <div className="fixed right-4 bottom-24 flex flex-col gap-3 z-[60] animate-in slide-in-from-right duration-500">
          <button 
            onClick={scrollToTop}
            className="w-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-red-600 hover:scale-110 active:scale-90 transition-all group"
            title="Ir para o topo"
          >
            <ChevronFirst size={24} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
          
          <button 
            onClick={addPromo}
            className="w-12 h-12 bg-red-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-red-700 hover:scale-110 active:scale-90 transition-all"
            title="Adicionar Nova Oferta"
          >
            <Plus size={24} />
          </button>

          <button 
            onClick={scrollToBottom}
            className="w-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-red-600 hover:scale-110 active:scale-90 transition-all group"
            title="Ir para o final"
          >
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
                  <input 
                    type="text"
                    placeholder="Buscar carne..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 py-3 font-bold text-sm focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all outline-none shadow-sm"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              <button onClick={addProduct} className="bg-white border-2 border-slate-200 hover:border-red-600 hover:text-red-600 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-sm w-full md:w-auto justify-center">
                <Plus size={20} /> Novo Item
              </button>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[3rem] border border-slate-200">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-lg">Nenhum produto encontrado</p>
                <p className="text-sm">Tente buscar por outro nome ou adicione um novo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 relative group animate-in fade-in duration-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow mr-8">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome do Produto</label>
                        <input 
                          value={p.name} 
                          onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} 
                          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-black text-slate-800 text-sm focus:ring-2 focus:ring-red-100 outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} 
                        className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-grow">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Preço (R$)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={p.price} 
                          onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} 
                          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-mono font-black text-slate-700 text-lg focus:ring-2 focus:ring-red-100 outline-none"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Unidade</label>
                        <select 
                          value={p.unit} 
                          onChange={e => updateProduct(p.id, { unit: e.target.value })} 
                          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-black outline-none h-[44px]"
                        >
                          {['KG', 'UN', 'PC', 'BD'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <button 
                  onClick={addPromo} 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95 group justify-center"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
                  NOVA PROMOÇÃO
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={scrollToTop}
                    title="Voltar ao início da lista"
                    className="bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <ChevronUp size={16} /> <span className="hidden sm:inline">Topo</span>
                  </button>
                  <button 
                    onClick={scrollToBottom}
                    title="Ir para o final da lista"
                    className="bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <ChevronDown size={16} /> <span className="hidden sm:inline">Final</span>
                  </button>
                  <button 
                    onClick={() => setShowMultiSelect(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black p-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <Star size={16} className="fill-black" /> <span className="hidden sm:inline">Flash</span>
                  </button>
                </div>
              </div>
            </div>
            
            {state.promotions.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <Tag size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-lg">Nenhuma promoção ativa</p>
                <p className="text-sm">Clique em "Nova Promoção" para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {state.promotions.map((promo, index) => {
                  const product = state.products.find(p => p.id === promo.productId);
                  const isImg11Loading = loadingIds.has(`${promo.id}-IMG_1_1`);
                  const isImg169Loading = loadingIds.has(`${promo.id}-IMG_16_9`);
                  const isDescLoading = loadingIds.has(`${promo.id}-DESC`);

                  return (
                    <div key={promo.id} className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm relative animate-in zoom-in-95 duration-300">
                      
                      {/* CONTROLES DE ORDENAÇÃO - SEMPRE VISÍVEIS */}
                      <div className="absolute top-2 right-12 flex items-center gap-1.5 z-10">
                        <button 
                          disabled={index === 0}
                          onClick={() => movePromo(index, 'UP')}
                          className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 disabled:opacity-20 flex items-center justify-center transition-all shadow-sm active:scale-90"
                          title="Mover para cima"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button 
                          disabled={index === state.promotions.length - 1}
                          onClick={() => movePromo(index, 'DOWN')}
                          className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 disabled:opacity-20 flex items-center justify-center transition-all shadow-sm active:scale-90"
                          title="Mover para baixo"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-5">
                        <div className="relative flex-shrink-0 group/img">
                          <div className="w-full sm:w-36 h-44 sm:h-44 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-100 shadow-sm transition-transform group-hover/img:scale-[1.02]">
                            <img src={promo.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <button 
                                onClick={() => triggerManualUpload(promo.id)}
                                className="bg-white/90 text-slate-900 p-2.5 rounded-full shadow-xl hover:bg-white active:scale-95 transition-all"
                              >
                                <FileUp size={20} />
                              </button>
                            </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-white border border-slate-200 p-1 rounded-lg shadow-md">
                             <Layout size={14} className="text-slate-400" />
                          </div>
                        </div>

                        <div className="flex-grow space-y-3 pt-4 sm:pt-0">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Arte por IA (Gerar Novo)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => handleAiAction(promo.id, 'IMG_1_1', product?.name || 'Carne')}
                                  disabled={isImg11Loading || isImg169Loading}
                                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all disabled:opacity-50"
                                >
                                  {isImg11Loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-yellow-400" />}
                                  <span>Arte 1:1</span>
                                </button>
                                <button 
                                  onClick={() => handleAiAction(promo.id, 'IMG_16_9', product?.name || 'Carne')}
                                  disabled={isImg11Loading || isImg169Loading}
                                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all disabled:opacity-50"
                                >
                                  {isImg169Loading ? <Loader2 size={12} className="animate-spin" /> : <MonitorPlay size={12} />}
                                  <span>Arte 16:9</span>
                                </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Produto</label>
                            <select value={promo.productId} onChange={e => updatePromo(promo.id, { productId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-red-200">
                              {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                              <label className="text-[9px] font-black text-slate-400 uppercase block">Oferta R$</label>
                              <input type="number" step="0.01" value={promo.offerPrice} onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent text-sm font-black outline-none" />
                            </div>
                            <button 
                              onClick={() => handleAiAction(promo.id, 'DESC', product?.name || 'Carne')} 
                              disabled={isDescLoading}
                              className="bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-red-100 hover:bg-red-100 transition-colors"
                            >
                              {isDescLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Frase IA
                            </button>
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <ToggleSwitch checked={promo.isActive} onChange={(val) => updatePromo(promo.id, { isActive: val })} />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{promo.isActive ? 'Ativo na TV' : 'Pausado'}</span>
                          </div>
                        </div>
                      </div>

                      <textarea value={promo.description} onChange={e => updatePromo(promo.id, { description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none h-20 resize-none mt-2 focus:border-red-200 focus:bg-white transition-all" placeholder="Frase de marketing..." />
                      
                      <button 
                        onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(item => item.id !== promo.id)}))} 
                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* BOTÃO "LAR" / VOLTA PARA CIMA */}
            {state.promotions.length > 2 && (
              <div className="flex justify-center mt-6">
                <button 
                  onClick={scrollToTop}
                  className="bg-white border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-[2rem] font-black uppercase text-xs flex items-center gap-3 shadow-lg transition-all active:scale-95 group hover:bg-slate-900 hover:text-white"
                >
                  <Home size={18} className="group-hover:-translate-y-1 transition-transform" />
                  Voltar para Cima
                </button>
              </div>
            )}
            
            <div ref={promosEndRef} className="h-10 w-full" />
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto space-y-6">
            
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 bg-emerald-50 text-emerald-600 rounded-bl-3xl">
                  <Link2 size={24} />
               </div>
              <h3 className="font-black text-lg mb-2 flex items-center gap-2">Sincronização Cloud (WiFi)</h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase">Pareie sua TV e Celular instantaneamente</p>
              
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center gap-6">
                <div className="flex flex-col md:flex-row items-center gap-8 w-full justify-center">
                  <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(controllerUrl)}`} 
                      alt="QR Code de Pareamento"
                      className="w-40 h-40"
                    />
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">Escaneie para Conectar</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Código Manual</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">{syncCode}</span>
                    </div>
                    <button onClick={generateNewSyncCode} className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
                      <RefreshCcw size={14} /> Gerar Novo Código
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3 text-left">
                  <QrCode className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                  <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase">
                    Aponte a câmera do seu celular para o QR Code acima. O controle remoto abrirá automaticamente já conectado ao WiFi desta TV.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Monitor className="text-red-600" /> Orientação da TV</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setState(prev => ({...prev, tvOrientation: 0}))}
                  className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${state.tvOrientation === 0 ? 'bg-red-50 border-red-600 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                >
                  <RotateCcw size={32} />
                  <span className="font-black uppercase text-[10px] tracking-widest">Horizontal</span>
                </button>
                <button 
                  onClick={() => setState(prev => ({...prev, tvOrientation: 90}))}
                  className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${state.tvOrientation === 90 ? 'bg-red-50 border-red-600 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                >
                  <RotateCw size={32} />
                  <span className="font-black uppercase text-[10px] tracking-widest">Vertical (90°)</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Settings2 className="text-red-600" /> Sistema</h3>
              <div className="space-y-4">
                <button onClick={exportData} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all">
                  <Download size={18} /> Backup dos Dados
                </button>
                <button onClick={() => window.aistudio?.openSelectKey()} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <Key size={18} /> Chave API Google
                </button>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Aviso de Imagens</p>
                    <p className="text-[11px] text-amber-600 leading-relaxed">As imagens geradas por IA ou enviadas manualmente são salvas localmente no navegador. Faça backup regularmente para não perder seus dados ao limpar o cache.</p>
                  </div>
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
              <div className="flex items-center gap-3">
                <Star className="text-yellow-500 fill-yellow-500" />
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Multi-Flash do Dia</h3>
              </div>
              <button onClick={() => setShowMultiSelect(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-red-600 transition-colors"><X size={24} /></button>
            </div>
            
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 px-2">Selecione os produtos que entrarão no rodízio de destaque especial</p>

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
                        <button 
                          key={pct}
                          onClick={() => toggleSuperOfferProduct(p, pct)}
                          className={`py-2 rounded-xl font-black text-[9px] uppercase transition-all ${isSelected ? 'bg-yellow-400 text-black shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:border-yellow-200'}`}
                        >
                          -{pct}% OFF
                        </button>
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
