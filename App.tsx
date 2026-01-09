
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';
import { Home, Wifi, WifiOff, Globe } from 'lucide-react';

const App: React.FC = () => {
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

  useEffect(() => {
    localStorage.setItem('acougue_sync_code', syncCode);
  }, [syncCode]);

  const sendRemoteCommand = (command: string, payload?: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'REMOTE_COMMAND',
        room: syncCode,
        command,
        payload
      }));
    }
  };

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('wss://socketsbay.com/wss/v2/1/demo/');
      
      ws.onopen = () => {
        setIsOnline(true);
        ws.send(JSON.stringify({ type: 'JOIN', room: syncCode }));
        if (mode === 'ADMIN' || mode === 'CONTROLLER') {
            ws.send(JSON.stringify({ type: 'UPDATE_STATE', room: syncCode, payload: state }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.room !== syncCode) return;

          if (data.type === 'UPDATE_STATE') {
            isInternalChange.current = true;
            setState(data.payload);
            setTimeout(() => { isInternalChange.current = false; }, 100);
          }

          if (data.type === 'REMOTE_COMMAND') {
            if (data.command === 'SET_MODE' && data.payload) {
              if (mode !== 'CONTROLLER') {
                setMode(data.payload as AppMode);
              }
            }
            if (data.command === 'FORCE_UPDATE' && data.payload) {
                isInternalChange.current = true;
                setState(data.payload);
                setTimeout(() => { isInternalChange.current = false; }, 100);
            }
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
  }, [syncCode, mode]);

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
      
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 pointer-events-none shadow-2xl">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        <div className="flex items-center gap-2">
          {isOnline ? (
            <><Wifi size={14} className="text-emerald-400" /> <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">Rede Ativa: {syncCode}</span></>
          ) : (
            <><WifiOff size={14} className="text-red-400" /> <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Reconectando...</span></>
          )}
        </div>
      </div>

      {mode === 'ADMIN' && (
        <AdminPanel 
          state={state} 
          setState={setState} 
          onEnterTvMode={() => setMode('TV')} 
          onEnterControllerMode={() => setMode('CONTROLLER')}
          isOnline={isOnline}
          sendRemoteCommand={sendRemoteCommand}
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
            <span className="font-bold text-sm uppercase tracking-widest">Sair da TV</span>
          </button>
        </>
      )}

      {mode === 'CONTROLLER' && (
        <RemoteController 
          state={state} 
          setState={setState} 
          onExit={() => setMode('ADMIN')}
          sendRemoteCommand={sendRemoteCommand}
        />
      )}

      <div className={`fixed bottom-0 left-0 right-0 flex justify-center pb-1 pointer-events-none z-[9999] transition-opacity duration-1000 ${mode === 'TV' ? 'opacity-30' : 'opacity-60'}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${mode === 'ADMIN' ? 'text-slate-400' : 'text-white/30'}`}>
          Sincronização Fabio FCell • Cloud Active
        </span>
      </div>
    </div>
  );
};

export default App;
