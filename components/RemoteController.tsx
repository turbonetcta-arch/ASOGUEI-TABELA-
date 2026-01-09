
import React, { useState } from 'react';
import { AppState, Product, Promotion } from '../types';
import { ArrowLeft, Zap, Save, Volume2, Star, X, Check, Package, Tag, Power } from 'lucide-react';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
}

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS'>('PRODUCTS');
  const [showSuperOfferModal, setShowSuperOfferModal] = useState(false);

  const updatePrice = (id: string, delta: number) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === id ? { ...p, price: Math.max(0, p.price + delta) } : p
      )
    }));
  };

  const updatePromoPrice = (id: string, delta: number) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setState(prev => ({
      ...prev,
      promotions: prev.promotions.map(p => 
        p.id === id ? { ...p, offerPrice: Math.max(0, p.offerPrice + delta) } : p
      )
    }));
  };

  const togglePromo = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setState(prev => ({
      ...prev,
      promotions: prev.promotions.map(p => 
        p.id === id ? { ...p, isActive: !p.isActive } : p
      )
    }));
  };

  const setSuperOffer = (product: Product, discountPercent: number) => {
    if (navigator.vibrate) navigator.vibrate(100);
    const discountPrice = product.price * (1 - discountPercent / 100);
    setState(prev => ({
      ...prev,
      superOffer: {
        productId: product.id,
        discountPrice: parseFloat(discountPrice.toFixed(2)),
        isActive: true
      }
    }));
    setShowSuperOfferModal(false);
  };

  const deactivateSuperOffer = () => {
    setState(prev => ({
      ...prev,
      superOffer: { ...prev.superOffer, isActive: false }
    }));
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col font-sans select-none animate-in fade-in duration-300">
      <header className="p-4 bg-[#1e293b] flex flex-col border-b border-white/5 shadow-xl gap-4">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="p-2 bg-white/5 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest">Modo Celular</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{state.storeName}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
            <Zap size={20} className="animate-pulse" />
          </div>
        </div>

        <nav className="flex bg-[#0f172a] p-1 rounded-xl gap-1">
          <button 
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'PRODUCTS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <Package size={14} /> Tabela Preços
          </button>
          <button 
            onClick={() => setActiveTab('PROMOS')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'PROMOS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <Tag size={14} /> Ofertas TV
          </button>
        </nav>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-40">
        {/* Banner de Status da Super Oferta */}
        {state.superOffer.isActive && (
          <div className="bg-yellow-400 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Star className="text-red-600 fill-red-600" />
              <div className="text-black">
                <p className="text-[10px] font-black uppercase tracking-tighter leading-none">Flash Oferta Ativa</p>
                <p className="text-sm font-black uppercase truncate max-w-[150px]">
                  {state.products.find(p => p.id === state.superOffer.productId)?.name}
                </p>
              </div>
            </div>
            <button 
              onClick={deactivateSuperOffer}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-900/40"
            >
              Parar
            </button>
          </div>
        )}

        {activeTab === 'PRODUCTS' ? (
          <>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Ajuste de Preços Instantâneo</p>
            {state.products.map(p => (
              <div key={p.id} className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm uppercase truncate max-w-[60%] tracking-tight">{p.name}</span>
                  <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                    / {p.unit}
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <button 
                    onClick={() => updatePrice(p.id, -1)}
                    className="w-16 h-16 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 active:bg-red-600 active:text-white transition-all shadow-inner"
                  >
                    <span className="text-2xl font-black">-1</span>
                  </button>
                  
                  <div className="text-center flex-grow">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Preço Atual</span>
                    <span className="text-3xl font-mono font-black text-white tracking-tighter">
                      {p.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button 
                    onClick={() => updatePrice(p.id, 1)}
                    className="w-16 h-16 bg-emerald-600/20 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 active:bg-emerald-600 active:text-white transition-all shadow-inner"
                  >
                    <span className="text-2xl font-black">+1</span>
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Gerenciar Ofertas da TV</p>
            {state.promotions.map(promo => {
              const product = state.products.find(p => p.id === promo.productId);
              return (
                <div key={promo.id} className={`bg-[#1e293b] rounded-2xl p-4 border transition-all ${promo.isActive ? 'border-red-500/30 ring-1 ring-red-500/10' : 'border-white/5 opacity-60'}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-[#0f172a] overflow-hidden flex-shrink-0 border border-white/5">
                      <img src={promo.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm uppercase truncate pr-2">{product?.name || '---'}</span>
                        <button 
                          onClick={() => togglePromo(promo.id)}
                          className={`p-2 rounded-lg transition-colors ${promo.isActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-1">"{promo.description}"</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => updatePromoPrice(promo.id, -1)}
                      className="w-14 h-14 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center active:bg-red-600 active:text-white transition-all"
                    >
                      <span className="text-xl font-black">-1</span>
                    </button>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 font-black uppercase block leading-none">Oferta</span>
                      <span className="text-2xl font-mono font-black text-yellow-400">
                        {promo.offerPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button 
                      onClick={() => updatePromoPrice(promo.id, 1)}
                      className="w-14 h-14 bg-emerald-600/10 text-emerald-500 rounded-xl flex items-center justify-center active:bg-emerald-600 active:text-white transition-all"
                    >
                      <span className="text-xl font-black">+1</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>

      {/* Botões de Ação Fixos */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e293b]/90 backdrop-blur-xl border-t border-white/5 flex flex-col gap-3 z-50">
        <button 
          onClick={() => setShowSuperOfferModal(true)}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-yellow-900/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Star size={18} className="fill-black animate-spin-slow" /> Flash Oferta (DIA)
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="flex items-center justify-center gap-2 bg-slate-800 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/5 text-slate-400"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              alert('Solicitação de atendimento enviada para a TV!');
            }}
          >
            <Volume2 size={14} /> Chamar TV
          </button>
          <button 
            className="flex items-center justify-center gap-2 bg-blue-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/40 active:bg-blue-500"
            onClick={onExit}
          >
            <Check size={14} /> Finalizar
          </button>
        </div>
      </footer>

      {/* Modal de Super Oferta */}
      {showSuperOfferModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col">
              <h3 className="text-2xl font-black text-yellow-400 uppercase tracking-tighter italic leading-none">Escolha a Peça</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Surgirá um destaque gigante na TV</p>
            </div>
            <button onClick={() => setShowSuperOfferModal(false)} className="p-3 bg-white/10 rounded-full text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-3 pb-8">
            {state.products.map(p => (
              <div key={p.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-yellow-400/50 transition-colors">
                <p className="font-bold text-sm uppercase mb-4 tracking-tight">{p.name}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 20, 30].map(pct => (
                    <button 
                      key={pct}
                      onClick={() => setSuperOffer(p, pct)}
                      className="bg-yellow-400 active:bg-yellow-500 text-black py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-900/20"
                    >
                      -{pct}% OFF
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default RemoteController;
