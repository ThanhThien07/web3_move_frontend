import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@mysten/dapp-kit/dist/index.css';

import Navbar from './components/Navbar';
import { AuthProvider } from './components/AuthContext';
import { I18nProvider, useI18n } from './i18n';
import Home from './pages/Home';
import MyCollection from './pages/MyCollection';
import Checkout from './pages/Checkout';
import Favorites from './pages/Favorites';
import PurchaseHistory from './pages/PurchaseHistory';

const { networkConfig } = createNetworkConfig({
  devnet: { url: 'https://fullnode.devnet.sui.io:443' } as any,
  testnet: { url: 'https://fullnode.testnet.sui.io:443' } as any,
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443' } as any,
});

const queryClient = new QueryClient();

function AppContent() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Toaster position="top-right" richColors />
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-24 min-h-[80vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<MyCollection />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/history" element={<PurchaseHistory />} />
          <Route path="/checkout/:id" element={<Checkout />} />
        </Routes>
      </main>

      <footer className="pt-10 pb-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 px-6 max-w-7xl mx-auto text-slate-500 text-sm">
        <p>{t('footerText')} Phong cách Alphabooks.</p>
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Smart Contract</a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <I18nProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </AuthProvider>
          </I18nProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
