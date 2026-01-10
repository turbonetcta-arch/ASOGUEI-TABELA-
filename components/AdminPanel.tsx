
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Loader2, 
  Package, Tag, Key, 
  MonitorPlay, FileUp, 
  Search, Power, Zap, BrainCircuit,
  ImageIcon, Bot, Smartphone, QrCode,
  RotateCw, Layout, Wand, CheckSquare, Square, Share2,
  ExternalLink, LogOut, Home
} from 'lucide-react';
import { geminiService } from '../services/gemini';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onEnterTvMode: () => void;
  onEnterControllerMode: () => void;
  sendRemoteCommand?: (command: string, payload?: any) => void;
  onLogout?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'AI_BRAIN' | 'MOBILE' | 'SETTINGS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [aiThinking, setAiThinking] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [qrUrl, setQrUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

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

  useEffect(() => {
    // Gera a URL do Modo Balcão para o QR Code
    const baseUrl = window.location.origin + window.location.pathname;
    setQrUrl(`${baseUrl}?mode=controller`);
  }, []);

  const handleConnectGoogle = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      const active = await window.aistudio.hasSelectedApiKey();
      setHasGoogleKey(active);
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
        const img = await geminiService.generateProductImage(productName, false, "16:9");
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

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createOffersFromSelected = async () => {
    if (selectedProductIds.size === 0) return;
    setAiThinking(true);
    
    const selectedProducts = state.products.filter(p => selectedProductIds.has(p.id));
    const newPromos: Promotion[] = [];

    for (const product of selectedProducts) {
      const promoId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const initialPromo: Promotion = {
        id: promoId,
        productId: product.id,
        offerPrice: product.price * 0.9,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        description: 'GERANDO OFERTA COM IA...',
        isActive: true
      };
      newPromos.push(initialPromo);
    }

    setState(prev => ({
      ...prev,
      promotions: [...newPromos, ...prev.promotions]
    }));

    setSelectedProductIds(new Set());
    setActiveTab('PROMOS');

    if (hasGoogleKey) {
      newPromos.forEach(promo => {
        const product = selectedProducts.find(p => p.id === promo.productId);
        if (product) {
          handleAiAction(promo.id, 'DESC', product.name);
          handleAiAction(promo.id, 'IMG', product.name);
        }
      });
    }
    setAiThinking(false);
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
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'LANDING' }))}
            className="p-3.5 bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group"
            title="Voltar ao Início"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Zap size={24} fill="currentColor" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-xl tracking-tight uppercase leading-none text-slate-900">{state.storeName}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronização Cloud Ativa</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={handleConnectGoogle}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${hasGoogleKey ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse'}`}
          >
            <BrainCircuit size={16} className="hidden xs:block" /> {hasGoogleKey ? 'IA ATIVA' : 'ATIVAR GEMINI'}
          </button>
          <button onClick={onEnterTvMode} className="bg-slate-900 text-white px-4 sm:px-8 py-3.5 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
            <Tv size={20} /> <span className="hidden xs:block">LANÇAR NA TV</span>
          </button>
          <button onClick={onLogout} className="p-3.5 bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="Sair do Painel">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <nav className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 mb-8 shadow-sm w-full sm:w-fit overflow-x-auto no-scrollbar">
          {[
            { id: 'PRODUCTS', label: 'Produtos', icon: Package },
            { id: 'PROMOS', label: 'Ofertas IA', icon: Tag },
            { id: 'MOBILE', label: 'Celular', icon: Smartphone },
            { id: 'AI_BRAIN', label: 'Gemini 2.5', icon: BrainCircuit },
            { id: 'SETTINGS', label: 'Ajustes', icon: MonitorPlay }
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

        {activeTab === 'PRODUCTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-lg outline-none shadow-sm focus:ring-4 focus:ring-red-50 transition-all" 
                />
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                {selectedProductIds.size > 0 && (
                  <button 
                    onClick={createOffersFromSelected}
                    disabled={aiThinking}
                    className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase flex items-center gap-3 shadow-xl hover:scale-105 transition-all flex-grow justify-center"
                  >
                    {aiThinking ? <Loader2 className="animate-spin" size={24} /> : <Bot size={24} />}
                    Gerar Ofertas IA ({selectedProductIds.size})
                  </button>
                )}
                <button 
                  onClick={() => setState(prev => ({ ...prev, products: [{ id: Date.now().toString(), name: 'NOVO ITEM', price: 0, unit: 'KG' }, ...prev.products] }))} 
                  className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase flex items-center gap-3 shadow-xl hover:scale-105 transition-all flex-grow justify-center"
                >
                  <Plus size={24} /> Novo Corte
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                const isSelected = selectedProductIds.has(p.id);
                return (
                  <div key={p.id} className={`bg-white p-8 rounded-[3rem] border-2 transition-all group relative overflow-hidden ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 shadow-sm'}`}>
                    <button onClick={() => toggleProductSelection(p.id)} className={`absolute top-6 right-6 p-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>{isSelected ? <CheckSquare size={24} /> : <Square size={24} />}</button>
                    <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} className="w-full font-black text-slate-800 text-xl uppercase outline-none bg-transparent mb-6 pr-10" />
                    <div className="bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 mb-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Preço KG</label>
                      <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent outline-none font-mono font-black text-2xl text-slate-700" />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { toggleProductSelection(p.id); createOffersFromSelected(); }} className="flex-grow bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"><Bot size={18} /> Criar Peça IA</button>
                       <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-4 bg-slate-50 text-slate-300 hover:text-red-500 rounded-2xl transition-colors"><Trash2 size={20} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'MOBILE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-8">
             <div className="bg-white rounded-[3rem] p-12 border-2 border-slate-100 shadow-xl text-center space-y-8">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl">
                   <Smartphone size={48} />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Controle Remoto Cloud</h2>
                   <p className="text-slate-500 mt-2 font-medium">Use seu celular para atualizar preços em tempo real no balcão enquanto a TV exibe as ofertas.</p>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] flex flex-col items-center gap-6">
                   <div className="bg-white p-6 rounded-3xl shadow-inner relative group">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`} 
                        alt="QR Code"
                        className="w-[200px] h-[200px]"
                      />
                      <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                         <ExternalLink className="text-indigo-600 mb-2" size={32} />
                         <span className="text-[10px] font-black uppercase text-indigo-600">Scan Me</span>
                      </div>
                   </div>
                   <div className="text-center overflow-hidden w-full px-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Link de Acesso Direto:</p>
                      <p className="text-xs font-mono text-indigo-400 truncate w-full">{qrUrl}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   <button 
                    onClick={onEnterControllerMode}
                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                   >
                     <Smartphone size={20} /> Entrar no Modo Balcão
                   </button>
                   <button 
                    onClick={() => {
                      navigator.clipboard.writeText(qrUrl);
                      alert('Link copiado para o balcão!');
                    }}
                    className="w-full bg-slate-100 text-slate-600 py-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
                   >
                     <Share2 size={20} /> Copiar Link do Balcão
                   </button>
                </div>
             </div>
             
             <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-8 flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse">
                   <Bot size={24} />
                </div>
                <div>
                   <p className="text-emerald-900 font-black text-sm uppercase tracking-tight">Status: Cloud Sync Ativo</p>
                   <p className="text-emerald-700 text-xs font-medium">Escaneie o QR Code no celular de qualquer funcionário para atualizar os preços na TV instantaneamente.</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'PROMOS' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {state.promotions.map((promo) => {
             const product = state.products.find(p => p.id === promo.productId);
             const isLoadingImg = loadingIds.has(`${promo.id}-IMG`);
             return (
               <div key={promo.id} className={`bg-white rounded-[3rem] border-2 p-8 flex flex-col gap-8 shadow-sm transition-all ${promo.isActive ? 'border-emerald-100 ring-4 ring-emerald-50' : 'border-slate-100 opacity-80'}`}>
                 <div className="flex flex-col sm:flex-row gap-6">
                   <div className="w-full sm:w-40 h-40 rounded-[2rem] bg-slate-50 overflow-hidden border-4 border-white shadow-xl relative shrink-0">
                     {isLoadingImg ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-red-500" size={32} /></div>
                     ) : (
                       <img src={promo.imageUrl} className="w-full h-full object-cover" alt="Promo" />
                     )}
                   </div>
                   <div className="flex-grow flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${promo.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{promo.isActive ? 'NO AR' : 'PAUSADO'}</span>
                       <button onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(p => p.id !== promo.id)}))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                     </div>
                     <div className="font-black text-xl uppercase text-slate-800 leading-none">{product?.name}</div>
                     <div className="flex items-center gap-3">
                        <div className="bg-red-50 flex-grow px-4 py-2 rounded-xl border border-red-100">
                          <label className="text-[9px] font-black text-red-400 uppercase block">Preço Oferta R$</label>
                          <input type="number" step="0.01" value={promo.offerPrice} onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })} className="bg-transparent font-black text-lg text-red-600 outline-none w-full" />
                        </div>
                        <button onClick={() => updatePromo(promo.id, { isActive: !promo.isActive })} className={`p-4 rounded-xl transition-all ${promo.isActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><Power size={20} /></button>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slogan IA</label>
                       <button onClick={() => handleAiAction(promo.id, 'DESC', product?.name || '')} className="text-[10px] font-black flex items-center gap-2 text-indigo-600 hover:scale-105 transition-transform"><Wand size={12} /> Refazer</button>
                    </div>
                    <input value={promo.description} onChange={e => updatePromo(promo.id, { description: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-sm outline-none" />
                 </div>
               </div>
             );
           })}
         </div>
        )}

        {activeTab === 'AI_BRAIN' && (
           <div className={`rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl transition-all duration-700 bg-slate-800 ${hasGoogleKey ? 'bg-gradient-to-br from-indigo-700 to-indigo-950' : ''}`}>
              <div className="absolute -top-10 -right-10 p-20 opacity-10 rotate-12"><BrainCircuit size={300} /></div>
              <div className="relative z-10 max-w-3xl">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${hasGoogleKey ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
                  {hasGoogleKey ? 'GEMINI 2.5 FLASH ATIVO' : 'IA AGUARDANDO ATIVAÇÃO'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter italic uppercase mb-6 leading-none">Mídia Inteligente</h2>
                <p className="text-xl opacity-70 mb-10">Fotos profissionais e slogans que vendem, gerados automaticamente pelo Gemini para o seu açougue.</p>
                {!hasGoogleKey && <button onClick={handleConnectGoogle} className="bg-white text-indigo-700 px-10 py-5 rounded-3xl font-black text-sm uppercase flex items-center gap-3 hover:scale-105 shadow-2xl transition-all"><Key size={24} /> Ativar Gemini com API Key</button>}
              </div>
           </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm">
                <h3 className="font-black text-2xl mb-8 flex items-center gap-4 uppercase italic"><RotateCw className="text-red-600" size={32} /> Orientação</h3>
                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => setState(prev => ({...prev, tvOrientation: 0}))} className={`group flex flex-col items-center justify-center gap-6 p-10 rounded-[2.5rem] border-4 transition-all ${state.tvOrientation === 0 ? 'border-red-600 bg-red-50 text-red-700 shadow-xl' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                    <div className="w-32 h-20 bg-current rounded-xl opacity-20"></div>
                    <span className="font-black text-lg uppercase">Horizontal</span>
                  </button>
                  <button onClick={() => setState(prev => ({...prev, tvOrientation: 90}))} className={`group flex flex-col items-center justify-center gap-6 p-10 rounded-[2.5rem] border-4 transition-all ${state.tvOrientation === 90 ? 'border-red-600 bg-red-50 text-red-700 shadow-xl' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                    <div className="w-20 h-32 bg-current rounded-xl opacity-20"></div>
                    <span className="font-black text-lg uppercase">Vertical</span>
                  </button>
                </div>
              </div>
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-center text-center">
                 <h4 className="font-black text-red-500 uppercase text-xs mb-6 italic tracking-widest">Modo Mídia Ativo</h4>
                 <button onClick={onEnterTvMode} className="w-full bg-red-600 hover:bg-red-500 text-white py-8 rounded-[2rem] font-black text-xl uppercase italic shadow-2xl transition-all border-b-8 border-red-800">LANÇAR NA TV</button>
              </div>
           </div>
        )}
      </main>
      <footer className="py-12 text-center opacity-30">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic">Media Indoor Cloud Engine • Fabio FCell</p>
      </footer>
    </div>
  );
};

export default AdminPanel;
