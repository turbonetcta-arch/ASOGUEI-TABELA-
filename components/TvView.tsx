
import React, { useState, useEffect, useMemo } from 'react';
import { AppState } from '../types';
import { Clock, Star, Flame } from 'lucide-react';

interface TvViewProps {
  state: AppState;
}

const TvView: React.FC<TvViewProps> = ({ state }) => {
  const ITEMS_PER_PAGE = 10;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentProductPage, setCurrentProductPage] = useState(0);

  const activePromos = useMemo(() => state.promotions.filter(p => p.isActive), [state.promotions]);
  const totalProductPages = Math.ceil(state.products.length / ITEMS_PER_PAGE);
  
  const paginatedProducts = useMemo(() => {
    const start = currentProductPage * ITEMS_PER_PAGE;
    return state.products.slice(start, start + ITEMS_PER_PAGE);
  }, [state.products, currentProductPage]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activePromos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % activePromos.length);
    }, state.promoInterval);
    return () => clearInterval(interval);
  }, [activePromos.length, state.promoInterval]);

  useEffect(() => {
    if (totalProductPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentProductPage(prev => (prev + 1) % totalProductPages);
    }, state.productPageInterval);
    return () => clearInterval(interval);
  }, [totalProductPages, state.productPageInterval]);

  const currentPromo = activePromos[currentPromoIndex];
  const promoProduct = state.products.find(p => p.id === currentPromo?.productId);
  const superOfferProduct = state.products.find(p => p.id === state.superOffer.productId);
  
  // Busca a imagem da promoção para a super oferta, se existir
  const superOfferPromo = state.promotions.find(p => p.productId === state.superOffer.productId);
  const superOfferImage = superOfferPromo?.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop";

  const formatPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return { integer: parts[0], decimal: parts[1] };
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden flex flex-row select-none text-white relative">
      
      {/* OVERLAY: SUPER OFERTA DO DIA (Impacto Total) */}
      {state.superOffer.isActive && superOfferProduct && (
        <div className="fixed inset-0 z-[100] bg-yellow-400 flex flex-col animate-in zoom-in duration-500">
          <div className="absolute top-0 left-0 right-0 h-[20vh] bg-red-600 flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="flex items-center gap-[5vw] animate-pulse">
              <Star className="text-yellow-400 fill-yellow-400" size="10vh" />
              <h2 className="text-[12vh] font-oswald font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">
                OFERTA DO DIA
              </h2>
              <Star className="text-yellow-400 fill-yellow-400" size="10vh" />
            </div>
          </div>

          <div className="flex-grow flex items-center justify-between px-[10vw] pt-[15vh]">
            <div className="w-[45%] flex flex-col items-center gap-[4vh]">
               <div className="w-full aspect-square bg-white rounded-[5vh] shadow-2xl border-[2vh] border-white p-[2vh] transform -rotate-2 overflow-hidden">
                 <div className="w-full h-full bg-slate-100 rounded-[3vh] flex items-center justify-center overflow-hidden">
                    <img 
                      src={superOfferImage} 
                      className="w-full h-full object-cover transition-transform duration-[10000ms] scale-110 hover:scale-125" 
                      alt="Super Oferta IA"
                    />
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
                      <span className="text-[30vh] font-oswald font-black leading-[0.8] tracking-tighter">
                        {formatPrice(state.superOffer.discountPrice).integer}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[12vh] font-oswald font-black leading-none">
                          ,{formatPrice(state.superOffer.discountPrice).decimal}
                        </span>
                        <span className="text-[4vh] font-bold uppercase tracking-wider text-yellow-400">
                          por {superOfferProduct.unit}
                        </span>
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

      {/* Conteúdo Normal da TV */}
      <div className="w-[55%] h-full flex flex-col bg-gradient-to-b from-[#1a0505] to-[#0a0000] border-r-[0.5vh] border-[#ffd700]/30 relative">
        <header className="h-[15vh] flex items-center justify-between px-[3vw] bg-black/40 border-b border-white/5">
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

        <div className="flex-grow px-[3vw] py-[2vh]">
          <div className="grid grid-cols-1 gap-[0.8vh]">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="flex justify-between items-center border-b border-white/5 pb-[0.5vh]">
                <div className="flex flex-col">
                  <span className="text-[3.5vh] font-oswald font-bold uppercase tracking-tight text-white">{product.name}</span>
                  <span className="text-[1.8vh] text-gray-400 font-semibold uppercase -mt-1">Corte Nobre • Por {product.unit}</span>
                </div>
                <div className="flex items-baseline gap-1 text-[#ffd700]">
                  <span className="text-[2.5vh] font-bold">R$</span>
                  <span className="text-[5.5vh] font-oswald font-black leading-none tracking-tighter">{product.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="h-[8vh] bg-[#ffd700] flex items-center justify-center relative">
          <span className="text-[3vh] font-black text-black uppercase tracking-[0.5em]">Tradição em cada corte</span>
          <span className="absolute right-4 bottom-1 text-[1vh] font-bold text-black/20 uppercase tracking-widest">Fabio FCell</span>
        </footer>
      </div>

      <div className="w-[45%] h-full relative bg-[#ffd700] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bg-red-700 py-[3vh] shadow-xl z-20 transform -skew-y-2 -mt-[1vh]">
          <h2 className="text-[6vh] font-oswald font-black text-white text-center uppercase tracking-tighter italic animate-pulse transform skew-y-2 drop-shadow-2xl">
            Oferta Especial
          </h2>
        </div>
        {currentPromo && (
          <div key={currentPromo.id} className="flex-grow flex flex-col items-center justify-center p-[4vw] pt-[12vh]">
            <div className="w-full h-[40vh] relative mb-[4vh]">
              <div className="relative w-full h-full bg-white rounded-[4vh] overflow-hidden shadow-2xl border-[1vh] border-white">
                <img src={currentPromo.imageUrl} alt={promoProduct?.name} className="w-full h-full object-cover transition-transform duration-[15000ms] scale-110 hover:scale-100" />
              </div>
            </div>
            <div className="text-center w-full space-y-[2vh]">
              <h3 className="text-[7.5vh] font-oswald font-black text-red-900 uppercase leading-none tracking-tighter">{promoProduct?.name}</h3>
              <div className="bg-red-900 text-white px-[2vw] py-[1vh] rounded-xl inline-block">
                <p className="text-[2.8vh] font-bold italic">"{currentPromo.description}"</p>
              </div>
            </div>
            <div className="mt-auto mb-[2vh] w-full flex items-center justify-center bg-red-700 text-white py-[4vh] rounded-[3vh] shadow-2xl relative">
               <div className="flex items-start">
                  <span className="text-[4vh] font-black mt-[2vh] mr-2">R$</span>
                  <span className="text-[16vh] font-oswald font-black leading-[0.8] tracking-tighter">
                    {formatPrice(currentPromo.offerPrice).integer}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[7vh] font-oswald font-black leading-none">,{formatPrice(currentPromo.offerPrice).decimal}</span>
                    <span className="text-[2.5vh] font-bold uppercase tracking-wider text-yellow-400">por {promoProduct?.unit}</span>
                  </div>
               </div>
            </div>
          </div>
        )}
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
