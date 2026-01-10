
import React, { useState, useEffect } from 'react';
import { AppState, Product } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import { Plus, Trash2, Tv, UtensilsCrossed } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('asoguiro_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist by spreading over defaults
        return {
          storeName: 'AÇOUGUE PREMIUM',
          products: INITIAL_PRODUCTS,
          promotions: INITIAL_PROMOTIONS,
          superOffer: { productIds: [], discountPrices: {}, isActive: false },
          view: 'ADMIN',
          tvOrientation: 0,
          promoInterval: 5000,
          ...parsed
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    
    return {
      storeName: 'AÇOUGUE PREMIUM',
      products: INITIAL_PRODUCTS,
      promotions: INITIAL_PROMOTIONS,
      superOffer: { productIds: [], discountPrices: {}, isActive: false },
      view: 'ADMIN',
      tvOrientation: 0,
      promoInterval: 5000
    };
  });

  useEffect(() => {
    localStorage.setItem('asoguiro_v2', JSON.stringify(state));
  }, [state]);

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: 'NOVO CORTE',
      price: 0,
      unit: 'KG'
    };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const removeProduct = (id: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  // --- VISUALIZAÇÃO DA TV ---
  if (state.view === 'TV') {
    return (
      <div className="min-h-screen bg-black text-white font-oswald p-12 flex flex-col overflow-hidden animate-in fade-in duration-1000">
        <header className="flex justify-between items-center mb-12 border-b-8 border-red-700 pb-6">
          <div className="flex items-center gap-6">
            <div className="bg-red-700 p-4 rounded-2xl">
              <UtensilsCrossed size={60} className="text-white" />
            </div>
            <h1 className="text-8xl font-black italic tracking-tighter uppercase">{state.storeName}</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-600 uppercase tracking-widest">Qualidade Selecionada</p>
            <p className="text-xl text-white/40 uppercase">Preços válidos para hoje</p>
          </div>
          <button 
            onClick={() => setState(prev => ({...prev, view: 'ADMIN'}))}
            className="fixed top-4 right-4 opacity-0 hover:opacity-20 text-[10px] uppercase"
          >
            Sair
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {state.products.map((p, idx) => (
            <div 
              key={p.id} 
              className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-3xl border-l-8 border-red-700 animate-in slide-in-from-left duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="text-6xl font-black uppercase italic text-zinc-100">{p.name}</span>
              <div className="flex items-center gap-6">
                <span className="text-2xl text-red-600 font-sans font-bold">R$</span>
                <span className="text-9xl font-black text-white tabular-nums">
                  {p.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-3xl text-zinc-500 font-bold uppercase">{p.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-auto pt-10 flex justify-center">
          <div className="bg-red-700/10 border border-red-700/30 px-12 py-4 rounded-full">
            <p className="text-2xl font-bold text-red-500 uppercase tracking-[0.5em] animate-pulse">
              Aceitamos cartões e pix
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // --- PAINEL ADMINISTRATIVO ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <input 
              value={state.storeName} 
              onChange={e => setState(prev => ({...prev, storeName: e.target.value.toUpperCase()}))}
              className="text-4xl font-black bg-transparent border-b-4 border-transparent focus:border-red-700 outline-none uppercase italic tracking-tighter w-full md:w-auto"
            />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Console de Gerenciamento</p>
          </div>
          <button 
            onClick={() => setState(prev => ({...prev, view: 'TV'}))}
            className="group relative bg-red-700 hover:bg-red-600 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-4 transition-all shadow-[0_0_40px_rgba(185,28,28,0.3)] active:scale-95"
          >
            <Tv size={24} className="group-hover:animate-bounce" />
            <span className="uppercase italic tracking-widest">Ligar Tela da TV</span>
          </button>
        </header>

        <section className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 className="font-black uppercase text-sm tracking-widest text-zinc-500 italic">Lista de Preços Atual</h2>
            <button 
              onClick={addProduct} 
              className="bg-zinc-100 text-zinc-900 hover:bg-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all"
            >
              <Plus size={18} /> Novo Corte
            </button>
          </div>
          
          <div className="divide-y divide-zinc-800">
            {state.products.map(p => (
              <div key={p.id} className="p-6 flex flex-col md:flex-row gap-6 items-center hover:bg-zinc-800/30 transition-colors group">
                <div className="flex-grow w-full">
                   <label className="text-[10px] font-black text-zinc-600 uppercase mb-1 block">Nome do Corte</label>
                   <input 
                    value={p.name} 
                    onChange={e => updateProduct(p.id, { name: e.target.value.toUpperCase() })}
                    className="w-full font-black text-zinc-100 text-xl outline-none uppercase bg-transparent"
                    placeholder="EX: PICANHA ARGENTINA"
                  />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-1 block">Preço R$</label>
                    <div className="flex items-center bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-700">
                      <input 
                        type="number" 
                        step="0.01"
                        value={p.price}
                        onChange={e => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent font-black w-24 outline-none text-red-500 text-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-1 block">Unid</label>
                    <select 
                      value={p.unit}
                      onChange={e => updateProduct(p.id, { unit: e.target.value })}
                      className="bg-zinc-800 text-zinc-300 px-4 py-[14px] rounded-xl font-black text-sm outline-none border border-zinc-700"
                    >
                      <option value="KG">KG</option>
                      <option value="UN">UN</option>
                      <option value="PÇ">PÇ</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => removeProduct(p.id)} 
                    className="mt-5 p-4 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            ))}

            {state.products.length === 0 && (
              <div className="p-24 text-center">
                <div className="bg-zinc-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus size={40} className="text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-black uppercase italic tracking-widest">Nenhum produto na lista.</p>
                <button onClick={addProduct} className="mt-4 text-red-500 font-bold uppercase text-xs hover:underline">Clique para adicionar o primeiro</button>
              </div>
            )}
          </div>
        </section>
        
        <footer className="mt-12 text-center">
          <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em] italic">Asoguiro Media Zero Engine v2.0</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
