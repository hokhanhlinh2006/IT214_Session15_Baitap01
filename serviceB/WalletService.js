/**
 * Dịch vụ WalletService mô phỏng việc trừ tiền
 */
const WalletService = {
    prepare: (bookingData) => {
        console.log(`[WalletService] Nhận lệnh PREPARE để trừ ${bookingData.price} VND từ ví: ${bookingData.customerWalletId}`);
        
        // Mô phỏng kiểm tra số dư ví (Giả sử ví đang có 1,000,000 VND)
        const currentBalance = 1000000;
        
        if (currentBalance >= bookingData.price) {
            console.log(`[WalletService] Số dư đủ. Phản hồi: READY`);
            return "READY";
        } else {
            console.log(`[WalletService] LỖI: Số dư không đủ (Hiện tại: ${currentBalance} VND). Phản hồi: ABORT`);
            return "ABORT";
        }
    },
    commit: (bookingData) => {
        console.log(`[WalletService] Nhận lệnh COMMIT cho mã đặt vé: ${bookingData.bookingId}`);
        console.log(`[WalletService] Hoàn tất trừ tiền. Ví đã được cập nhật.`);
        return "OK";
    },
    rollback: (bookingData) => {
        console.log(`[WalletService] Nhận lệnh ROLLBACK cho mã đặt vé: ${bookingData.bookingId}`);
        console.log(`[WalletService] Đã hoàn tác giao dịch ví. Không có tiền bị trừ.`);
        return "OK";
    }
};

module.exports = WalletService;
