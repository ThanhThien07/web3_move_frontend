export const MIST_PER_SUI = BigInt(1000000000);
export const DEFAULT_SUI_COIN_TYPE = '0x2::sui::SUI';

export interface PaymentConfig {
  packageId: string;
  treasuryId: string;
  adminId: string;
  receiver: string;
  booksApiBaseUrl: string;
  tokenName: string;
  coinType: string;
  libraryId: string;
}

// 🚀 LẤY ĐỊA CHỈ API TỪ BIẾN MÔI TRƯỜNG (Dành cho Netlify)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEVNET_CONFIG: PaymentConfig = {
  packageId: '0x...', 
  treasuryId: '0x...',
  adminId: '0x...',
  receiver: '0x8898f0927e53a2512f458e0a811802e334a179379860b7b15d0257e1d51a95e0',
  booksApiBaseUrl: API_BASE_URL,
  tokenName: 'SUI',
  coinType: DEFAULT_SUI_COIN_TYPE,
  libraryId: '0x...'
};

const TESTNET_CONFIG: PaymentConfig = {
  packageId: '0x...',
  treasuryId: '0x...',
  adminId: '0x...',
  receiver: '0x8898f0927e53a2512f458e0a811802e334a179379860b7b15d0257e1d51a95e0',
  booksApiBaseUrl: API_BASE_URL,
  tokenName: 'SUI',
  coinType: DEFAULT_SUI_COIN_TYPE,
  libraryId: '0x...'
};

export const getPaymentConfig = (): PaymentConfig => {
  return TESTNET_CONFIG;
};
