/**
 * Dịch vụ TrainService mô phỏng việc giữ chỗ vé
 */
const TrainService = {
    prepare: (bookingData) => {
        console.log(`[TrainService] Nhận lệnh PREPARE cho vé tàu: ${bookingData.trainCode}`);
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

module.exports = TrainService;
