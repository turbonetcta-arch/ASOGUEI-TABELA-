
import React from 'react';
import { AppState, Product } from '../types';
import { ArrowLeft, Zap, Save, ChevronRight, ChevronLeft, Volume2 } from 'lucide-react';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
}

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit }) => {
  
  const updatePrice = (id: string, delta: number) => {
    // Feedback tátil simples (Android)
    if (navigator.vibrate) navigator.vibrate(50);
    
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === id ? { ...p, price: Math.max(0, p.price + delta) } : p
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col font-sans select-none animate-in fade-in duration-300">
      {/* Header do Controle */}
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

      {/* Lista de Preços Rápidos */}
      <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-24">
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
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Preço Atual</span>
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

      {/* Footer Fixo de Ação */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#1e293b]/90 backdrop-blur-xl border-t border-white/5 grid grid-cols-2 gap-4">
        <button 
          className="flex items-center justify-center gap-2 bg-slate-800 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5"
          onClick={() => alert('Sincronização Ativa com a TV')}
        >
          <Volume2 size={16} /> Chamar TV
        </button>
        <button 
          className="flex items-center justify-center gap-2 bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-900/20"
          onClick={onExit}
        >
          <Save size={16} /> Finalizar
        </button>
      </footer>
    </div>
  );
};

export default RemoteController;
