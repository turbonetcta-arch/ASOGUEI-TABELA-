
import React, { useState } from 'react';
import { AppState, Product } from '../types';
import { ArrowLeft, Zap, Save, Volume2, Star, X, Check } from 'lucide-react';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
}

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit }) => {
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
      <header className="p-4 bg-[#1e293b] flex items-center justify-between border-b border-white/5 shadow-xl">
        <button onClick={onExit} className="p-2 bg-white/5 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest">Controle Remoto</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{state.storeName}</p>
        </div>
        <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
          <Zap size={20} className="animate-pulse" />
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-32">
        {/* Banner de Status da Super Oferta */}
        {state.superOffer.isActive && (
          <div className="bg-yellow-400 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Star className="text-red-600 fill-red-600" />
              <div className="text-black">
                <p className="text-[10px] font-black uppercase tracking-tighter">Oferta Ativa na TV</p>
                <p className="text-sm font-bold uppercase truncate max-w-[150px]">
                  {state.products.find(p => p.id === state.superOffer.productId)?.name}
                </p>
              </div>
            </div>
            <button 
              onClick={deactivateSuperOffer}
              className="bg-red-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase"
            >
              Parar
            </button>
          </div>
        )}

        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ajuste de Preços Instantâneo</p>
        
        {state.products.map(p => (
          <div key={p.id} className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-sm uppercase truncate max-w-[60%]">{p.name}</span>
              <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                {p.unit}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => updatePrice(p.id, -1)}
                className="w-14 h-14 bg-red-600/20 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 active:bg-red-600 active:text-white transition-colors"
              >
                <span className="text-2xl font-black">-1</span>
              </button>
              
              <div className="text-center flex-grow">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Preço</span>
                <span className="text-3xl font-mono font-black text-white">
                  {p.price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button 
                onClick={() => updatePrice(p.id, 1)}
                className="w-14 h-14 bg-emerald-600/20 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20 active:bg-emerald-600 active:text-white transition-colors"
              >
                <span className="text-2xl font-black">+1</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Botões de Ação Fixos */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e293b]/90 backdrop-blur-xl border-t border-white/5 flex flex-col gap-3">
        <button 
          onClick={() => setShowSuperOfferModal(true)}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2 animate-bounce"
        >
          <Star size={18} className="fill-black" /> Lançar Oferta do Dia
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="flex items-center justify-center gap-2 bg-slate-800 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/5 text-slate-400"
            onClick={() => alert('Sincronização Ativa com a TV')}
          >
            <Volume2 size={14} /> Chamar TV
          </button>
          <button 
            className="flex items-center justify-center gap-2 bg-blue-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20"
            onClick={onExit}
          >
            <Check size={14} /> Salvar Tudo
          </button>
        </div>
      </footer>

      {/* Modal de Super Oferta */}
      {showSuperOfferModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-yellow-400 uppercase tracking-tighter italic">Escolha o Produto do Dia</h3>
            <button onClick={() => setShowSuperOfferModal(false)} className="p-2 bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-3 pb-8">
            {state.products.map(p => (
              <div key={p.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="font-bold text-sm uppercase mb-3">{p.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map(pct => (
                    <button 
                      key={pct}
                      onClick={() => setSuperOffer(p, pct)}
                      className="bg-yellow-400 text-black py-2 rounded-lg font-black text-[10px] uppercase"
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
    </div>
  );
};

export default RemoteController;
