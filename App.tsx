
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';
import { Home, Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('ADMIN');
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('acougue_sync_code') || Math.random().toString(36).substring(2, 8).toUpperCase();
  });
  const [isOnline, setIsOnline] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const isInternalChange = useRef(false);

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
      superOffer: { productIds: [], discountPrices: {}, isActive: false },
      storeName: 'SEU AÇOUGUE PREFERIDO',
      accentColor: '#B91C1C',
      promoInterval: 10000,
      productPageInterval: 8000,
      tvOrientation: 0
    };
  });

  // Salva o código de sincronização
  useEffect(() => {
    localStorage.setItem('acougue_sync_code', syncCode);
  }, [syncCode]);

  // Lógica de Sincronização Remota (WebSockets)
  useEffect(() => {
    // Usando um servidor de relay público para demonstração/teste
    const connect = () => {
      const ws = new WebSocket('wss://socketsbay.com/wss/v2/1/demo/');
      
      ws.onopen = () => {
        setIsOnline(true);
        console.log('Conectado à Nuvem de Sincronização');
        // Ao conectar, solicita o estado mais recente ou envia o seu
        ws.send(JSON.stringify({ type: 'JOIN', room: syncCode }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Só processa mensagens destinadas à nossa sala (room)
          if (data.room === syncCode && data.type === 'UPDATE_STATE') {
            isInternalChange.current = true;
            setState(data.payload);
            setTimeout(() => { isInternalChange.current = false; }, 100);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setIsOnline(false);
        setTimeout(connect, 3000); // Tenta reconectar
      };

      socketRef.current = ws;
    };

    connect();
    return () => socketRef.current?.close();
  }, [syncCode]);

  // Envia atualizações para a nuvem quando o estado muda localmente
  useEffect(() => {
    localStorage.setItem('acougue_state', JSON.stringify(state));
    
    if (!isInternalChange.current && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'UPDATE_STATE',
        room: syncCode,
        payload: state
      }));
    }
  }, [state, syncCode]);

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
    <div className={`relative min-h-screen bg-black transition-colors duration-500 overflow-x-hidden ${state.tvOrientation === 90 && mode === 'TV' ? 'overflow-hidden' : ''}`}>
      
      {/* Indicador de Status da Conexão Nuvem */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 pointer-events-none">
        {isOnline ? (
          <><Wifi size={12} className="text-emerald-500" /> <span className="text-[8px] font-black text-emerald-500 uppercase">Cloud Online: {syncCode}</span></>
        ) : (
          <><WifiOff size={12} className="text-red-500" /> <span className="text-[8px] font-black text-red-500 uppercase">Reconectando Cloud...</span></>
        )}
      </div>

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
          <TvView state={state} setState={setState} />
          <button 
            onClick={() => setMode('ADMIN')}
            className="fixed top-6 left-6 flex items-center gap-3 bg-black/30 hover:bg-black/80 text-white/40 hover:text-white px-6 py-3 rounded-2xl z-[101] transition-all opacity-0 hover:opacity-100 border border-white/10 backdrop-blur-md group"
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

      <div className={`fixed bottom-0 left-0 right-0 flex justify-center pb-1 pointer-events-none z-[9999] transition-opacity duration-1000 ${mode === 'TV' ? 'opacity-30' : 'opacity-60'}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${mode === 'ADMIN' ? 'text-slate-400' : 'text-white/30'}`}>
          Sincronização Cloud Ativa via Fabio FCell
        </span>
      </div>
    </div>
  );
};

export default App;
