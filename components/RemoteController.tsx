
import React, { useState } from 'react';
import { AppState, Product, Promotion } from '../types';
// Adicionando RefreshCcw que estava faltando no import para corrigir o erro na linha 128
import { ArrowLeft, Zap, Volume2, Star, X, Check, Package, Tag, Power, Monitor, Tv, Wifi, Globe, Server, RefreshCcw } from 'lucide-react';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
  sendRemoteCommand?: (command: string, payload?: any) => void;
  remoteIp?: string;
}

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit, sendRemoteCommand, remoteIp }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS'>('PRODUCTS');
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const triggerCommandFeedback = (msg: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setLastCommand(msg);
    setTimeout(() => setLastCommand(null), 2000);
  };

  const updatePrice = (id: string, delta: number) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === id ? { ...p, price: Math.max(0, p.price + delta) } : p
      )
    }));
    triggerCommandFeedback('PREÇO ATUALIZADO');
  };

  const handleRemoteSetTvMode = () => {
    if (sendRemoteCommand) {
      sendRemoteCommand('SET_MODE', 'TV');
      triggerCommandFeedback('TV ATIVADA VIA CLOUD');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* FEEDBACK DE COMANDO REMOTO */}
      {lastCommand && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-in slide-in-from-top duration-300 tracking-[0.2em] italic">
          {lastCommand}
        </div>
      )}

      <header className="p-5 bg-[#0f172a] flex flex-col border-b border-white/5 shadow-2xl gap-5">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="p-3 bg-white/5 rounded-2xl"><ArrowLeft size={24} /></button>
          <div className="text-center">
            <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center justify-center gap-2">
               <Zap size={10} className="animate-pulse" /> Servidor Fabio FCell
            </h2>
            <p className="text-[11px] font-bold text-white/40 uppercase truncate max-w-[200px] mt-1 tracking-widest">{state.storeName}</p>
          </div>
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={handleRemoteSetTvMode}
                className="group flex flex-col items-center justify-center gap-2 bg-red-600 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl active:scale-95 transition-all border-b-8 border-red-900"
            >
                <Tv size={28} />
                Ligar TVs
            </button>
            <button 
                onClick={() => { if (sendRemoteCommand) sendRemoteCommand('SET_MODE', 'ADMIN'); triggerCommandFeedback('PAINEL ATIVADO'); }}
                className="group flex flex-col items-center justify-center gap-2 bg-slate-800 py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-2xl active:scale-95 transition-all border-b-8 border-slate-950"
            >
                <Monitor size={28} />
                Gerenciar
            </button>
        </div>

        <nav className="flex bg-black/40 p-1.5 rounded-2xl gap-1">
          <button onClick={() => setActiveTab('PRODUCTS')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}>
            <Package size={16} /> Tabela de Preços
          </button>
          <button onClick={() => setActiveTab('PROMOS')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'PROMOS' ? 'bg-red-600 text-white shadow-lg' : 'text-white/40'}`}>
            <Tag size={16} /> Ofertas Ativas
          </button>
        </nav>
      </header>

      <main className="flex-grow overflow-y-auto p-5 space-y-4 pb-40">
        {activeTab === 'PRODUCTS' ? (
          state.products.map(p => (
            <div key={p.id} className="bg-[#1e293b] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="font-black text-sm uppercase truncate max-w-[70%] tracking-tight">{p.name}</span>
                <span className="bg-white/5 text-white/30 text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">{p.unit}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <button onClick={() => updatePrice(p.id, -1)} className="w-20 h-20 bg-red-600/10 text-red-500 rounded-3xl flex items-center justify-center border border-red-500/20 active:bg-red-600 active:text-white transition-all">
                  <span className="text-3xl font-black">-1</span>
                </button>
                <div className="text-center flex-grow">
                  <span className="text-[9px] text-white/30 font-black uppercase block mb-1 tracking-[0.2em]">PREÇO NO SERVIDOR</span>
                  <span className="text-4xl font-mono font-black text-white tracking-tighter italic">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <button onClick={() => updatePrice(p.id, 1)} className="w-20 h-20 bg-emerald-600/10 text-emerald-500 rounded-3xl flex items-center justify-center border border-emerald-500/20 active:bg-emerald-600 active:text-white transition-all">
                  <span className="text-3xl font-black">+1</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-20"><Tag size={64} className="mx-auto" /><p className="font-black mt-4 uppercase">Gerencie ofertas no painel admin</p></div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/5 flex flex-col gap-4 z-50">
        <div className="flex items-center justify-between px-4 mb-2">
           <div className="flex items-center gap-2">
              <Server size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{remoteIp}</span>
           </div>
           <span className="text-[10px] font-black text-red-500 uppercase italic">Servidor Fabio FCell</span>
        </div>
        <button onClick={() => { if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE', state); triggerCommandFeedback('SINCRONIZAÇÃO FORÇADA'); }} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl border-b-4 border-blue-900">
          <RefreshCcw size={20} /> Atualizar Todas as Telas
        </button>
      </footer>
    </div>
  );
};

export default RemoteController;
