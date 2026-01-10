
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Promotion, Product } from '../types';
import { Clock, Star, Flame, Tag, Zap, TrendingDown, ArrowLeft, ClipboardList } from 'lucide-react';

interface TvViewProps {
  state: AppState;
  setState?: React.Dispatch<React.SetStateAction<AppState>>;
  highlightedPromoId?: string | null;
}

const TvView: React.FC<TvViewProps> = ({ state, setState, highlightedPromoId }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentSuperIndex, setCurrentSuperIndex] = useState(0);
  const [productScrollY, setProductScrollY] = useState(0);
  
  const productListRef = useRef<HTMLDivElement>(null);
  const productContainerRef = useRef<HTMLDivElement>(null);

  const activePromos = useMemo(() => state.promotions.filter(p => p.isActive), [state.promotions]);
  const hasPromos = activePromos.length > 0;

  // Se não houver promos, usamos a lista de produtos como "itens de cardápio" para o carrossel
  const menuItems = useMemo(() => {
    if (hasPromos) return activePromos;
    return state.products.map(p => ({
      id: `menu-${p.id}`,
      productId: p.id,
      offerPrice: p.price,
      imageUrl: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=800', // Imagem padrão de carne premium
      description: 'QUALIDADE E PROCEDÊNCIA GARANTIDA',
      isActive: true
    })) as Promotion[];
  }, [hasPromos, activePromos, state.products]);
  
  const activeSuperOffers = useMemo(() => {
    return state.superOffer.productIds.map(id => {
      const product = state.products.find(p => p.id === id);
      const promo = state.promotions.find(pr => pr.productId === id);
      return { product, promo, discountPrice: state.superOffer.discountPrices[id] || 0 };
    }).filter(item => item.product);
  }, [state.superOffer, state.products, state.promotions]);

  const highlightedPromo = useMemo(() => {
    if (!highlightedPromoId) return null;
    return state.promotions.find(p => p.id === highlightedPromoId);
  }, [highlightedPromoId, state.promotions]);

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carousel Logic (Promos ou Cardápio)
  useEffect(() => {
    if (menuItems.length <= 1 || highlightedPromo) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % menuItems.length);
    }, state.promoInterval || 6000);
    return () => clearInterval(interval);
  }, [menuItems.length, state.promoInterval, highlightedPromo]);

  // Super Offer Carousel Logic
  useEffect(() => {
    if (!state.superOffer.isActive || activeSuperOffers.length <= 1 || highlightedPromo) return;
    const interval = setInterval(() => {
      setCurrentSuperIndex(prev => (prev + 1) % activeSuperOffers.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [state.superOffer.isActive, activeSuperOffers.length, highlightedPromo]);

  // Infinite Scroll Logic for Products
  useEffect(() => {
    let animationFrame: number;
    let position = 0;
    let direction = 1;
    let pauseCounter = 0;
    
    const scroll = () => {
      if (!productListRef.current || !productContainerRef.current) return;
      const contentHeight = productListRef.current.scrollHeight;
      const containerHeight = productContainerRef.current.offsetHeight;
      
      if (contentHeight > containerHeight) {
        if (pauseCounter > 0) { 
          pauseCounter--; 
        } else {
          position += 0.6 * direction;
          if (position >= contentHeight - containerHeight + 40) {
            direction = -1;
            pauseCounter = 300; 
          } else if (position <= 0) {
            direction = 1;
            position = 0;
            pauseCounter = 300; 
          }
          setProductScrollY(position);
        }
      } else { 
        setProductScrollY(0); 
      }
      animationFrame = requestAnimationFrame(scroll);
    };
    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [state.products]);

  const formatPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return { integer: parts[0], decimal: parts[1] };
  };

  const handleBack = () => {
    if (setState) {
      // Alterado de 'ADMIN' para 'LANDING' conforme solicitado
      setState(prev => ({ ...prev, view: 'LANDING' }));
    }
  };

  const rotationStyles: React.CSSProperties = state.tvOrientation === 90 ? {
    transform: 'rotate(90deg)', transformOrigin: 'center',
    width: '100vh', height: '100vw',
    position: 'absolute', top: '50%', left: '50%',
    marginTop: '-50vw', marginLeft: '-50vh',
  } : { width: '100vw', height: '100vh' };

  return (
    <div className="fixed inset-0 bg-[#050505] overflow-hidden flex items-center justify-center font-inter">
      
      <button 
        onClick={handleBack}
        className="fixed top-4 left-4 z-[300] opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white/10 hover:bg-white/20 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-white shadow-2xl flex items-center gap-2 group"
      >
        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-black text-[10px] uppercase tracking-widest">Sair do Modo TV</span>
      </button>

      {/* REMOTE TRIGGERED HIGHLIGHT OVERLAY */}
      {highlightedPromo && (
        <div className="fixed inset-0 z-[200] bg-red-900 flex flex-col animate-in fade-in zoom-in duration-500">
           <div className="absolute top-0 left-0 right-0 h-[12vh] bg-black flex items-center justify-center border-b-8 border-yellow-500 shadow-2xl">
              <div className="flex items-center gap-12 animate-pulse">
                <Zap className="text-yellow-400 fill-yellow-400" size="6vh" />
                <h2 className="text-[8vh] font-oswald font-black text-white italic tracking-tighter uppercase">SUPER OFERTA AGORA!</h2>
                <Zap className="text-yellow-400 fill-yellow-400" size="6vh" />
              </div>
           </div>
           
           <div className="flex-grow flex flex-col items-center justify-center p-[5vh] mt-[5vh]">
              <div className="w-[85%] max-w-[1400px] aspect-video bg-white rounded-[4vh] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden border-[1.5vh] border-white relative group">
                 <img src={highlightedPromo.imageUrl} className="w-full h-full object-cover" alt="Destaque" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                 <div className="absolute bottom-[5%] left-[5%]">
                    <h3 className="text-[12vh] font-oswald font-black text-white uppercase italic leading-none drop-shadow-2xl">
                      {state.products.find(p => p.id === highlightedPromo.productId)?.name}
                    </h3>
                 </div>
              </div>
              
              <div className="mt-[4vh] bg-yellow-500 px-[6vw] py-[3vh] rounded-[3vh] border-b-[1.2vh] border-yellow-700 shadow-2xl flex items-center gap-[4vw] transform -rotate-1">
                  <div className="text-center">
                    <p className="text-[3vh] font-black text-red-900 uppercase italic leading-none mb-2">Preço Especial:</p>
                    <div className="flex items-start">
                      <span className="text-[5vh] font-black text-red-800 mt-4 mr-2">R$</span>
                      <span className="text-[20vh] font-oswald font-black text-red-700 leading-none tracking-tighter">
                        {formatPrice(highlightedPromo.offerPrice).integer}
                      </span>
                      <span className="text-[10vh] font-oswald font-black text-red-700 leading-none">,{formatPrice(highlightedPromo.offerPrice).decimal}</span>
                    </div>
                  </div>
                  <div className="h-[15vh] w-[2px] bg-red-900/10" />
                  <p className="text-[4.5vh] font-black text-red-900 uppercase max-w-[500px] leading-tight italic drop-shadow-sm">
                    "{highlightedPromo.description}"
                  </p>
              </div>
           </div>
        </div>
      )}

      <div style={rotationStyles} className="bg-[#0a0a0a] flex flex-row select-none text-white relative">
        
        {/* SUPER OFFER INTERVENTION */}
        {state.superOffer.isActive && activeSuperOffers[currentSuperIndex] && !highlightedPromo && (
          <div className="fixed inset-0 z-[100] bg-[#8B0000] flex flex-col animate-in slide-in-from-bottom duration-700">
            <div className="absolute top-0 left-0 right-0 h-[18vh] bg-[#FFD700] flex items-center justify-center shadow-2xl overflow-hidden border-b-[1vh] border-yellow-600">
              <div className="flex items-center gap-12">
                <TrendingDown className="text-red-700" size="10vh" />
                <h2 className="text-[11vh] font-oswald font-black text-red-800 uppercase italic tracking-tighter drop-shadow-lg">BAIXOU O PREÇO!</h2>
                <Star className="text-red-700 fill-red-700 animate-spin-slow" size="10vh" />
              </div>
            </div>

            <div className="flex-grow flex items-center justify-between px-[8vw] pt-[15vh]">
              <div className="w-[45%] flex flex-col items-center gap-6">
                <div className="w-full aspect-square bg-white rounded-[4vh] shadow-2xl border-[1.5vh] border-white transform -rotate-3 overflow-hidden relative">
                  <img src={activeSuperOffers[currentSuperIndex].promo?.imageUrl} className="w-full h-full object-cover" alt="Super Oferta" />
                  <div className="absolute top-4 right-4 bg-red-600 text-white p-6 rounded-full font-black text-[3vh] shadow-xl animate-pulse">SÓ HOJE!</div>
                </div>
              </div>
              <div className="w-[50%] flex flex-col items-end text-right">
                <h3 className="text-[14vh] font-oswald font-black text-yellow-400 leading-none mb-4 uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                  {activeSuperOffers[currentSuperIndex].product?.name}
                </h3>
                <div className="bg-yellow-500 text-red-900 px-[4vw] py-[3vh] rounded-[4vh] shadow-[0_30px_60px_rgba(0,0,0,0.4)] border-b-[1.5vh] border-yellow-700 flex flex-col items-center">
                  <span className="text-[4vh] font-black italic opacity-80 uppercase leading-none mb-2">APROVEITE O KG:</span>
                  <div className="flex items-start">
                    <span className="text-[6vh] font-black mt-6 mr-2">R$</span>
                    <span className="text-[32vh] font-oswald font-black leading-[0.7] tracking-tighter">
                      {formatPrice(activeSuperOffers[currentSuperIndex].discountPrice).integer}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[14vh] font-oswald font-black leading-none">,{formatPrice(activeSuperOffers[currentSuperIndex].discountPrice).decimal}</span>
                      <span className="text-[4vh] font-bold uppercase bg-red-700 text-white px-3 py-1 mt-2 rounded-lg">Corte Premium</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[10vh] bg-black/60 backdrop-blur-md flex items-center justify-center overflow-hidden border-t border-white/10">
              <div className="flex gap-24 whitespace-nowrap animate-marquee">
                {Array(6).fill(null).map((_, i) => (
                  <div key={i} className="flex items-center gap-8">
                    <Flame className="text-orange-500" size="4vh" />
                    <span className="text-[4vh] font-black text-white uppercase italic tracking-widest">QUALIDADE PREMIUM • PROCEDÊNCIA GARANTIDA • O MELHOR PREÇO DA CIDADE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN TV CONTENT: LEFT (PRICES), RIGHT (PROMOS/MENU) */}
        <div className="w-[58%] h-full flex flex-col bg-gradient-to-b from-[#121212] to-[#050505] border-r-[1vh] border-yellow-600/20 relative overflow-hidden">
          <header className="h-[16vh] flex items-center justify-between px-[4vw] bg-black/80 border-b-4 border-yellow-600 z-20">
            <div className="flex flex-col">
              <h1 className="text-[7vh] font-oswald font-black text-yellow-500 uppercase tracking-tighter leading-none">{state.storeName}</h1>
              <p className="text-[2.2vh] font-bold text-white/50 uppercase tracking-[0.3em] mt-2 italic">Tradição em Carnes Selecionadas</p>
            </div>
            <div className="flex items-center gap-4 bg-yellow-600/10 px-8 py-4 rounded-3xl border border-yellow-600/30">
              <Clock className="text-yellow-500" size="4vh" />
              <span className="text-[5vh] font-oswald font-black text-white tracking-tighter">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </header>
          
          <div ref={productContainerRef} className="flex-grow px-[4vw] py-[4vh] relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <div ref={productListRef} className="flex flex-col gap-4 transition-transform duration-100 ease-linear" style={{ transform: `translateY(-${productScrollY}px)` }}>
              {state.products.map((product) => (
                <div key={product.id} className="flex justify-between items-center bg-white/5 rounded-2xl p-6 border-l-[1.5vh] border-yellow-600/50 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[4.5vh] font-oswald font-black uppercase text-white leading-none mb-1">{product.name}</span>
                    <span className="text-[1.8vh] text-white/30 font-bold uppercase tracking-widest">Preço por {product.unit}</span>
                  </div>
                  <div className="flex items-baseline gap-2 text-yellow-500">
                    <span className="text-[3vh] font-black opacity-80">R$</span>
                    <span className="text-[8vh] font-oswald font-black tracking-tighter leading-none">{product.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <footer className="h-[8vh] bg-yellow-600 flex items-center justify-center relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <span className="text-[3.5vh] font-black text-black uppercase tracking-[0.4em] italic">Qualidade imbatível no seu dia a dia!</span>
          </footer>
        </div>

        <div className={`w-[42%] h-full relative flex flex-col overflow-hidden transition-colors duration-1000 ${hasPromos ? 'bg-yellow-500' : 'bg-slate-800'}`}>
          <div className={`absolute top-0 left-0 right-0 py-[3vh] shadow-2xl z-20 transform -skew-y-3 -mt-[1vh] transition-colors duration-1000 ${hasPromos ? 'bg-red-700' : 'bg-slate-900 border-b-4 border-indigo-500'}`}>
            <h2 className="text-[6vh] font-oswald font-black text-white text-center uppercase tracking-tighter italic transform skew-y-3 flex items-center justify-center gap-4">
              {hasPromos ? (
                <>OFERTA ESPECIAL <Zap size="5vh" className="fill-white" /></>
              ) : (
                <>NOSSO CARDÁPIO <ClipboardList size="5vh" /></>
              )}
            </h2>
          </div>
          
          <div className="flex-grow relative flex flex-col pt-[12vh]">
            {menuItems.length > 0 ? (
              menuItems.map((item, idx) => {
                const product = state.products.find(p => p.id === item.productId);
                const isActive = idx === currentPromoIndex;
                const { integer, decimal } = formatPrice(item.offerPrice);
                
                return (
                  <div 
                    key={item.id} 
                    className={`absolute inset-0 flex flex-col items-center p-[3vw] pt-[5vh] transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
                  >
                    <div className="w-full h-[40vh] mb-[3vh] transform hover:scale-[1.03] transition-transform duration-700">
                      <div className={`w-full h-full bg-white rounded-[4vh] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.3)] border-[1.2vh] border-white relative`}>
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={product?.name} />
                        <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent`}>
                           <h3 className="text-[6.5vh] font-oswald font-black text-white uppercase leading-none tracking-tight">{product?.name}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="text-center w-full mb-[3vh]">
                      <div className={`px-6 py-4 rounded-3xl inline-block max-w-full shadow-sm border ${hasPromos ? 'bg-red-900/10 border-red-900/20 text-red-900' : 'bg-white/10 border-white/10 text-white'}`}>
                        <p className="text-[3.2vh] font-black italic leading-tight">"{item.description}"</p>
                      </div>
                    </div>

                    <div className={`mt-auto mb-[2vh] w-full flex items-center justify-center py-[4vh] rounded-[4vh] shadow-2xl border-b-[1.5vh] transform transition-transform active:scale-95 ${hasPromos ? 'bg-red-700 border-red-900 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}>
                      <div className="flex items-start">
                        <span className={`text-[5vh] font-black mt-4 mr-3 opacity-80 ${hasPromos ? '' : 'text-slate-500'}`}>R$</span>
                        <span className="text-[18vh] font-oswald font-black leading-none tracking-tighter">{integer}</span>
                        <div className="flex flex-col">
                          <span className="text-[9vh] font-oswald font-black leading-none">,{decimal}</span>
                          <span className={`text-[3vh] font-black uppercase mt-2 px-3 py-1 rounded-lg ${hasPromos ? 'bg-black/20 text-yellow-400' : 'bg-slate-900/10 text-slate-600'}`}>por {product?.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>

          <footer className={`h-[6vh] flex items-center justify-center border-t transition-colors duration-1000 ${hasPromos ? 'bg-black/10 border-black/5' : 'bg-black/30 border-white/5'}`}>
            <span className={`text-[1.8vh] font-black uppercase tracking-[0.5em] italic ${hasPromos ? 'text-red-900/60' : 'text-white/40'}`}>Qualidade Garantida por Fabio FCell</span>
          </footer>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 35s linear infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TvView;
