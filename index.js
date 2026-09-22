const TrainService = require('./serviceA/TrainService');
const WalletService = require('./serviceB/WalletService');

// Hàm Coordinator điều phối giao thức 2PC
function coordinator(bookingData) {
    console.log(`\n--- BẮT ĐẦU GIAO DỊCH ĐẶT VÉ (${bookingData.bookingId}) ---`);
    console.log(`Dữ liệu đầu vào:`, bookingData);
    
    console.log("\n>>> PHASE 1: PREPARE (Chuẩn bị) <<<");
    
    // Gửi lệnh Prepare tới tất cả các services
    const trainStatus = TrainService.prepare(bookingData);
    const walletStatus = WalletService.prepare(bookingData);
    
    console.log("\n>>> PHASE 2: COMMIT/ROLLBACK (Quyết định) <<<");
    
    // Đánh giá kết quả Prepare
    if (trainStatus === "READY" && walletStatus === "READY") {
        console.log(`[Coordinator] Nhận được phản hồi READY từ TẤT CẢ các dịch vụ. Quyết định: COMMIT`);
        TrainService.commit(bookingData);
        WalletService.commit(bookingData);
        console.log(`\n--- GIAO DỊCH THÀNH CÔNG ---`);
    } else {
        console.log(`[Coordinator] Có ít nhất một dịch vụ trả về ABORT. Quyết định: ROLLBACK`);
        TrainService.rollback(bookingData);
        WalletService.rollback(bookingData);
        console.log(`\n--- GIAO DỊCH THẤT BẠI (ĐÃ HOÀN TÁC) ---`);
    }
}

// 1. Dữ liệu đề bài (Sẽ thất bại do giá vé > Số dư)
const bookingDataFailed = {
    bookingId: "TRAIN-2024-089",
    trainCode: "SE5",
    customerWalletId: "W-456",
    price: 1200000
};

// Chạy kịch bản
coordinator(bookingDataFailed);
