import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PrintProvider } from './state/PrintProvider.tsx';
import { ProfileProvider } from './state/ProfileProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProfileProvider>
      <PrintProvider>
        <App />
      </PrintProvider>
    </ProfileProvider>
  </StrictMode>
);
