
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';
import { Home, Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  // Inicialização inteligente: Verifica URL para auto-pareamento via QR Code
  const [mode, setMode] = useState<AppMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode')?.toUpperCase();
    if (urlMode === 'TV' || urlMode === 'CONTROLLER') return urlMode as AppMode;
    return 'ADMIN';
  });

  const [syncCode, setSyncCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSync = params.get('sync');
    if (urlSync) {
      const code = urlSync.toUpperCase();
      localStorage.setItem('acougue_sync_code', code);
      return code;
    }
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

  // Persistência local do código
  useEffect(() => {
    localStorage.setItem('acougue_sync_code', syncCode);
  }, [syncCode]);

  // Sincronização em Nuvem (Relay para funcionamento em qualquer WiFi)
  useEffect(() => {
    const connect = () => {
      // Usando SocketsBay para relay de mensagens entre dispositivos no mesmo código
      const ws = new WebSocket('wss://socketsbay.com/wss/v2/1/demo/');
      
      ws.onopen = () => {
        setIsOnline(true);
        ws.send(JSON.stringify({ type: 'JOIN', room: syncCode }));
        // Sincroniza estado inicial ao conectar
        if (mode === 'ADMIN' || mode === 'CONTROLLER') {
            ws.send(JSON.stringify({ type: 'UPDATE_STATE', room: syncCode, payload: state }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.room === syncCode && data.type === 'UPDATE_STATE') {
            isInternalChange.current = true;
            setState(data.payload);
            setTimeout(() => { isInternalChange.current = false; }, 100);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setIsOnline(false);
        setTimeout(connect, 3000); 
      };

      socketRef.current = ws;
    };

    connect();
    return () => socketRef.current?.close();
  }, [syncCode]);

  // Broadcast de mudanças de estado
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

  // Manter a tela ligada no Modo TV
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && mode === 'TV') {
        try { wakeLock = await (navigator as any).wakeLock.request('screen'); } 
        catch (err) {}
      }
    };
    if (mode === 'TV') requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, [mode]);

  return (
    <div className={`relative min-h-screen bg-black transition-colors duration-500 overflow-x-hidden ${state.tvOrientation === 90 && mode === 'TV' ? 'overflow-hidden' : ''}`}>
      
      {/* Indicador de Conexão WiFi/Nuvem */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 pointer-events-none shadow-2xl">
        {isOnline ? (
          <><Wifi size={12} className="text-emerald-500" /> <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado: {syncCode}</span></>
        ) : (
          <><WifiOff size={12} className="text-red-500" /> <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Tentando Conectar...</span></>
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
            <span className="font-bold text-sm uppercase tracking-widest">Painel Principal</span>
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
          Sincronização Ativa • Fábio FCell
        </span>
      </div>
    </div>
  );
};

export default App;
