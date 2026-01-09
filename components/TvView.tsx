
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState } from '../types';
import { Clock, Star, Flame, RotateCcw, RotateCw } from 'lucide-react';

interface TvViewProps {
  state: AppState;
  setState?: React.Dispatch<React.SetStateAction<AppState>>;
}

const TvView: React.FC<TvViewProps> = ({ state, setState }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentSuperIndex, setCurrentSuperIndex] = useState(0);
  const [productScrollY, setProductScrollY] = useState(0);
  
  const productListRef = useRef<HTMLDivElement>(null);
  const productContainerRef = useRef<HTMLDivElement>(null);

  const activePromos = useMemo(() => state.promotions.filter(p => p.isActive), [state.promotions]);
  
  // Múltiplas Ofertas do Dia
  const activeSuperOffers = useMemo(() => {
    return state.superOffer.productIds.map(id => {
      const product = state.products.find(p => p.id === id);
      const promo = state.promotions.find(pr => pr.productId === id);
      return { product, promo, discountPrice: state.superOffer.discountPrices[id] || 0 };
    }).filter(item => item.product);
  }, [state.superOffer, state.products, state.promotions]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotação de Ofertas Normais
  useEffect(() => {
    if (activePromos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % activePromos.length);
    }, state.promoInterval);
    return () => clearInterval(interval);
  }, [activePromos.length, state.promoInterval]);

  // Rotação de Super Ofertas (quando houver mais de uma)
  useEffect(() => {
    if (!state.superOffer.isActive || activeSuperOffers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSuperIndex(prev => (prev + 1) % activeSuperOffers.length);
    }, state.promoInterval * 0.8);
    return () => clearInterval(interval);
  }, [state.superOffer.isActive, activeSuperOffers.length, state.promoInterval]);

  // Rolagem de Preços
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
        if (pauseCounter > 0) { pauseCounter--; } else {
          position += 0.5 * direction;
          if (position >= contentHeight - containerHeight + 20) {
            direction = -1;
            pauseCounter = 200;
          } else if (position <= 0) {
            direction = 1;
            position = 0;
            pauseCounter = 200;
          }
          setProductScrollY(position);
        }
      } else { setProductScrollY(0); }
      animationFrame = requestAnimationFrame(scroll);
    };
    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [state.products]);

  const currentSuper = activeSuperOffers[currentSuperIndex];
  const formatPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return { integer: parts[0], decimal: parts[1] };
  };

  const handleRotate = (deg: 0 | 90) => {
    if (setState) setState(prev => ({ ...prev, tvOrientation: deg }));
  };

  const rotationStyles: React.CSSProperties = state.tvOrientation === 90 ? {
    transform: 'rotate(90deg)', transformOrigin: 'center',
    width: '100vh', height: '100vw',
    position: 'absolute', top: '50%', left: '50%',
    marginTop: '-50vw', marginLeft: '-50vh',
  } : { width: '100vw', height: '100vh' };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* Botões de Rotação Flutuantes */}
      <div className="fixed top-6 right-6 z-[110] flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button onClick={() => handleRotate(0)} className={`p-3 rounded-xl border flex items-center gap-2 font-black text-xs uppercase transition-all ${state.tvOrientation === 0 ? 'bg-red-600 border-red-500' : 'bg-black/50 border-white/20 text-white/50'}`}>
          <RotateCcw size={16} /> 360°
        </button>
        <button onClick={() => handleRotate(90)} className={`p-3 rounded-xl border flex items-center gap-2 font-black text-xs uppercase transition-all ${state.tvOrientation === 90 ? 'bg-red-600 border-red-500' : 'bg-black/50 border-white/20 text-white/50'}`}>
          <RotateCw size={16} /> 90°
        </button>
      </div>

      <div style={rotationStyles} className="bg-[#0a0a0a] flex flex-row select-none text-white relative transition-all duration-700">
        
        {/* OVERLAY: MULTI SUPER OFERTAS */}
        {state.superOffer.isActive && currentSuper && (
          <div className="fixed inset-0 z-[100] bg-yellow-400 flex flex-col animate-in zoom-in duration-500">
            <div className="absolute top-0 left-0 right-0 h-[20vh] bg-red-600 flex items-center justify-center shadow-2xl overflow-hidden">
              <div className="flex items-center gap-[5vw] animate-pulse">
                <Star className="text-yellow-400 fill-yellow-400" size="10vh" />
                <h2 className="text-[12vh] font-oswald font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">OFERTA DO DIA</h2>
                <Star className="text-yellow-400 fill-yellow-400" size="10vh" />
              </div>
            </div>

            <div className="flex-grow flex items-center justify-between px-[10vw] pt-[15vh]">
              <div className="w-[45%] flex flex-col items-center gap-[4vh]">
                <div className="w-full aspect-square bg-white rounded-[5vh] shadow-2xl border-[2vh] border-white p-[2vh] transform -rotate-2 overflow-hidden">
                  <img src={currentSuper.promo?.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=800"} className="w-full h-full object-cover" alt="Super Oferta" />
                </div>
                <div className="bg-red-600 text-white px-8 py-4 rounded-full text-[4vh] font-black uppercase tracking-widest animate-bounce">SÓ ENQUANTO DURAR!</div>
              </div>
              <div className="w-[50%] flex flex-col items-center text-center">
                <h3 className="text-[14vh] font-oswald font-black text-red-900 leading-none mb-[2vh] uppercase">{currentSuper.product?.name}</h3>
                <div className="flex flex-col items-center bg-red-600 text-white px-[5vw] py-[4vh] rounded-[5vh] shadow-2xl border-b-[2vh] border-red-900">
                  <span className="text-[5vh] font-black italic opacity-80 uppercase leading-none">APROVEITE:</span>
                  <div className="flex items-start">
                    <span className="text-[6vh] font-black mt-[4vh] mr-2">R$</span>
                    <span className="text-[30vh] font-oswald font-black leading-[0.8] tracking-tighter">{formatPrice(currentSuper.discountPrice).integer}</span>
                    <div className="flex flex-col">
                      <span className="text-[12vh] font-oswald font-black">,{formatPrice(currentSuper.discountPrice).decimal}</span>
                      <span className="text-[4vh] font-bold uppercase text-yellow-400">por {currentSuper.product?.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[12vh] bg-black flex items-center justify-center overflow-hidden">
              <div className="flex gap-20 whitespace-nowrap animate-marquee">
                {Array(5).fill(null).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Flame className="text-red-500" size="5vh" />
                    <span className="text-[5vh] font-black text-yellow-400 uppercase italic">Qualidade Garantida • Preço imbatível! • O melhor corte da região!</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LADO ESQUERDO: PREÇOS */}
        <div className="w-[55%] h-full flex flex-col bg-gradient-to-b from-[#1a0505] to-[#0a0000] border-r-[0.5vh] border-[#ffd700]/30 relative overflow-hidden">
          <header className="h-[15vh] flex items-center justify-between px-[3vw] bg-black/40 border-b border-white/5 z-20">
            <div className="flex flex-col">
              <h1 className="text-[5vh] font-oswald font-black text-[#ffd700] uppercase tracking-tighter">{state.storeName}</h1>
              <p className="text-[2vh] font-bold text-red-500 uppercase tracking-widest mt-1">Carnes Selecionadas & Qualidade Premium</p>
            </div>
            <div className="flex items-center gap-3 bg-red-900/40 px-6 py-3 rounded-2xl border border-red-500/30">
              <Clock className="text-[#ffd700]" size="3vh" />
              <span className="text-[4vh] font-oswald font-bold text-white">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </header>
          <div ref={productContainerRef} className="flex-grow px-[3vw] py-[2vh] relative overflow-hidden">
            <div ref={productListRef} className="grid grid-cols-1 gap-[0.8vh] transition-transform duration-100 ease-linear" style={{ transform: `translateY(-${productScrollY}px)` }}>
              {state.products.map((product) => (
                <div key={product.id} className="flex justify-between items-center border-b border-white/5 pb-[0.5vh]">
                  <div className="flex flex-col">
                    <span className="text-[3.5vh] font-oswald font-bold uppercase text-white leading-tight">{product.name}</span>
                    <span className="text-[1.8vh] text-gray-400 font-semibold uppercase">Por {product.unit}</span>
                  </div>
                  <div className="flex items-baseline gap-1 text-[#ffd700]">
                    <span className="text-[2.5vh] font-bold">R$</span>
                    <span className="text-[5.5vh] font-oswald font-black tracking-tighter leading-none">{product.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <footer className="h-[8vh] bg-[#ffd700] flex items-center justify-center relative z-20">
            <span className="text-[3vh] font-black text-black uppercase tracking-[0.5em]">Tradição em cada corte</span>
          </footer>
        </div>

        {/* LADO DIREITO: OFERTAS + BARRA LATERAL */}
        <div className="w-[45%] h-full relative bg-[#ffd700] flex flex-row overflow-hidden">
          
          {/* BARRA LATERAL DE ROLAGEM DE OFERTAS */}
          <div className="w-[20%] h-full bg-black/10 backdrop-blur-sm flex flex-col items-center py-4 gap-4 overflow-y-auto border-r border-black/5">
            {activePromos.map((promo, idx) => (
              <div 
                key={promo.id} 
                onClick={() => setCurrentPromoIndex(idx)}
                className={`w-16 h-16 rounded-2xl overflow-hidden border-4 transition-all duration-500 cursor-pointer flex-shrink-0 ${idx === currentPromoIndex ? 'border-red-600 scale-110 shadow-lg' : 'border-white/20 opacity-40 scale-90'}`}
              >
                <img src={promo.imageUrl} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* ÁREA DA OFERTA EM DESTAQUE */}
          <div className="flex-grow relative flex flex-col h-full">
            <div className="absolute top-0 left-0 right-0 bg-red-700 py-[3vh] shadow-xl z-20 transform -skew-y-2 -mt-[1vh]">
              <h2 className="text-[6vh] font-oswald font-black text-white text-center uppercase tracking-tighter italic transform skew-y-2">Oferta Especial</h2>
            </div>
            
            <div className="flex-grow relative">
              {activePromos.map((promo, idx) => {
                const product = state.products.find(p => p.id === promo.productId);
                const isActive = idx === currentPromoIndex;
                return (
                  <div key={promo.id} className={`absolute inset-0 flex flex-col items-center justify-center p-[3vw] pt-[12vh] transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-90'}`}>
                    <div className="w-full h-[40vh] mb-[4vh]">
                      <div className="w-full h-full bg-white rounded-[4vh] overflow-hidden shadow-2xl border-[1vh] border-white">
                        <img src={promo.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="text-center w-full space-y-[2vh]">
                      <h3 className="text-[7vh] font-oswald font-black text-red-900 uppercase leading-none">{product?.name}</h3>
                      <div className="bg-red-900 text-white px-6 py-2 rounded-xl inline-block max-w-full">
                        <p className="text-[2.5vh] font-bold italic truncate">"{promo.description}"</p>
                      </div>
                    </div>
                    <div className="mt-auto mb-4 w-full flex items-center justify-center bg-red-700 text-white py-6 rounded-[3vh] shadow-xl">
                      <div className="flex items-start">
                        <span className="text-[4vh] font-black mt-[2vh] mr-2">R$</span>
                        <span className="text-[14vh] font-oswald font-black leading-none">{formatPrice(promo.offerPrice).integer}</span>
                        <div className="flex flex-col">
                          <span className="text-[7vh] font-oswald font-black">,{formatPrice(promo.offerPrice).decimal}</span>
                          <span className="text-[2.5vh] font-bold uppercase text-yellow-400">por {product?.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 20s linear infinite; }
      `}</style>
    </div>
  );
};

export default TvView;
