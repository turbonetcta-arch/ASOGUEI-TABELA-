
import React, { useState, useEffect, useMemo } from 'react';
import { AppState } from '../types';
import { Clock } from 'lucide-react';

interface TvViewProps {
  state: AppState;
}

const TvView: React.FC<TvViewProps> = ({ state }) => {
  // Configurações de exibição configuráveis
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

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Promo Timer - Usando state.promoInterval
  useEffect(() => {
    if (activePromos.length <= 1) {
      setCurrentPromoIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % activePromos.length);
    }, state.promoInterval);
    return () => clearInterval(interval);
  }, [activePromos.length, state.promoInterval]);

  // Product Page Timer - Usando state.productPageInterval
  useEffect(() => {
    if (totalProductPages <= 1) {
      setCurrentProductPage(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentProductPage(prev => (prev + 1) % totalProductPages);
    }, state.productPageInterval);
    return () => clearInterval(interval);
  }, [totalProductPages, state.productPageInterval]);

  const currentPromo = activePromos[currentPromoIndex];
  const promoProduct = state.products.find(p => p.id === currentPromo?.productId);

  const formatPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    return { integer: parts[0], decimal: parts[1] };
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden flex flex-row select-none text-white">
      {/* Coluna Esquerda: Menu de Preços (55% da tela) */}
      <div className="w-[55%] h-full flex flex-col bg-gradient-to-b from-[#1a0505] to-[#0a0000] border-r-[0.5vh] border-[#ffd700]/30 relative">
        
        {/* Header Superior com Relógio */}
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

        {/* Tabela de Preços */}
        <div className="flex-grow px-[3vw] py-[2vh]">
          <div className="grid grid-cols-1 gap-[0.8vh]">
            {paginatedProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex justify-between items-center group animate-in slide-in-from-left duration-500 ease-out border-b border-white/5 pb-[0.5vh]"
              >
                <div className="flex flex-col">
                  <span className="text-[3.5vh] font-oswald font-bold uppercase tracking-tight text-white group-hover:text-[#ffd700] transition-colors">
                    {product.name}
                  </span>
                  <span className="text-[1.8vh] text-gray-400 font-semibold uppercase -mt-1">
                    Corte Nobre • Por {product.unit}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1 text-[#ffd700]">
                  <span className="text-[2.5vh] font-bold">R$</span>
                  <span className="text-[5.5vh] font-oswald font-black leading-none tracking-tighter">
                    {product.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paginação Indicador */}
        {totalProductPages > 1 && (
          <div className="absolute bottom-[10vh] left-0 right-0 flex justify-center gap-3">
            {Array.from({ length: totalProductPages }).map((_, i) => (
              <div 
                key={i} 
                className={`h-[0.8vh] rounded-full transition-all duration-700 ${i === currentProductPage ? 'w-[4vw] bg-[#ffd700]' : 'w-[1vw] bg-white/20'}`}
              />
            ))}
          </div>
        )}

        {/* Rodapé institucional */}
        <footer className="h-[8vh] bg-[#ffd700] flex items-center justify-center">
          <span className="text-[3vh] font-black text-black uppercase tracking-[0.5em]">
            Tradição em cada corte
          </span>
        </footer>
      </div>

      {/* Coluna Direita: Ofertas Dinâmicas (45% da tela) */}
      <div className="w-[45%] h-full relative bg-[#ffd700] flex flex-col overflow-hidden">
        {/* Banner de Título Superior */}
        <div className="absolute top-0 left-0 right-0 bg-red-700 py-[3vh] shadow-xl z-20 transform -skew-y-2 -mt-[1vh]">
          <h2 className="text-[6vh] font-oswald font-black text-white text-center uppercase tracking-tighter italic animate-pulse transform skew-y-2 drop-shadow-2xl">
            Oferta Especial
          </h2>
        </div>

        {currentPromo && (
          <div key={currentPromo.id} className="flex-grow flex flex-col items-center justify-center p-[4vw] pt-[12vh] animate-in zoom-in fade-in duration-700">
            {/* Imagem do Produto */}
            <div className="w-full h-[40vh] relative mb-[4vh]">
              <div className="absolute inset-0 bg-black/10 rounded-[4vh] transform rotate-3 scale-105"></div>
              <div className="relative w-full h-full bg-white rounded-[4vh] overflow-hidden shadow-2xl border-[1vh] border-white">
                <img 
                  src={currentPromo.imageUrl} 
                  alt={promoProduct?.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-[2vh] right-[2vh] bg-red-600 text-white font-black px-[2vw] py-[1vh] rounded-full text-[2.5vh] shadow-lg transform rotate-12">
                  FRESH
                </div>
              </div>
            </div>

            {/* Informações da Oferta */}
            <div className="text-center w-full space-y-[2vh]">
              <h3 className="text-[7.5vh] font-oswald font-black text-red-900 uppercase leading-none tracking-tighter drop-shadow-sm">
                {promoProduct?.name}
              </h3>
              <div className="bg-red-900 text-white px-[2vw] py-[1vh] rounded-xl inline-block">
                <p className="text-[2.8vh] font-bold italic">
                  "{currentPromo.description}"
                </p>
              </div>
            </div>

            {/* Preço de Oferta Gigante */}
            <div className="mt-auto mb-[2vh] w-full flex items-center justify-center bg-red-700 text-white py-[4vh] rounded-[3vh] shadow-2xl border-b-[1vh] border-red-900 relative">
               <span className="text-[5vh] font-black absolute left-[3vw] top-[3vh] opacity-50 italic">SÓ HOJE</span>
               <div className="flex items-start">
                  <span className="text-[4vh] font-black mt-[2vh] mr-2">R$</span>
                  <span className="text-[16vh] font-oswald font-black leading-[0.8] tracking-tighter drop-shadow-2xl">
                    {formatPrice(currentPromo.offerPrice).integer}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[7vh] font-oswald font-black leading-none">
                      ,{formatPrice(currentPromo.offerPrice).decimal}
                    </span>
                    <span className="text-[2.5vh] font-bold uppercase tracking-wider text-[#ffd700]">
                      por {promoProduct?.unit}
                    </span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Barra de Rodapé com Aviso */}
        <div className="h-[6vh] bg-black flex items-center justify-center px-4">
          <p className="text-[#ffd700] font-black text-[1.8vh] uppercase tracking-[0.2em] whitespace-nowrap">
            ⚠️ Imagens meramente ilustrativas • Ofertas válidas enquanto durarem os estoques
          </p>
        </div>
      </div>
    </div>
  );
};

export default TvView;
