export const MIST_PER_SUI = BigInt(1000000000);

export interface PaymentConfig {
  packageId: string;
  treasuryId: string;
  adminId: string;
  receiver: string;
  booksApiBaseUrl: string;
}

// Cấu hình mạng lưới (ưu tiên Testnet cho phát triển)
const DEVNET_CONFIG: PaymentConfig = {
  packageId: '0x...', 
  treasuryId: '0x...',
  adminId: '0x...',
  receiver: '0x8898f0927e53a2512f458e0a811802e334a179379860b7b15d0257e1d51a95e0',
  booksApiBaseUrl: 'http://localhost:3001' // 🚀 Backend cho Frontend (Cổng 3001)
};

const TESTNET_CONFIG: PaymentConfig = {
  packageId: '0x...',
  treasuryId: '0x...',
  adminId: '0x...',
  receiver: '0x8898f0927e53a2512f458e0a811802e334a179379860b7b15d0257e1d51a95e0',
  booksApiBaseUrl: 'http://localhost:3001' // 🚀 Backend cho Frontend (Cổng 3001)
};

export const getPaymentConfig = (): PaymentConfig => {
  // Bạn có thể đổi sang DEVNET_CONFIG nếu muốn thử nghiệm devnet
  return TESTNET_CONFIG;
};
