
import React, { useState } from 'react';
import { AppState, Product, Promotion } from '../types';
import { ArrowLeft, Zap, Volume2, Star, X, Check, Package, Tag, Power, Monitor, Tv, Wifi, Globe } from 'lucide-react';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
  sendRemoteCommand?: (command: string, payload?: any) => void;
}

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit, sendRemoteCommand }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS'>('PRODUCTS');
  const [showSuperOfferModal, setShowSuperOfferModal] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

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

  const handleRemoteSetTvMode = () => {
    if (sendRemoteCommand) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      sendRemoteCommand('SET_MODE', 'TV');
      setLastCommand('TV ATIVADA');
      setTimeout(() => setLastCommand(null), 3000);
    }
  };

  const handleRemoteSetAdminMode = () => {
    if (sendRemoteCommand) {
      sendRemoteCommand('SET_MODE', 'ADMIN');
      setLastCommand('PAINEL ATIVADO');
      setTimeout(() => setLastCommand(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col font-sans select-none animate-in fade-in duration-300">
      
      {/* STATUS DE COMANDO REMOTO */}
      {lastCommand && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-2xl animate-in slide-in-from-top duration-300 tracking-[0.2em]">
          {lastCommand}
        </div>
      )}

      <header className="p-4 bg-[#141414] flex flex-col border-b border-white/5 shadow-2xl gap-4">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="p-2 bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
          <div className="text-center">
            <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
               <Globe size={10} /> Conexão WiFi Ativa
            </h2>
            <p className="text-[11px] font-bold text-white/40 uppercase truncate max-w-[180px] mt-1">{state.storeName}</p>
          </div>
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* CONTROLE DE ENERGIA DA TV (CENTRAL) */}
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={handleRemoteSetTvMode}
                className="group flex flex-col items-center justify-center gap-2 bg-red-600 py-4 rounded-3xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all border-b-4 border-red-800"
            >
                <Power size={24} className="group-active:scale-110 transition-transform" />
                ATIVAR TV
            </button>
            <button 
                onClick={handleRemoteSetAdminMode}
                className="group flex flex-col items-center justify-center gap-2 bg-slate-800 py-4 rounded-3xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all border-b-4 border-slate-900"
            >
                <Monitor size={24} className="group-active:scale-110 transition-transform" />
                ABRIR PAINEL
            </button>
        </div>

        <nav className="flex bg-black/40 p-1.5 rounded-2xl gap-1">
          <button onClick={() => setActiveTab('PRODUCTS')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>
            <Package size={14} /> Tabela
          </button>
          <button onClick={() => setActiveTab('PROMOS')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'PROMOS' ? 'bg-red-600 text-white shadow-lg' : 'text-white/40'}`}>
            <Tag size={14} /> Ofertas
          </button>
        </nav>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-48">
        {activeTab === 'PRODUCTS' ? (
          state.products.map(p => (
            <div key={p.id} className="bg-[#1a1a1a] rounded-3xl p-5 border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-sm uppercase truncate max-w-[70%] tracking-tight">{p.name}</span>
                <span className="bg-white/10 text-white/40 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{p.unit}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <button onClick={() => updatePrice(p.id, -1)} className="w-20 h-20 bg-red-600/10 text-red-500 rounded-3xl flex items-center justify-center border border-red-500/20 active:bg-red-600 active:text-white transition-all">
                  <span className="text-3xl font-black">-1</span>
                </button>
                <div className="text-center flex-grow">
                  <span className="text-[9px] text-white/30 font-black uppercase block mb-1 tracking-[0.2em]">R$ / {p.unit}</span>
                  <span className="text-4xl font-mono font-black text-white tracking-tighter">{p.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <button onClick={() => updatePrice(p.id, 1)} className="w-20 h-20 bg-emerald-600/10 text-emerald-500 rounded-3xl flex items-center justify-center border border-emerald-500/20 active:bg-emerald-600 active:text-white transition-all">
                  <span className="text-3xl font-black">+1</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          state.promotions.map(promo => {
            const product = state.products.find(p => p.id === promo.productId);
            return (
              <div key={promo.id} className={`bg-[#1a1a1a] rounded-3xl p-5 border transition-all ${promo.isActive ? 'border-red-500/30' : 'border-white/5 opacity-40 shadow-none'}`}>
                <div className="flex items-start gap-4 mb-5">
                  <img src={promo.imageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/5" />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start pt-1">
                      <span className="font-black text-sm uppercase truncate pr-4 tracking-tight">{product?.name || 'PRODUTO'}</span>
                      <button onClick={() => togglePromo(promo.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${promo.isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'bg-white/5 text-white/20'}`}><Power size={18} /></button>
                    </div>
                    <p className="text-[10px] text-white/30 font-bold uppercase mt-1">Oferta Exclusiva</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <button onClick={() => updatePromoPrice(promo.id, -1)} className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center active:bg-red-600 active:text-white transition-all"><span className="text-2xl font-black">-1</span></button>
                  <div className="text-center">
                    <span className="text-[9px] text-yellow-400 font-black uppercase block mb-1 tracking-widest">OFERTA TV</span>
                    <span className="text-3xl font-mono font-black text-yellow-400 tracking-tighter">{promo.offerPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button onClick={() => updatePromoPrice(promo.id, 1)} className="w-16 h-16 bg-emerald-600/10 text-emerald-500 rounded-2xl flex items-center justify-center active:bg-emerald-600 active:text-white transition-all"><span className="text-2xl font-black">+1</span></button>
                </div>
              </div>
            );
          })
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-[#141414]/90 backdrop-blur-2xl border-t border-white/5 flex flex-col gap-4 z-50">
        <button onClick={() => setShowSuperOfferModal(true)} className="w-full bg-yellow-400 text-black py-5 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl shadow-yellow-900/40 border-b-4 border-yellow-600">
          <Star size={20} className="fill-black" /> ATIVAR FLASH DO DIA
        </button>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 bg-white/5 py-4 rounded-2xl font-black uppercase text-[10px] text-white/40 active:bg-white/10" onClick={() => alert('Sinal enviado para TV!')}><Volume2 size={16} /> Chamar TV</button>
          <button className="flex items-center justify-center gap-3 bg-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg active:bg-blue-700" onClick={onExit}><Check size={16} /> Finalizar</button>
        </div>
      </footer>

      {showSuperOfferModal && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex flex-col p-8 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-3xl font-black text-yellow-400 uppercase italic leading-none">Flash Especial</h3>
              <p className="text-[10px] font-black text-white/30 uppercase mt-2 tracking-[0.3em]">Seleção de Destaque TV</p>
            </div>
            <button onClick={() => setShowSuperOfferModal(false)} className="p-4 bg-white/5 rounded-full text-white/40 hover:text-white"><X size={28} /></button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-4 pb-12">
            {state.products.map(p => {
              const isSelected = state.superOffer.productIds.includes(p.id);
              return (
                <div key={p.id} className={`p-5 rounded-[2.5rem] border transition-all duration-300 ${isSelected ? 'bg-yellow-400/10 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.1)]' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex justify-between items-center mb-5 px-2">
                    <p className={`font-black text-sm uppercase tracking-tight ${isSelected ? 'text-yellow-400' : 'text-white/60'}`}>{p.name}</p>
                    {isSelected && <Check size={24} className="text-yellow-400" />}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[10, 20, 30].map(pct => (
                      <button 
                        key={pct}
                        onClick={() => toggleSuperOfferProduct(p, pct)}
                        className={`py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${isSelected ? 'bg-yellow-400 text-black scale-105 shadow-xl' : 'bg-white/5 text-white/30'}`}
                      >
                        -{pct}%
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowSuperOfferModal(false)} className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase text-sm mt-4 shadow-2xl border-b-4 border-red-800">Sincronizar com TV</button>
        </div>
      )}
    </div>
  );
};

export default RemoteController;
