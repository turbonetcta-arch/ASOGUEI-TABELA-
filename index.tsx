
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro do Service Worker para PWA (Offline & Instalação)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando ./sw.js para garantir que o escopo seja relativo à raiz do app
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('PWA Service Worker ativo:', registration.scope);
    }).catch(err => {
      console.warn('PWA falhou ao registrar:', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
