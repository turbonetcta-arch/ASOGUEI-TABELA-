
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS } from './constants';
import AdminPanel from './components/AdminPanel';
import TvView from './components/TvView';
import RemoteController from './components/RemoteController';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('asoguiro_v3');
    if (saved) {
      try {
        return {
          storeName: 'AÇOUGUE PREMIUM',
          products: INITIAL_PRODUCTS,
          promotions: INITIAL_PROMOTIONS,
          superOffer: { productIds: [], discountPrices: {}, isActive: false },
          view: 'ADMIN',
          tvOrientation: 0,
          promoInterval: 6000,
          ...JSON.parse(saved)
        };
      } catch (e) {
        console.error("Persistence error:", e);
      }
    }
    
    return {
      storeName: 'AÇOUGUE PREMIUM',
      products: INITIAL_PRODUCTS,
      promotions: INITIAL_PROMOTIONS,
      superOffer: { productIds: [], discountPrices: {}, isActive: false },
      view: 'ADMIN',
      tvOrientation: 0,
      promoInterval: 6000
    };
  });

  const [highlightedPromoId, setHighlightedPromoId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('asoguiro_v3', JSON.stringify(state));
  }, [state]);

  // Handle URL params for mode selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'tv') setState(prev => ({ ...prev, view: 'TV' }));
    if (mode === 'controller') setState(prev => ({ ...prev, view: 'ADMIN' })); // Logic for controller mode can be added here
  }, []);

  // Mock Remote Commands for development/local testing
  const sendRemoteCommand = (command: string, payload?: any) => {
    console.log(`[Remote] Executing: ${command}`, payload);
    if (command === 'SHOW_FULL_PROMO') {
      setHighlightedPromoId(payload.promoId);
      setTimeout(() => setHighlightedPromoId(null), 8000); // Highlight for 8s
    }
    if (command === 'FORCE_UPDATE') {
      window.location.reload();
    }
  };

  if (state.view === 'TV') {
    return <TvView state={state} highlightedPromoId={highlightedPromoId} />;
  }

  return (
    <AdminPanel 
      state={state} 
      setState={setState} 
      onEnterTvMode={() => setState(prev => ({ ...prev, view: 'TV' }))}
      onEnterControllerMode={() => {}} 
      sendRemoteCommand={sendRemoteCommand}
    />
  );
};

export default App;
