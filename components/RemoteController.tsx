
import React, { useState } from 'react';
import { AppState, Product, Promotion } from '../types';
import { ArrowLeft, Zap, Volume2, Star, X, Check, Package, Tag, Power, Monitor, Tv } from 'lucide-react';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
  sendRemoteCommand?: (command: string, payload?: any) => void;
}

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit, sendRemoteCommand }) => {
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

  const toggleSuperOfferProduct = (product: Product, discountPercent: number) => {
    if (navigator.vibrate) navigator.vibrate(70);
    
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

  const deactivateSuperOffer = () => {
    setState(prev => ({
      ...prev,
      superOffer: { ...prev.superOffer, isActive: false, productIds: [] }
    }));
  };

  const handleRemoteSetTvMode = () => {
    if (sendRemoteCommand) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      sendRemoteCommand('SET_MODE', 'TV');
      alert("Comando enviado! A TV pareada entrará no Modo Menu.");
    }
  };

  const handleRemoteSetAdminMode = () => {
    if (sendRemoteCommand) {
      sendRemoteCommand('SET_MODE', 'ADMIN');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col font-sans select-none animate-in fade-in duration-300">
      <header className="p-4 bg-[#1e293b] flex flex-col border-b border-white/5 shadow-xl gap-4">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
          <div className="text-center">
            <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest">Controle Remoto</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{state.storeName}</p>
          </div>
          <button 
            onClick={handleRemoteSetTvMode}
            className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center text-red-500 border border-red-500/30 active:scale-90 transition-transform"
            title="Ativar Modo TV na Tela Pareada"
          >
            <Tv size={20} />
          </button>
        </div>

        <nav className="flex bg-[#0f172a] p-1 rounded-xl gap-1">
          <button onClick={() => setActiveTab('PRODUCTS')} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'PRODUCTS' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>Preços</button>
          <button onClick={() => setActiveTab('PROMOS')} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'PROMOS' ? 'bg-red-600 shadow-lg' : 'text-slate-500'}`}>Ofertas</button>
        </nav>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-40">
        <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
                onClick={handleRemoteSetTvMode}
                className="flex items-center justify-center gap-2 bg-red-600 py-3 rounded-xl font-black uppercase text-[9px] shadow-lg active:bg-red-700"
            >
                <Tv size={14} /> Ativar Modo TV
            </button>
            <button 
                onClick={handleRemoteSetAdminMode}
                className="flex items-center justify-center gap-2 bg-slate-800 py-3 rounded-xl font-black uppercase text-[9px] border border-white/5 active:bg-slate-700"
            >
                <Monitor size={14} /> Abrir Painel
            </button>
        </div>

        {state.superOffer.isActive && (
          <div className="bg-yellow-400 p-4 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Star className="text-red-600 fill-red-600" />
              <div className="text-black">
                <p className="text-[10px] font-black uppercase">Flash Ativo</p>
                <p className="text-sm font-black uppercase">{state.superOffer.productIds.length} Itens Selecionados</p>
              </div>
            </div>
            <button onClick={deactivateSuperOffer} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Parar Tudo</button>
          </div>
        )}

        {activeTab === 'PRODUCTS' ? (
          state.products.map(p => (
            <div key={p.id} className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm uppercase truncate max-w-[60%]">{p.name}</span>
                <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-1 rounded-lg">/ {p.unit}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <button onClick={() => updatePrice(p.id, -1)} className="w-16 h-16 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 active:bg-red-600">
                  <span className="text-2xl font-black">-1</span>
                </button>
                <div className="text-center flex-grow">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">PREÇO ATUAL</span>
                  <span className="text-3xl font-mono font-black text-white">{p.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <button onClick={() => updatePrice(p.id, 1)} className="w-16 h-16 bg-emerald-600/20 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 active:bg-emerald-600">
                  <span className="text-2xl font-black">+1</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          state.promotions.map(promo => {
            const product = state.products.find(p => p.id === promo.productId);
            return (
              <div key={promo.id} className={`bg-[#1e293b] rounded-2xl p-4 border transition-all ${promo.isActive ? 'border-red-500/30' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start gap-4 mb-4">
                  <img src={promo.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm uppercase truncate pr-2">{product?.name || '---'}</span>
                      <button onClick={() => togglePromo(promo.id)} className={`p-2 rounded-lg ${promo.isActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}><Power size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <button onClick={() => updatePromoPrice(promo.id, -1)} className="w-14 h-14 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center active:bg-red-600"><span className="text-xl font-black">-1</span></button>
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 font-black uppercase block">Oferta R$</span>
                    <span className="text-2xl font-mono font-black text-yellow-400">{promo.offerPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button onClick={() => updatePromoPrice(promo.id, 1)} className="w-14 h-14 bg-emerald-600/10 text-emerald-500 rounded-xl flex items-center justify-center active:bg-emerald-600"><span className="text-xl font-black">+1</span></button>
                </div>
              </div>
            );
          })
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e293b]/90 backdrop-blur-xl border-t border-white/5 flex flex-col gap-3 z-50">
        <button onClick={() => setShowSuperOfferModal(true)} className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-yellow-900/40">
          <Star size={18} className="fill-black" /> SELECIONAR FLASH (DIA)
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-slate-800 py-3 rounded-xl font-black uppercase text-[10px] text-slate-400" onClick={() => alert('Atendimento chamado!')}><Volume2 size={14} /> Chamar TV</button>
          <button className="flex items-center justify-center gap-2 bg-blue-600 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-blue-900/40" onClick={onExit}><Check size={14} /> Finalizar</button>
        </div>
      </footer>

      {showSuperOfferModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-yellow-400 uppercase italic">Multi-Flash do Dia</h3>
            <button onClick={() => setShowSuperOfferModal(false)} className="p-3 bg-white/10 rounded-full text-white"><X size={24} /></button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-3 pb-8">
            {state.products.map(p => {
              const isSelected = state.superOffer.productIds.includes(p.id);
              return (
                <div key={p.id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'bg-yellow-400/20 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <p className={`font-bold text-sm uppercase ${isSelected ? 'text-yellow-400' : 'text-white'}`}>{p.name}</p>
                    {isSelected && <Check size={20} className="text-yellow-400" />}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[10, 20, 30].map(pct => (
                      <button 
                        key={pct}
                        onClick={() => toggleSuperOfferProduct(p, pct)}
                        className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all ${isSelected ? 'bg-yellow-400 text-black scale-105 shadow-lg' : 'bg-white/10 text-white/50'}`}
                      >
                        -{pct}% OFF
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowSuperOfferModal(false)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-sm mt-4 shadow-xl">Confirmar Seleção</button>
        </div>
      )}
    </div>
  );
};

export default RemoteController;
