
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';
import { Home, Tv, Smartphone } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('ADMIN');
  const syncChannel = useRef<BroadcastChannel | null>(null);

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('acougue_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar estado:", e);
    }
    return {
      products: INITIAL_PRODUCTS,
      promotions: INITIAL_PROMOTIONS,
      storeName: 'SEU AÇOUGUE PREFERIDO',
      accentColor: '#B91C1C',
      promoInterval: 10000,
      productPageInterval: 8000
    };
  });

  // Inicializa o canal de sincronização "APK"
  useEffect(() => {
    syncChannel.current = new BroadcastChannel('acougue_tv_sync');
    
    syncChannel.current.onmessage = (event) => {
      if (event.data.type === 'UPDATE_STATE') {
        setState(event.data.payload);
      }
    };

    return () => syncChannel.current?.close();
  }, []);

  // Persistência e Broadcast
  useEffect(() => {
    localStorage.setItem('acougue_state', JSON.stringify(state));
    syncChannel.current?.postMessage({ type: 'UPDATE_STATE', payload: state });
  }, [state]);

  // Gestão de Wake Lock
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && (mode === 'TV')) {
        try { wakeLock = await (navigator as any).wakeLock.request('screen'); } 
        catch (err) {}
      }
    };
    if (mode === 'TV') requestWakeLock();
    else if (wakeLock) wakeLock.release();
  }, [mode]);

  return (
    <div className="relative min-h-screen bg-black transition-colors duration-500 overflow-x-hidden">
      {mode === 'ADMIN' && (
        <AdminPanel 
          state={state} 
          setState={setState} 
          onEnterTvMode={() => setMode('TV')} 
          onEnterControllerMode={() => setMode('CONTROLLER')}
        />
      )}
      
      {mode === 'TV' && (
        <>
          <TvView state={state} />
          <button 
            onClick={() => setMode('ADMIN')}
            className="fixed top-6 left-6 flex items-center gap-3 bg-black/30 hover:bg-black/80 text-white/40 hover:text-white px-6 py-3 rounded-2xl z-50 transition-all opacity-0 hover:opacity-100 border border-white/10 backdrop-blur-md group"
          >
            <Home size={24} />
            <span className="font-bold text-sm uppercase tracking-widest">Painel</span>
          </button>
        </>
      )}

      {mode === 'CONTROLLER' && (
        <RemoteController 
          state={state} 
          setState={setState} 
          onExit={() => setMode('ADMIN')} 
        />
      )}
    </div>
  );
};

export default App;
