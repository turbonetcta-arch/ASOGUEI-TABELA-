
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Product, Promotion } from '../types';
import { 
  Plus, Trash2, Tv, Sparkles, Loader2, 
  Package, Tag, Settings2, CheckCircle2, Key, 
  Smartphone, Download, Wand2, FileUp, AlertCircle,
  RotateCcw, RotateCw, Monitor, Search, X, MonitorPlay,
  ChevronDown, ChevronUp, MousePointerSquareDashed, Star,
  Link2, RefreshCcw, Home, ArrowUp, ArrowDown, Layout,
  QrCode, ChevronLast, ChevronFirst, Wifi, Activity,
  Power, Send, Server, Globe, Radio, Zap, MonitorOff
} from 'lucide-react';
import { geminiService } from '../services/gemini';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onEnterTvMode: () => void;
  onEnterControllerMode: () => void;
  isOnline?: boolean;
  sendRemoteCommand?: (command: string, payload?: any) => void;
  remoteIp?: string;
  activeDevices?: any[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onEnterTvMode, onEnterControllerMode, isOnline, sendRemoteCommand, remoteIp, activeDevices = [] }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PROMOS' | 'SETTINGS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  
  const syncCode = localStorage.getItem('acougue_sync_code') || '';
  const controllerUrl = useMemo(() => {
    return `${window.location.origin}${window.location.pathname}?sync=${syncCode}&mode=controller`;
  }, [syncCode]);

  useEffect(() => {
    setSaveStatus('SAVING');
    const timer = setTimeout(() => setSaveStatus('SAVED'), 600);
    return () => clearTimeout(timer);
  }, [state]);

  const handleManualSync = () => {
    if (!isOnline) return;
    setIsSyncing(true);
    if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE', state);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const scanNetwork = () => {
    setIsSearching(true);
    if (sendRemoteCommand) sendRemoteCommand('DEVICE_ANNOUNCE_REQUEST');
    setTimeout(() => setIsSearching(false), 2000);
  };

  const handleToggleTvMode = (targetId?: string, forceMode?: 'TV' | 'ADMIN') => {
    if (sendRemoteCommand) {
        sendRemoteCommand('SET_MODE', { 
            targetId, 
            mode: forceMode || 'TV' 
        });
        if (!targetId) alert(`Comando enviado para todos os terminais Fabio FCell!`);
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
            <Zap size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none uppercase">Fabio FCell</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Console de Gerenciamento</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={handleManualSync} disabled={isSyncing} className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:border-emerald-500 transition-all flex-1 md:flex-none justify-center">
            {isSyncing ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <RefreshCcw size={18} />}
            <span className="text-xs">Sincronizar</span>
          </button>
          <button onClick={onEnterControllerMode} className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 flex-1 md:flex-none justify-center"><Smartphone size={18} /> Celular</button>
          <button onClick={onEnterTvMode} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg flex-1 md:flex-none justify-center"><Tv size={18} /> Abrir TV</button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-6xl mx-auto w-full">
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-full md:w-fit mb-8 shadow-sm">
          {[
            { id: 'PRODUCTS', label: 'Tabela Preços', icon: Package },
            { id: 'PROMOS', label: 'Ofertas TV', icon: Tag },
            { id: 'SETTINGS', label: 'Central de TVs', icon: Monitor }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            
            {/* ÁREA DE CONFIGURAÇÃO DE TVS */}
            <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={140} /></div>
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter mb-2 italic flex items-center gap-3">
                       <Radio className="text-red-500" size={32} /> Central de Terminais Fabio FCell
                    </h3>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5 inline-block">
                       Status da Rede: {isOnline ? 'CONECTADA' : 'SEM RESPOSTA'} • {activeDevices.length} Conectados
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={scanNetwork} disabled={isSearching} className="bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 border border-white/10 transition-all active:scale-95 flex-grow md:flex-grow-0 justify-center">
                      {isSearching ? <Loader2 size={20} className="animate-spin text-red-500" /> : <RefreshCcw size={20} className="text-red-500" />}
                      Atualizar Rede
                    </button>
                    <button onClick={() => handleToggleTvMode()} className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-2xl transition-all active:scale-95 flex-grow md:flex-grow-0 justify-center border-b-4 border-red-900">
                      <Tv size={20} /> Ligar Tudo
                    </button>
                    <button onClick={() => handleToggleTvMode(undefined, 'ADMIN')} className="bg-slate-700 hover:bg-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 transition-all active:scale-95 border-b-4 border-slate-900">
                      <MonitorOff size={20} /> Desligar Tudo
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {activeDevices.length > 0 ? activeDevices.map((device, i) => {
                    const isTv = device.mode === 'TV';
                    const isOffline = device.status === 'OFFLINE';
                    
                    return (
                      <div key={i} className={`p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-5 ${isOffline ? 'bg-black/40 border-white/5 opacity-50 grayscale' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <div className="flex justify-between items-start">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isOffline ? 'bg-slate-800 text-slate-500' : isTv ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {device.mode === 'TV' ? <Tv size={32} /> : <Smartphone size={32} />}
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${isOffline ? 'bg-white/5 text-white/30' : isTv ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-amber-500 text-black'}`}>
                            {!isOffline && <div className={`w-2 h-2 rounded-full bg-current ${!isOffline ? 'animate-pulse' : ''}`} />}
                            {isOffline ? 'OFFLINE' : isTv ? 'EM TRANSMISSÃO' : 'STANDBY'}
                          </div>
                        </div>

                        <div>
                          <p className="text-base font-black uppercase tracking-tight leading-none">{isTv ? 'Terminal TV' : 'Dispositivo Móvel'}</p>
                          <p className="text-[10px] font-mono text-white/40 mt-2 uppercase tracking-tighter">NODE ID: {device.id} • IP: {device.ip}</p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex gap-2">
                           {!isOffline && (
                             <>
                                <button 
                                    onClick={() => handleToggleTvMode(device.id, isTv ? 'ADMIN' : 'TV')}
                                    className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all active:scale-95 ${isTv ? 'bg-slate-800 text-white border border-white/5' : 'bg-red-600 text-white shadow-lg'}`}
                                >
                                    {isTv ? 'Desativar TV' : 'Ativar Modo TV'}
                                </button>
                                <button 
                                    onClick={() => { if (sendRemoteCommand) sendRemoteCommand('FORCE_UPDATE', state); }}
                                    className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                                >
                                    <RefreshCcw size={16} />
                                </button>
                             </>
                           )}
                           {isOffline && (
                             <p className="text-[9px] font-black text-white/20 uppercase py-2 italic">Aguardando reconexão...</p>
                           )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-[4rem]">
                      <Radio size={80} className="mb-6 animate-pulse" />
                      <p className="text-xl font-black uppercase tracking-[0.4em]">Nenhuma TV Detectada</p>
                      <p className="text-xs mt-3 uppercase font-bold text-white/50">Abra o aplicativo Fabio FCell nos terminais para parear</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-lg mb-6 flex items-center gap-3"><QrCode className="text-red-600" /> Pareamento Automático</h3>
                  <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(controllerUrl)}`} className="w-44 h-44 shadow-2xl rounded-3xl" />
                    <div className="text-center space-y-2">
                       <p className="text-[11px] font-black text-slate-800 uppercase">Aponte a câmera para conectar</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-[200px]">Vincula instantaneamente o dispositivo ao servidor Fabio FCell</p>
                    </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">Sync Code do Servidor</h3>
                  <div className="text-7xl font-black text-slate-900 tracking-tighter mb-8 drop-shadow-sm">{syncCode}</div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button onClick={() => window.aistudio?.openSelectKey()} className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-black transition-all">
                        <Key size={16} /> Chave Google
                    </button>
                    <button onClick={() => { if(confirm("Deseja mudar o código global?")) { localStorage.removeItem('acougue_sync_code'); window.location.reload(); } }} className="bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                        <RefreshCcw size={16} /> Novo Código
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* LISTAS DE PRODUTOS E PROMOÇÕES (MANTIDAS) */}
        {activeTab === 'PRODUCTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="relative w-full md:w-[450px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Pesquisar no estoque..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-3xl pl-14 pr-10 py-4 font-bold text-base outline-none shadow-sm focus:ring-4 focus:ring-red-50" />
              </div>
              <button onClick={() => setState(prev => ({ ...prev, products: [{ id: Date.now().toString(), name: 'NOVO CORTE', price: 0, unit: 'KG', category: 'Geral' }, ...prev.products] }))} className="bg-red-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase flex items-center gap-3 shadow-xl shadow-red-200 active:scale-95 transition-all w-full md:w-auto justify-center"><Plus size={22} /> Adicionar Item</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {state.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-red-500 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })} className="w-full font-black text-slate-800 text-base uppercase outline-none bg-transparent" />
                    <button onClick={() => setState(prev => ({...prev, products: prev.products.filter(item => item.id !== p.id)}))} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-grow bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Preço Atual</label>
                      <div className="flex items-center gap-1 font-mono font-black text-xl text-slate-700">
                         <span className="text-xs">R$</span>
                         <input type="number" step="0.01" value={p.price} onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent outline-none" />
                      </div>
                    </div>
                    <div className="w-24 bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Unid</label>
                        <select value={p.unit} onChange={e => updateProduct(p.id, { unit: e.target.value })} className="bg-transparent font-black text-sm outline-none cursor-pointer">
                            {['KG', 'UN', 'PC', 'BD'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
