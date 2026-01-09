
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
  const [productScrollY, setProductScrollY] = useState(0);
  
  const productListRef = useRef<HTMLDivElement>(null);
  const productContainerRef = useRef<HTMLDivElement>(null);

  const activePromos = useMemo(() => state.promotions.filter(p => p.isActive), [state.promotions]);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Lógica de Troca de Promoções com Transição
  useEffect(() => {
    if (activePromos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % activePromos.length);
    }, state.promoInterval);
    return () => clearInterval(interval);
  }, [activePromos.length, state.promoInterval]);

  // Lógica de Rolagem Automática da Tabela de Preços
  useEffect(() => {
    let animationFrame: number;
    let position = 0;
    let direction = 1; // 1 para baixo, -1 para cima
    let pauseCounter = 0;

    const scroll = () => {
      if (!productListRef.current || !productContainerRef.current) return;

      const contentHeight = productListRef.current.scrollHeight;
      const containerHeight = productContainerRef.current.offsetHeight;

      // Só rola se o conteúdo for maior que o espaço disponível
      if (contentHeight > containerHeight) {
        if (pauseCounter > 0) {
          pauseCounter--;
        } else {
          position += 0.5 * direction; // Velocidade da rolagem

          if (position >= contentHeight - containerHeight + 20) {
            direction = -1;
            pauseCounter = 200; // Pausa no final antes de subir
          } else if (position <= 0) {
            direction = 1;
            position = 0;
            pauseCounter = 200; // Pausa no topo antes de descer
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

  const currentPromo = activePromos[currentPromoIndex];
  const promoProduct = state.products.find(p => p.id === currentPromo?.productId);
  const superOfferProduct = state.products.find(p => p.id === state.superOffer.productId);
  const superOfferPromo = state.promotions.find(p => p.productId === state.superOffer.productId);
  const superOfferImage = superOfferPromo?.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop";

  const formatPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return { integer: parts[0], decimal: parts[1] };
  };

  const handleRotate = (deg: 0 | 90) => {
    if (setState) {
      setState(prev => ({ ...prev, tvOrientation: deg }));
    }
  };

  const rotationStyles: React.CSSProperties = state.tvOrientation === 90 ? {
    transform: 'rotate(90deg)',
    transformOrigin: 'center',
    width: '100vh',
    height: '100vw',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: '-50vw',
    marginLeft: '-50vh',
  } : {
    width: '100vw',
    height: '100vh',
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* Botões de Rotação Flutuantes */}
      <div className="fixed top-6 right-6 z-[110] flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => handleRotate(0)}
          className={`p-3 rounded-xl border flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${state.tvOrientation === 0 ? 'bg-red-600 border-red-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}
        >
          <RotateCcw size={16} /> 360°
        </button>
        <button 
          onClick={() => handleRotate(90)}
          className={`p-3 rounded-xl border flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${state.tvOrientation === 90 ? 'bg-red-600 border-red-500 text-white' : 'bg-black/50 border-white/20 text-white/50'}`}
        >
          <RotateCw size={16} /> 90°
        </button>
      </div>

      <div style={rotationStyles} className="bg-[#0a0a0a] flex flex-row select-none text-white relative transition-all duration-700">
        
        {/* OVERLAY: SUPER OFERTA DO DIA */}
        {state.superOffer.isActive && superOfferProduct && (
          <div className="fixed inset-0 z-[100] bg-yellow-400 flex flex-col animate-in zoom-in duration-500">
            <div className="absolute top-0 left-0 right-0 h-[20vh] bg-red-600 flex items-center justify-center shadow-2xl overflow-hidden">
              <div className="flex items-center gap-[5vw] animate-pulse">
                <Star className="text-yellow-400 fill-yellow-400" size="10vh" />
                <h2 className="text-[12vh] font-oswald font-black text-white uppercase italic tracking-tighter drop-shadow-2xl text-center">
                  OFERTA DO DIA
                </h2>
                <Star className="text-yellow-400 fill-yellow-400" size="10vh" />
              </div>
            </div>

            <div className="flex-grow flex items-center justify-between px-[10vw] pt-[15vh]">
              <div className="w-[45%] flex flex-col items-center gap-[4vh]">
                <div className="w-full aspect-square bg-white rounded-[5vh] shadow-2xl border-[2vh] border-white p-[2vh] transform -rotate-2 overflow-hidden">
                  <div className="w-full h-full bg-slate-100 rounded-[3vh] flex items-center justify-center overflow-hidden">
                    <img src={superOfferImage} className="w-full h-full object-cover transition-transform duration-[10000ms] scale-110" alt="Super Oferta" />
                  </div>
                </div>
                <div className="bg-red-600 text-white px-8 py-4 rounded-full text-[4vh] font-black uppercase tracking-widest shadow-xl animate-bounce">
                  SÓ ENQUANTO DURAR!
                </div>
              </div>

              <div className="w-[50%] flex flex-col items-center text-center">
                <h3 className="text-[14vh] font-oswald font-black text-red-900 leading-none mb-[2vh] uppercase drop-shadow-sm">
                  {superOfferProduct.name}
                </h3>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4 text-slate-700 font-bold text-[6vh] relative">
                    <span>DE: R$ {superOfferProduct.price.toFixed(2).replace('.', ',')}</span>
                    <div className="absolute w-full h-[0.5vh] bg-red-600 top-1/2 left-0 -rotate-6"></div>
                  </div>
                  <div className="flex flex-col items-center bg-red-600 text-white px-[5vw] py-[4vh] rounded-[5vh] shadow-2xl mt-4 border-b-[2vh] border-red-900">
                    <span className="text-[5vh] font-black italic mb-[-2vh] opacity-80 uppercase">POR APENAS:</span>
                    <div className="flex items-start">
                      <span className="text-[6vh] font-black mt-[4vh] mr-2">R$</span>
                      <span className="text-[30vh] font-oswald font-black leading-[0.8] tracking-tighter">{formatPrice(state.superOffer.discountPrice).integer}</span>
                      <div className="flex flex-col">
                        <span className="text-[12vh] font-oswald font-black leading-none">,{formatPrice(state.superOffer.discountPrice).decimal}</span>
                        <span className="text-[4vh] font-bold uppercase tracking-wider text-yellow-400">por {superOfferProduct.unit}</span>
                      </div>
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
                    <span className="text-[5vh] font-black text-yellow-400 uppercase italic">Aproveite agora mesmo! Qualidade Garantida • Preço imbatível!</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TABELA DE PREÇOS (LADO ESQUERDO) */}
        <div className="w-[55%] h-full flex flex-col bg-gradient-to-b from-[#1a0505] to-[#0a0000] border-r-[0.5vh] border-[#ffd700]/30 relative overflow-hidden">
          <header className="h-[15vh] flex items-center justify-between px-[3vw] bg-black/40 border-b border-white/5 z-20">
            <div className="flex flex-col">
              <h1 className="text-[5vh] font-oswald font-black leading-none text-[#ffd700] uppercase tracking-tighter">
                {state.storeName}
              </h1>
              <p className="text-[2vh] font-bold text-red-500 uppercase tracking-widest mt-1">
                Carnes Selecionadas & Qualidade Premium
              </p>
            </div>
            <div className="flex items-center gap-3 bg-red-900/40 px-6 py-3 rounded-2xl border border-red-500/30">
              <Clock className="text-[#ffd700]" size="3vh" />
              <span className="text-[4vh] font-oswald font-bold text-white tabular-nums">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </header>

          <div ref={productContainerRef} className="flex-grow px-[3vw] py-[2vh] relative overflow-hidden">
            <div 
              ref={productListRef}
              className="grid grid-cols-1 gap-[0.8vh] transition-transform duration-100 ease-linear"
              style={{ transform: `translateY(-${productScrollY}px)` }}
            >
              {state.products.map((product) => (
                <div key={product.id} className="flex justify-between items-center border-b border-white/5 pb-[0.5vh]">
                  <div className="flex flex-col">
                    <span className="text-[3.5vh] font-oswald font-bold uppercase tracking-tight text-white">{product.name}</span>
                    <span className="text-[1.8vh] text-gray-400 font-semibold uppercase -mt-1">Por {product.unit}</span>
                  </div>
                  <div className="flex items-baseline gap-1 text-[#ffd700]">
                    <span className="text-[2.5vh] font-bold">R$</span>
                    <span className="text-[5.5vh] font-oswald font-black leading-none tracking-tighter">{product.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="h-[8vh] bg-[#ffd700] flex items-center justify-center relative z-20">
            <span className="text-[3vh] font-black text-black uppercase tracking-[0.5em]">Tradição em cada corte</span>
          </footer>
        </div>

        {/* OFERTAS EM DESTAQUE (LADO DIREITO) */}
        <div className="w-[45%] h-full relative bg-[#ffd700] flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bg-red-700 py-[3vh] shadow-xl z-20 transform -skew-y-2 -mt-[1vh]">
            <h2 className="text-[6vh] font-oswald font-black text-white text-center uppercase tracking-tighter italic animate-pulse transform skew-y-2 drop-shadow-2xl">
              Oferta Especial
            </h2>
          </div>
          
          <div className="flex-grow relative overflow-hidden">
            {activePromos.map((promo, idx) => {
              const product = state.products.find(p => p.id === promo.productId);
              const isActive = idx === currentPromoIndex;
              
              return (
                <div 
                  key={promo.id} 
                  className={`absolute inset-0 flex flex-col items-center justify-center p-[4vw] pt-[12vh] transition-all duration-1000 ease-in-out ${
                    isActive ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-90'
                  }`}
                >
                  <div className="w-full h-[40vh] relative mb-[4vh]">
                    <div className="relative w-full h-full bg-white rounded-[4vh] overflow-hidden shadow-2xl border-[1vh] border-white">
                      <img src={promo.imageUrl} alt={product?.name} className="w-full h-full object-cover transition-transform duration-[15000ms] scale-110" />
                    </div>
                  </div>
                  <div className="text-center w-full space-y-[2vh]">
                    <h3 className="text-[7.5vh] font-oswald font-black text-red-900 uppercase leading-none tracking-tighter">{product?.name}</h3>
                    <div className="bg-red-900 text-white px-[2vw] py-[1vh] rounded-xl inline-block max-w-full">
                      <p className="text-[2.8vh] font-bold italic truncate">"{promo.description}"</p>
                    </div>
                  </div>
                  <div className="mt-auto mb-[2vh] w-full flex items-center justify-center bg-red-700 text-white py-[4vh] rounded-[3vh] shadow-2xl relative">
                    <div className="flex items-start">
                      <span className="text-[4vh] font-black mt-[2vh] mr-2">R$</span>
                      <span className="text-[16vh] font-oswald font-black leading-[0.8] tracking-tighter">{formatPrice(promo.offerPrice).integer}</span>
                      <div className="flex flex-col">
                        <span className="text-[7vh] font-oswald font-black leading-none">,{formatPrice(promo.offerPrice).decimal}</span>
                        <span className="text-[2.5vh] font-bold uppercase tracking-wider text-yellow-400">por {product?.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default TvView;
