# Web3 Move Library Platform

Dự án này là một nền tảng Web3 dành cho thư viện, cho phép người dùng sử dụng token trên mạng lưới blockchain Sui (SUI token) để thanh toán và trao đổi quyền truy cập các tựa sách điện tử (e-books).

## Tính năng chính

- **Tìm kiếm sách**: Giao diện thân thiện và trực quan cho phép người dùng tìm kiếm sách theo tên, tác giả hoặc chủ đề.
- **Thanh toán Web3 bằng Sui**: Sử dụng SUI token (hoặc custom token tùy chỉnh trên mạng Sui) để thanh toán phí mua hoặc mượn sách. Giao dịch diễn ra nhanh chóng với chi phí gas cực thấp.
- **Xác thực tự động**: Hệ thống sẽ tự động xác minh giao dịch (transaction digest) trên chuỗi (on-chain). Nếu giao dịch thành công, quyền truy cập sách (link tải/đọc online) sẽ được cấp tức thì cho người dùng.
- **Tích hợp ví Sui**: Tích hợp `@mysten/dapp-kit` cho phép người dùng kết nối ví (Sui Wallet, Ethos, etc.), quản lý số dư và thực hiện giao dịch một cách liền mạch, bảo mật.
- **Lịch sử giao dịch**: Người dùng có thể theo dõi lại các giao dịch đã thực hiện và truy cập lại sách mình đã mua từ hệ thống lịch sử của thư viện.

## Cấu trúc dự án

Dự án bao gồm các thành phần chính:
- `web3/`: Chứa mã nguồn smart contract viết bằng ngôn ngữ Move cho mạng lưới Sui. Tại đây sẽ định nghĩa các logic on-chain như token thanh toán, sở hữu sách, quyền truy cập.
- `web3_move_frontend/`: Giao diện người dùng (được xây dựng bằng React, Vite, Tailwind CSS). Chức năng chính là tìm kiếm sách, kết nối ví và gửi giao dịch mua sách.
- `web3_move_backend/` (Đang phát triển): Backend bằng Node.js/Express dùng để xác nhận tính hợp lệ của giao dịch Sui, cũng như bảo mật đường link trả về cho sách, tránh việc link sách bị lộ khi chưa thanh toán.

## Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js (v18+)
- pnpm
- Sui CLI (để compile và publish smart contracts nếu cần)

### Cài đặt và Chạy Frontend

1. Di chuyển vào thư mục frontend:
   ```bash
   cd web3_move_frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   pnpm install
   ```
3. Chạy ứng dụng trên môi trường dev:
   ```bash
   pnpm dev
   ```

## Smart Contract (Move)

Các hợp đồng thông minh được đặt trong thư mục `web3/sources`. Chúng được sử dụng để:
- Định nghĩa chuẩn tiền tệ thanh toán cho nền tảng thư viện.
- Xử lý và ghi nhận quyền sở hữu, vé mượn sách on-chain thông qua các đối tượng (objects) độc nhất trên Sui.

Để biên dịch contract:
```bash
cd web3
sui move build
```

Để publish contract lên mạng lưới:
```bash
sui client publish --gas-budget 100000000
```

## Công nghệ sử dụng
- **Blockchain**: Sui Network
- **Ngôn ngữ Smart Contract**: Sui Move
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Web3 SDK**: `@mysten/sui`, `@mysten/dapp-kit-react`
