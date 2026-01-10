
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';
import { Play, Settings, Monitor, Zap, Smartphone, Lock, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('asoguiro_v4');
    const urlParams = new URLSearchParams(window.location.search);
    const startMode = urlParams.get('mode');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          view: startMode === 'controller' ? 'CONTROLLER' : 'LANDING'
        };
      } catch (e) {
        console.error("Persistence error:", e);
      }
    }
    
    return {
      storeName: 'AÇOUGUE PREMIUM',
      products: INITIAL_PRODUCTS,
      promotions: INITIAL_PROMOTIONS,
      superOffer: { productIds: [], discountPrices: {}, isActive: false },
      view: startMode === 'controller' ? 'CONTROLLER' : 'LANDING',
      tvOrientation: 0,
      promoInterval: 6000
    };
  });

  const [highlightedPromoId, setHighlightedPromoId] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Sincronização Cloud via LocalStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'asoguiro_v4' && e.newValue) {
        const newState = JSON.parse(e.newValue);
        setState(prev => ({
          ...newState,
          view: prev.view 
        }));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const toSave = { ...state };
    localStorage.setItem('asoguiro_v4', JSON.stringify(toSave));
  }, [state]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === 'admin') {
      setIsAdminAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const sendRemoteCommand = (command: string, payload?: any) => {
    if (command === 'SHOW_FULL_PROMO') {
      setHighlightedPromoId(payload.promoId);
      setTimeout(() => setHighlightedPromoId(null), 8000);
    }
    if (command === 'FORCE_UPDATE') {
      setState(payload);
    }
  };

  if (state.view === 'LANDING') {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        
        <div className="relative z-10 text-center max-w-4xl w-full">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-pulse">
              <Zap size={48} fill="currentColor" />
            </div>
          </div>
          
          <h1 className="text-[8vw] md:text-7xl font-oswald font-black text-white uppercase tracking-tighter leading-none italic mb-4">
            {state.storeName}
          </h1>
          <p className="text-xl md:text-2xl text-white/50 font-bold uppercase tracking-[0.3em] mb-16 italic">
            Sistema de Mídia Digital Cloud
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'TV' }))}
              className="group relative bg-red-600 hover:bg-red-500 text-white p-8 rounded-[2.5rem] shadow-2xl transition-all hover:scale-105 active:scale-95 border-b-8 border-red-800"
            >
              <div className="flex flex-col items-center gap-3">
                <Play size={40} fill="currentColor" />
                <span className="font-black text-lg uppercase tracking-widest italic">INICIAR TV</span>
              </div>
            </button>
            
            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'ADMIN' }))}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-8 rounded-[2.5rem] border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <div className="flex flex-col items-center gap-3">
                <Settings size={40} />
                <span className="font-black text-lg uppercase tracking-widest italic">PAINEL ADM</span>
              </div>
            </button>

            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'CONTROLLER' }))}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-8 rounded-[2.5rem] transition-all hover:scale-105 active:scale-95 shadow-2xl border-b-8 border-indigo-800"
            >
              <div className="flex flex-col items-center gap-3">
                <Smartphone size={40} />
                <span className="font-black text-lg uppercase tracking-widest italic">BALCÃO</span>
              </div>
            </button>
          </div>
          
          <div className="mt-16 text-white/20 text-xs font-black uppercase tracking-[0.5em]">
            Media Indoor Cloud Engine • Fabio FCell
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'TV') {
    return <TvView state={state} setState={setState} highlightedPromoId={highlightedPromoId} />;
  }

  if (state.view === 'CONTROLLER') {
    return <RemoteController 
      state={state} 
      setState={setState} 
      onExit={() => setState(prev => ({ ...prev, view: 'LANDING' }))}
      sendRemoteCommand={sendRemoteCommand}
      remoteIp="CLOUDSYNC-ACTIVE"
    />;
  }

  // ADMIN VIEW WITH LOGIN
  if (state.view === 'ADMIN' && !isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 z-[500]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1600')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        
        <div className="relative w-full max-w-md animate-in zoom-in fade-in duration-500">
          <div className="bg-[#111] rounded-[3rem] p-10 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center text-center mb-10">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-colors duration-300 ${loginError ? 'bg-red-600 animate-shake' : 'bg-white/5'}`}>
                {loginError ? <XCircle size={40} className="text-white" /> : <Lock size={40} className="text-white/40" />}
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h2>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">Área Administrativa {state.storeName}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input 
                  type="password"
                  placeholder="DIGITE A SENHA"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  className={`w-full bg-white/5 border-2 rounded-2xl py-5 px-6 text-center font-mono text-xl tracking-[0.5em] text-white outline-none transition-all ${loginError ? 'border-red-600 bg-red-600/10' : 'border-white/10 focus:border-red-600 focus:bg-white/10'}`}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl border-b-4 border-red-800"
              >
                ENTRAR NO PAINEL <ArrowRight size={18} />
              </button>
            </form>

            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'LANDING' }))}
              className="w-full mt-6 py-4 text-white/30 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              CANCELAR E VOLTAR
            </button>
          </div>
          
          <p className="text-center mt-8 text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">Segurança Certificada Fabio FCell</p>
        </div>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          .animate-shake { animation: shake 0.2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <AdminPanel 
      state={state} 
      setState={setState} 
      onEnterTvMode={() => setState(prev => ({ ...prev, view: 'TV' }))}
      onEnterControllerMode={() => setState(prev => ({ ...prev, view: 'CONTROLLER' }))} 
      sendRemoteCommand={sendRemoteCommand}
      onLogout={() => {
        setIsAdminAuthenticated(false);
        setPasswordInput('');
        setState(prev => ({ ...prev, view: 'LANDING' }));
      }}
    />
  );
};

export default App;
