
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Sparkles, Image as ImageIcon, Loader2, 
  Package, Tag, Settings2, Clock, CheckCircle2, Key, 
  Smartphone, Download, Upload, ShieldCheck, HardDrive,
  AlertCircle, Wand2
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
  const [hasApiKey, setHasApiKey] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    setSaveStatus('SAVING');
    const timer = setTimeout(() => setSaveStatus('SAVED'), 600);
    return () => clearTimeout(timer);
  }, [state]);

  const installApp = async () => {
    if (!deferredPrompt) {
      alert("O App já está instalado ou seu navegador não suporta instalação direta.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup_acougue_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.products && json.promotions) {
          setState(json);
          alert("Backup restaurado com sucesso!");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo de backup.");
      }
    };
    reader.readAsText(file);
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

  const removeProduct = (id: string) => {
    if (confirm('Excluir este item permanentemente?')) {
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        promotions: prev.promotions.filter(pr => pr.productId !== id)
      }));
    }
  };

  const removePromo = (id: string) => {
    if (confirm('Remover esta oferta da TV?')) {
      setState(prev => ({
        ...prev,
        promotions: prev.promotions.filter(p => p.id !== id)
      }));
    }
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
            <Package size={22} />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-3">
              <h1 className="font-extrabold text-xl tracking-tight">Painel Açougue</h1>
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-300 ${saveStatus === 'SAVING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {saveStatus === 'SAVING' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                {saveStatus === 'SAVING' ? 'Sincronizando' : 'Salvo'}
              </div>
            </div>
            <input 
              value={state.storeName}
              onChange={e => setState(prev => ({ ...prev, storeName: e.target.value.toUpperCase() }))}
              className="bg-transparent border-none p-0 h-5 text-slate-400 text-xs font-bold focus:ring-0 outline-none w-full"
              placeholder="NOME DO ESTABELECIMENTO"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={onEnterControllerMode}
            className="flex-grow md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Smartphone size={18} /> Celular
          </button>
          <button 
            onClick={onEnterTvMode}
            className="flex-grow md:flex-none bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Tv size={18} /> Projetar TV
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-fit mb-8 shadow-sm overflow-x-auto">
          {[
            { id: 'PRODUCTS', label: 'Tabela', icon: Package },
            { id: 'PROMOS', label: 'Ofertas TV', icon: Tag },
            { id: 'SETTINGS', label: 'Sistema & Baixa', icon: Settings2 }
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
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Lista de Preços</h2>
                <p className="text-slate-400 text-xs font-medium">Controle total dos cortes do seu açougue.</p>
              </div>
              <button onClick={addProduct} className="bg-white border-2 border-slate-200 hover:border-red-600 hover:text-red-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
                <Plus size={18} /> Novo Item
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Corte/Produto</th>
                    <th className="px-8 py-4">R$ Preço</th>
                    <th className="px-8 py-4">Un</th>
                    <th className="px-8 py-4 text-right">Opções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.products.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50/50">
                      <td className="px-8 py-4">
                        <input 
                          value={p.name}
                          onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })}
                          className="w-full bg-transparent font-bold text-slate-800 focus:ring-0 outline-none p-0"
                        />
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center font-mono font-black text-slate-600">
                          <span className="text-slate-300 mr-1">R$</span>
                          <input 
                            type="number" step="0.01" value={p.price}
                            onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })}
                            className="w-24 bg-transparent focus:ring-0 outline-none p-0"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <select 
                          value={p.unit}
                          onChange={e => updateProduct(p.id, { unit: e.target.value })}
                          className="bg-slate-100 border-none rounded-lg px-2 py-1 text-[10px] font-black outline-none"
                        >
                          {['KG', 'UN', 'PC', 'BD'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => removeProduct(p.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'PROMOS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ofertas em Destaque</h2>
                <p className="text-slate-400 text-xs font-medium">Estes itens aparecem com fotos grandes na TV.</p>
              </div>
              <button onClick={addPromo} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-100 transition-all hover:bg-red-700">
                <Plus size={18} /> Nova Promoção
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.promotions.map(promo => {
                const product = state.products.find(p => p.id === promo.productId);
                return (
                  <div key={promo.id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm relative group overflow-hidden">
                    <div className="flex gap-4">
                      {/* Imagem do Produto */}
                      <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-100 flex-shrink-0 group">
                        <img src={promo.imageUrl} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleAiAction(promo.id, 'IMG', product?.name || 'Carne')}
                          disabled={loadingIds.has(`${promo.id}-IMG`)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          {loadingIds.has(`${promo.id}-IMG`) ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                        </button>
                      </div>

                      <div className="flex-grow space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Produto na TV</label>
                            <select 
                              value={promo.productId}
                              onChange={e => updatePromo(promo.id, { productId: e.target.value })}
                              className="w-full bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none"
                            >
                              {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <ToggleSwitch checked={promo.isActive} onChange={(val) => updatePromo(promo.id, { isActive: val })} />
                             <span className={`text-[9px] font-bold uppercase ${promo.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                               {promo.isActive ? 'Ativo' : 'Pausado'}
                             </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Preço Oferta</label>
                            <div className="flex items-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                              <span className="text-slate-400 font-bold text-xs mr-1">R$</span>
                              <input 
                                type="number" step="0.01" value={promo.offerPrice}
                                onChange={e => updatePromo(promo.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-end">
                            <button 
                              onClick={() => handleAiAction(promo.id, 'DESC', product?.name || 'Carne')}
                              disabled={loadingIds.has(`${promo.id}-DESC`)}
                              className="w-full h-[34px] bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tight hover:bg-blue-100 transition-colors"
                            >
                              {loadingIds.has(`${promo.id}-DESC`) ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                              Slogan IA
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Frase de Marketing (TV)</label>
                      <textarea 
                        value={promo.description}
                        onChange={e => updatePromo(promo.id, { description: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                        placeholder="Ex: A melhor picanha para o seu churrasco!"
                      />
                    </div>

                    <button 
                      onClick={() => removePromo(promo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              {state.promotions.length === 0 && (
                <div className="md:col-span-2 py-12 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
                  <Tag size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-sm">Nenhuma oferta cadastrada.</p>
                  <p className="text-xs">Clique em "Nova Promoção" para começar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Coluna: Tempos e IA */}
            <div className="space-y-6">
               <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-red-600 mb-6">
                  <Clock size={24} />
                  <h3 className="font-black text-lg">Tempos da TV</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rotação de Ofertas (Segundos)</label>
                    <input 
                      type="range" min="3" max="60" step="1"
                      value={state.promoInterval / 1000}
                      onChange={e => setState(prev => ({ ...prev, promoInterval: parseInt(e.target.value) * 1000 }))}
                      className="w-full accent-red-600"
                    />
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>3s</span>
                      <span className="text-red-600 bg-red-50 px-2 rounded">{state.promoInterval / 1000}s</span>
                      <span>60s</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Troca de Página Tabela (Segundos)</label>
                    <input 
                      type="range" min="5" max="120" step="1"
                      value={state.productPageInterval / 1000}
                      onChange={e => setState(prev => ({ ...prev, productPageInterval: parseInt(e.target.value) * 1000 }))}
                      className="w-full accent-red-600"
                    />
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>5s</span>
                      <span className="text-red-600 bg-red-50 px-2 rounded">{state.productPageInterval / 1000}s</span>
                      <span>120s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-blue-600 mb-6">
                  <Key size={24} />
                  <h3 className="font-black text-lg">Inteligência Artificial</h3>
                </div>
                <button 
                  onClick={() => window.aistudio?.openSelectKey()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm mb-3"
                >
                  <Key size={16} /> Configurar Gemini API
                </button>
                <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[10px] font-medium leading-relaxed">
                    As chaves de API são necessárias para gerar imagens profissionais e textos de marketing. Recomendamos uma chave paga do Google para maior velocidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna: Baixa e Backup */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-blue-50">
                <div className="flex items-center gap-3 text-blue-600 mb-6">
                  <ShieldCheck size={24} />
                  <h3 className="font-black text-lg">Download do Aplicativo</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
                  Instale este painel no seu celular ou na TV para funcionar como um APK nativo, sem barras de navegação.
                </p>
                <button 
                  onClick={installApp}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-100"
                >
                  <Download size={20} /> Baixar APK do Sistema
                </button>
                {!deferredPrompt && (
                  <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    O App já está disponível para uso offline.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-700 mb-6">
                  <HardDrive size={24} />
                  <h3 className="font-black text-lg">Gestão de Dados (Baixa)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={exportData}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-slate-100 hover:border-red-600 hover:bg-red-50 p-4 rounded-2xl transition-all group"
                  >
                    <Download size={24} className="text-slate-400 group-hover:text-red-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-red-600">Backup</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 p-4 rounded-2xl transition-all group"
                  >
                    <Upload size={24} className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">Restaurar</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={importData} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
                <p className="mt-4 text-[10px] text-slate-400 text-center font-bold uppercase">
                  Proteja seus preços exportando um arquivo de segurança.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
