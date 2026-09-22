/**
 * Mô phỏng giao dịch đặt vé với giao thức 2-Phase Commit (2PC)
 */

// Dịch vụ TrainService mô phỏng việc giữ chỗ vé
const TrainService = {
    prepare: (bookingData) => {
        console.log(`[TrainService] Nhận lệnh PREPARE cho vé tàu: ${bookingData.trainCode}`);
        // Giả sử luôn giữ chỗ thành công
        console.log(`[TrainService] Giữ chỗ thành công. Phản hồi: READY`);
        return "READY";
    },
    commit: (bookingData) => {
        console.log(`[TrainService] Nhận lệnh COMMIT cho mã đặt vé: ${bookingData.bookingId}`);
        console.log(`[TrainService] Hoàn tất giao dịch. Vé đã được xác nhận.`);
        return "OK";
    },
    rollback: (bookingData) => {
        console.log(`[TrainService] Nhận lệnh ROLLBACK cho mã đặt vé: ${bookingData.bookingId}`);
        console.log(`[TrainService] Đã hủy giữ chỗ và giải phóng vé.`);
        return "OK";
    }
};

// Dịch vụ WalletService mô phỏng việc trừ tiền
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

// ----------------------
// Kịch bản chạy thử (Test Cases)
// ----------------------

// 1. Dữ liệu đề bài (Sẽ thất bại do giá vé 1,200,000 > Số dư 1,000,000)
const bookingDataFailed = {
    bookingId: "TRAIN-2024-089",
    trainCode: "SE5",
    customerWalletId: "W-456",
    price: 1200000
};

// 2. Dữ liệu giả lập thành công (Giá vé 500,000 < Số dư 1,000,000)
const bookingDataSuccess = {
    bookingId: "TRAIN-2024-090",
    trainCode: "SE5",
    customerWalletId: "W-456",
    price: 500000
};

// Chạy kịch bản thất bại theo đề bài
coordinator(bookingDataFailed);

// Chạy kịch bản thành công để minh họa
// coordinator(bookingDataSuccess);
