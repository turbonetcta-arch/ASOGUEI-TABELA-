
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Sparkles, Loader2, 
  Package, Tag, Settings2, CheckCircle2, Key, 
  Smartphone, Download, Wand2, FileUp
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
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'SETTINGS'>('PRODUCTS');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  
  const promoFileInputRef = useRef<HTMLInputElement>(null);
  const [activePromoUploadId, setActivePromoUploadId] = useState<string | null>(null);

  useEffect(() => {
    setSaveStatus('SAVING');
    const timer = setTimeout(() => setSaveStatus('SAVED'), 600);
    return () => clearTimeout(timer);
  }, [state]);

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_acougue_${new Date().toLocaleDateString()}.json`);
    linkElement.click();
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
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const addPromo = () => {
    if (state.products.length === 0) return;
    const id = Date.now().toString();
    const newPromo: Promotion = {
      id,
      productId: state.products[0].id,
      offerPrice: state.products[0].price * 0.9,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      description: 'Aproveite esta oferta imperdível!',
      isActive: true
    };
    setState(prev => ({ ...prev, promotions: [...prev.promotions, newPromo] }));
  };

  const handleAiAction = async (promoId: string, type: 'DESC' | 'IMG', productName: string) => {
    setLoadingIds(prev => new Set(prev).add(`${promoId}-${type}`));
    try {
      if (type === 'DESC') {
        const desc = await geminiService.generateCatchyDescription(productName);
        updatePromo(promoId, { description: desc });
      } else {
        const img = await geminiService.generateProductImage(productName);
        if (img) updatePromo(promoId, { imageUrl: img });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(`${promoId}-${type}`);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Input de arquivo escondido para as ofertas */}
      <input 
        type="file" 
        ref={promoFileInputRef} 
        onChange={handleManualImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
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
          <button onClick={onEnterControllerMode} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
            <Smartphone size={18} /> Celular
          </button>
          <button onClick={onEnterTvMode} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
            <Tv size={18} /> Modo TV
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-fit mb-8 shadow-sm overflow-x-auto">
          {[
            { id: 'PRODUCTS', label: 'Tabela Preços', icon: Package },
            { id: 'PROMOS', label: 'Ofertas TV', icon: Tag },
            { id: 'SETTINGS', label: 'Configurações', icon: Settings2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'PRODUCTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Lista de Preços</h2>
              <button onClick={addProduct} className="bg-white border-2 border-slate-200 hover:border-red-600 hover:text-red-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
                <Plus size={18} /> Novo Item
              </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Produto</th>
                    <th className="px-8 py-4">Preço (R$)</th>
                    <th className="px-8 py-4">Un</th>
                    <th className="px-8 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-4">
                        <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} className="w-full bg-transparent font-bold text-slate-800 focus:ring-0 outline-none p-0" />
                      </td>
                      <td className="px-8 py-4">
                        <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-24 bg-transparent font-mono font-black text-slate-600 focus:ring-0 outline-none p-0" />
                      </td>
                      <td className="px-8 py-4">
                        <select value={p.unit} onChange={e => updateProduct(p.id, { unit: e.target.value })} className="bg-slate-100 border-none rounded-lg px-2 py-1 text-[10px] font-black outline-none">
                          {['KG', 'UN', 'PC', 'BD'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-2 text-slate-300 hover:text-red-600"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'PROMOS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex justify-between items-end mb-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ofertas em Destaque</h2>
              <button onClick={addPromo} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                <Plus size={18} /> Nova Promoção
              </button>
            </div>
            {state.promotions.map(promo => {
              const product = state.products.find(p => p.id === promo.productId);
              return (
                <div key={promo.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm relative group">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 rounded-2xl bg-slate-100 overflow-hidden relative border-2 border-slate-100 flex-shrink-0 group/img shadow-sm">
                      <img src={promo.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-3">
                        <button 
                          onClick={() => handleAiAction(promo.id, 'IMG', product?.name || 'Carne')}
                          disabled={loadingIds.has(`${promo.id}-IMG`)}
                          className="flex flex-col items-center gap-1 hover:text-red-400 transition-colors"
                        >
                          {loadingIds.has(`${promo.id}-IMG`) ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                          <span className="text-[8px] font-black uppercase tracking-widest">Gerar IA</span>
                        </button>
                        <div className="w-full h-[1px] bg-white/20 px-4" />
                        <button 
                          onClick={() => triggerManualUpload(promo.id)}
                          className="flex flex-col items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                          <FileUp size={24} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Sua Foto</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex-grow space-y-3">
                      <select value={promo.productId} onChange={e => updatePromo(promo.id, { productId: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none">
                        {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <label className="text-[8px] font-black text-slate-400 uppercase block">Preço Oferta</label>
                          <input type="number" step="0.01" value={promo.offerPrice} onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent text-xs font-black outline-none" />
                        </div>
                        <button onClick={() => handleAiAction(promo.id, 'DESC', product?.name || 'Carne')} className="bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase border border-blue-100">
                          <Wand2 size={12} /> Frase IA
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch checked={promo.isActive} onChange={(val) => updatePromo(promo.id, { isActive: val })} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{promo.isActive ? 'Ativo' : 'Pausado'}</span>
                      </div>
                    </div>
                  </div>
                  <textarea value={promo.description} onChange={e => updatePromo(promo.id, { description: e.target.value })} className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs outline-none h-16 resize-none" placeholder="Frase de marketing..." />
                  <button onClick={() => setState(prev => ({...prev, promotions: prev.promotions.filter(item => item.id !== promo.id)}))} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Settings2 className="text-red-600" /> Sistema</h3>
              <div className="space-y-4">
                <button onClick={exportData} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200">
                  <Download size={18} /> Backup dos Dados
                </button>
                <button onClick={() => window.aistudio?.openSelectKey()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Key size={18} /> Chave API Google
                </button>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Aviso de Imagens</p>
                  <p className="text-[11px] text-amber-600 leading-relaxed">As imagens geradas por IA ou enviadas manualmente são salvas localmente no navegador. Faça backup regularmente.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
