
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppMode } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';
import { Home, Wifi, WifiOff, Globe, Server } from 'lucide-react';

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
  const [remoteIp, setRemoteIp] = useState<string>('Detectando...');
  const [activeDevices, setActiveDevices] = useState<any[]>([]);
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
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setRemoteIp(data.ip))
      .catch(() => setRemoteIp('Local WiFi'));
  }, []);

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
        
        // Anuncia o dispositivo ao entrar
        ws.send(JSON.stringify({
          type: 'REMOTE_COMMAND',
          room: syncCode,
          command: 'DEVICE_ANNOUNCE',
          payload: { id: Math.random().toString(36).substr(2, 4), mode, ip: remoteIp }
        }));
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
            if (data.command === 'DEVICE_ANNOUNCE' && mode === 'ADMIN') {
              setActiveDevices(prev => {
                const exists = prev.find(d => d.id === data.payload.id);
                if (exists) return prev;
                return [...prev, data.payload];
              });
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
  }, [syncCode, mode, remoteIp]);

  // Limpa lista de dispositivos periodicamente (simulação de timeout)
  useEffect(() => {
    if (mode === 'ADMIN') {
      const interval = setInterval(() => {
        setActiveDevices([]);
        sendRemoteCommand('DEVICE_ANNOUNCE', { mode, ip: remoteIp, id: 'admin' });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [mode, remoteIp]);

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

  return (
    <div className={`relative min-h-screen bg-black transition-colors duration-500 overflow-x-hidden ${state.tvOrientation === 90 && mode === 'TV' ? 'overflow-hidden' : ''}`}>
      
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-4 py-2 rounded-full bg-black/80 backdrop-blur-2xl border border-white/10 pointer-events-none shadow-2xl transition-all">
        <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? 'Cloud OK' : 'Offline'}
            </span>
        </div>
        <div className="w-px h-3 bg-white/20" />
        <div className="flex items-center gap-2">
            <Server size={12} className="text-blue-400" />
            <span className="text-[10px] font-bold text-white/60 font-mono tracking-tight">{remoteIp}</span>
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
          remoteIp={remoteIp}
          activeDevices={activeDevices}
        />
      )}
      
      {mode === 'TV' && (
        <>
          <TvView state={state} setState={setState} remoteIp={remoteIp} />
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
          remoteIp={remoteIp}
        />
      )}

      <div className={`fixed bottom-0 left-0 right-0 flex justify-center pb-1 pointer-events-none z-[9999] transition-opacity duration-1000 ${mode === 'TV' ? 'opacity-30' : 'opacity-60'}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${mode === 'ADMIN' ? 'text-slate-400' : 'text-white/30'}`}>
          Sistema Ativo • {remoteIp} • Fabio FCell
        </span>
      </div>
    </div>
  );
};

export default App;
