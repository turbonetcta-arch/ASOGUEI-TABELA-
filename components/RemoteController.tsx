
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Product } from '../types';
import { 
  ArrowLeft, Zap, Smartphone, Package, Tag, Tv, 
  Monitor, RefreshCcw, Wifi, Bot, Loader2, ImageIcon, Wand,
  Sparkles, Camera
} from 'lucide-react';
import { geminiService } from '../services/gemini';

interface RemoteControllerProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onExit: () => void;
  sendRemoteCommand?: (command: string, payload?: any) => void;
  remoteIp?: string;
}

const AI_MESSAGES = [
  "Preparando iluminação gourmet...",
  "Selecionando melhor ângulo...",
  "Realçando o marmoreio da carne...",
  "Ajustando texturas premium...",
  "Finalizando arte cinematográfica..."
];

const RemoteController: React.FC<RemoteControllerProps> = ({ state, setState, onExit, sendRemoteCommand, remoteIp }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS'>('PROMOS'); // Inicia em Promos pois o foco é trocar fotos
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [aiMsgIndex, setAiMsgIndex] = useState(0);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  useEffect(() => {
    let interval: number;
    if (loadingIds.size > 0) {
      interval = window.setInterval(() => {
        setAiMsgIndex(prev => (prev + 1) % AI_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loadingIds.size]);

  const triggerCommandFeedback = (msg: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setLastCommand(msg);
    setTimeout(() => setLastCommand(null), 2500);
  };

  const updatePrice = (id: string, delta: number) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === id ? { ...p, price: Number((Math.max(0, p.price + delta)).toFixed(2)) } : p
      )
    }));
    triggerCommandFeedback('PREÇO ATUALIZADO');
  };

  const handleAiPhotoChange = useCallback(async (promoId: string, productName: string) => {
    const key = `${promoId}-AI`;
    setLoadingIds(prev => new Set(prev).add(key));
    setAiMsgIndex(0);
    
    try {
      const img = await geminiService.generateProductImage(productName, false, "16:9");

      if (img) {
        setState(prev => ({
          ...prev,
          promotions: prev.promotions.map(p => 
            p.id === promoId ? { ...p, imageUrl: img } : p
          )
        }));
        triggerCommandFeedback('NOVA FOTO APLICADA!');
      } else {
        triggerCommandFeedback('IA FALHOU. TENTE DE NOVO');
      }
    } catch (e) {
      triggerCommandFeedback('ERRO DE CONEXÃO');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [setState]);

  // EFEITO: Gera automaticamente a imagem para a PRIMEIRA oferta ao carregar a aba 'PROMOS'
  useEffect(() => {
    if (activeTab === 'PROMOS' && !hasAutoStarted && state.promotions.length > 0) {
      const firstPromo = state.promotions[0];
      const product = state.products.find(p => p.id === firstPromo.productId);
      if (product) {
        handleAiPhotoChange(firstPromo.id, product.name);
        setHasAutoStarted(true);
      }
    }
  }, [activeTab, state.promotions, state.products, hasAutoStarted, handleAiPhotoChange]);

  return (
    <div className="fixed inset-0 bg-[#050505] text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* STATUS BAR CLOUD */}
      <div className="bg-indigo-600 px-4 py-1 flex justify-between items-center border-b border-white/10">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Cloud Sync Active</span>
         </div>
         <span className="text-[8px] font-black text-white/50 uppercase tracking-widest italic">Açougue Premium v4.2</span>
      </div>

      {/* FEEDBACK OVERLAY */}
      {lastCommand && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[300] bg-white text-black px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-[0_20px_50px_rgba(255,255,255,0.2)] animate-in zoom-in duration-300 border-2 border-indigo-500 text-center">
          {lastCommand}
        </div>
      )}

      <header className="p-6 bg-[#0a0a0a] flex flex-col border-b border-white/5 gap-6">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tighter italic uppercase text-white leading-none">STUDIO MÍDIA</h1>
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1 italic">Controle Remoto IA</p>
          </div>
          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
             <Camera size={20} className="text-indigo-400" />
          </div>
        </div>

        <nav className="flex bg-white/5 p-1 rounded-2xl gap-1">
          <button onClick={() => setActiveTab('PROMOS')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'PROMOS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-white/30'}`}>
            <Sparkles size={16} /> Trocar Fotos
          </button>
          <button onClick={() => setActiveTab('PRODUCTS')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-white text-black' : 'text-white/30'}`}>
            <Package size={16} /> Preços KG
          </button>
        </nav>
      </header>

      <main className="flex-grow overflow-y-auto p-6 space-y-6 pb-48 bg-[#050505]">
        {activeTab === 'PROMOS' ? (
          state.promotions.map((promo, idx) => {
            const product = state.products.find(prod => prod.id === promo.productId);
            const isAiLoading = loadingIds.has(`${promo.id}-AI`);
            
            return (
              <div key={promo.id} className="bg-[#111] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                
                {isAiLoading && (
                  <div className="absolute inset-0 bg-indigo-600 z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <Loader2 className="animate-spin text-white mb-6" size={48} />
                    <p className="text-xl font-black uppercase italic tracking-tighter leading-tight animate-pulse">
                      {AI_MESSAGES[aiMsgIndex]}
                    </p>
                    <span className="text-[10px] mt-4 font-bold text-white/50 uppercase tracking-widest">IA Gemini 2.5 Flash</span>
                  </div>
                )}

                <div className="flex flex-col gap-6">
                  <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-white/10 shadow-inner">
                    <img src={promo.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-4 left-4">
                       <h4 className="font-black text-xl uppercase italic leading-none">{product?.name}</h4>
                       <p className="text-indigo-400 font-bold text-sm">R$ {promo.offerPrice.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleAiPhotoChange(promo.id, product?.name || '')}
                      disabled={isAiLoading}
                      className="bg-indigo-600 active:bg-indigo-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                    >
                      <Bot size={18} /> Mudar Foto IA
                    </button>
                    <button 
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          promotions: prev.promotions.map(pr => pr.id === promo.id ? { ...pr, isActive: !pr.isActive } : pr)
                        }));
                        triggerCommandFeedback(promo.isActive ? 'OFERTA REMOVIDA DA TV' : 'OFERTA ATIVA NA TV');
                      }}
                      className={`py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${promo.isActive ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg' : 'bg-white/5 text-white/40'}`}
                    >
                      <Tv size={18} /> {promo.isActive ? 'No Ar' : 'Exibir'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="space-y-4">
             {state.products.map(p => (
               <div key={p.id} className="bg-[#111] rounded-[2rem] p-6 border border-white/5 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-black text-sm uppercase italic text-white/80">{p.name}</span>
                    <span className="text-[10px] font-bold text-white/20 uppercase">Por {p.unit}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <button onClick={() => updatePrice(p.id, -1)} className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:bg-red-600 active:border-red-600 transition-all font-black text-xl">-1</button>
                    <div className="text-center flex-grow">
                      <span className="text-3xl font-mono font-black italic tracking-tighter">
                        {p.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button onClick={() => updatePrice(p.id, 1)} className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:bg-emerald-600 active:border-emerald-600 transition-all font-black text-xl">+1</button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-black/90 backdrop-blur-xl border-t border-white/5 flex flex-col gap-4 z-[100]">
        <button 
          onClick={() => { 
            if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE', state); 
            triggerCommandFeedback('TV ATUALIZADA!'); 
          }} 
          className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl border-b-4 border-slate-300"
        >
          <RefreshCcw size={20} /> Forçar Atualização TV
        </button>
        <p className="text-[9px] font-black text-white/20 text-center uppercase tracking-[0.5em] italic">Media Indoor Cloud • Fabio FCell</p>
      </footer>
    </div>
  );
};

export default RemoteController;
