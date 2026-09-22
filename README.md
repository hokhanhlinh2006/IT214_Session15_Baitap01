# Báo cáo phân tích: Mô phỏng giao thức 2PC cho giao dịch đặt vé

## 1. Mô tả quy trình 2-Phase Commit (2PC) được mô phỏng

Giao thức 2-Phase Commit (2PC) là một cơ chế đồng thuận phân tán giúp đảm bảo tính nhất quán của dữ liệu trên nhiều cơ sở dữ liệu hoặc dịch vụ (microservices) khác nhau. Toàn bộ giao dịch sẽ tuân theo tính chất nguyên tử (Atomicity): hoặc là tất cả đều thành công (Commit), hoặc không có gì thay đổi (Rollback).

Trong kịch bản đặt vé tàu hỏa, chúng ta có 1 nút điều phối (Coordinator) và 2 dịch vụ tham gia (Participants) là `TrainService` (quản lý ghế ngồi) và `WalletService` (quản lý tiền trong ví).

Giao thức diễn ra qua 2 giai đoạn:

### Giai đoạn 1: Chuẩn bị (Prepare Phase)
- **Coordinator** gửi lệnh `PREPARE` chứa thông tin đơn hàng tới cả `TrainService` và `WalletService`.
- Các dịch vụ (Participants) sẽ thực hiện kiểm tra các điều kiện tiên quyết và khóa tài nguyên (nhưng chưa lưu cố định):
  - `TrainService`: Kiểm tra xem tàu `SE5` còn ghế không. Giả sử còn, nó tạm khóa ghế lại và gửi trạng thái `READY` về cho Coordinator.
  - `WalletService`: Kiểm tra xem ví `W-456` có đủ 1,200,000 VND không. Trong tình huống mô phỏng, do ví chỉ có 1,000,000 VND, nó không đủ tiền nên sẽ từ chối khóa tiền và trả về trạng thái `ABORT`.

### Giai đoạn 2: Quyết định (Commit / Rollback Phase)
- **Coordinator** tổng hợp các phản hồi từ Giai đoạn 1.
- **Quyết định**:
  - Nếu **TẤT CẢ** các dịch vụ đều phản hồi là `READY`, Coordinator sẽ gửi lệnh `COMMIT` tới tất cả các dịch vụ để chốt dữ liệu vào cơ sở dữ liệu.
  - Nếu có **BẤT KỲ MỘT** dịch vụ nào phản hồi là `ABORT` (hoặc timeout không phản hồi), Coordinator bắt buộc phải gửi lệnh `ROLLBACK` tới toàn bộ các dịch vụ.
- Trong kịch bản hiện tại, do `WalletService` trả về `ABORT`, Coordinator quyết định gửi lệnh `ROLLBACK` đến cả `TrainService` và `WalletService`.
- Nhờ lệnh `ROLLBACK`, `TrainService` sẽ mở khóa ghế để bán cho người khác, đảm bảo hệ thống không bị giữ chỗ ảo.

## 2. Mã nguồn mô phỏng (JavaScript / Node.js)

Mã nguồn được viết bằng ngôn ngữ JavaScript (có thể hiểu như mã giả) nằm trong file `2pc_simulation.js`. File này thể hiện đúng logic của Coordinator:

```javascript
// Trích đoạn logic của Coordinator:
function coordinator(bookingData) {
    // PHASE 1: PREPARE
    const trainStatus = TrainService.prepare(bookingData);
    const walletStatus = WalletService.prepare(bookingData);
    
    // PHASE 2: COMMIT / ROLLBACK
    if (trainStatus === "READY" && walletStatus === "READY") {
        TrainService.commit(bookingData);
        WalletService.commit(bookingData);
    } else {
        TrainService.rollback(bookingData);
        WalletService.rollback(bookingData);
    }
}
```

## 3. Kết quả chạy thử

Với dữ liệu đầu vào theo đề bài:
```json
{
 "bookingId": "TRAIN-2024-089",
 "trainCode": "SE5",
 "customerWalletId": "W-456",
 "price": 1200000
}
```

(Giả sử ví của khách đang chỉ có `1,000,000 VND`).

**Output in ra màn hình console:**

```text
--- BẮT ĐẦU GIAO DỊCH ĐẶT VÉ (TRAIN-2024-089) ---
Dữ liệu đầu vào: {
  bookingId: 'TRAIN-2024-089',
  trainCode: 'SE5',
  customerWalletId: 'W-456',
  price: 1200000
}

>>> PHASE 1: PREPARE (Chuẩn bị) <<<
[TrainService] Nhận lệnh PREPARE cho vé tàu: SE5
[TrainService] Giữ chỗ thành công. Phản hồi: READY
[WalletService] Nhận lệnh PREPARE để trừ 1200000 VND từ ví: W-456
[WalletService] LỖI: Số dư không đủ (Hiện tại: 1000000 VND). Phản hồi: ABORT

>>> PHASE 2: COMMIT/ROLLBACK (Quyết định) <<<
[Coordinator] Có ít nhất một dịch vụ trả về ABORT. Quyết định: ROLLBACK
[TrainService] Nhận lệnh ROLLBACK cho mã đặt vé: TRAIN-2024-089
[TrainService] Đã hủy giữ chỗ và giải phóng vé.
[WalletService] Nhận lệnh ROLLBACK cho mã đặt vé: TRAIN-2024-089
[WalletService] Đã hoàn tác giao dịch ví. Không có tiền bị trừ.

--- GIAO DỊCH THẤT BẠI (ĐÃ HOÀN TÁC) ---
```

### Giải thích quyết định Commit hay Rollback
- Trong Output, chúng ta thấy ở Pha 1, `TrainService` trả về `READY` nhưng `WalletService` trả về `ABORT`.
- Bước sang Pha 2, do điều kiện của 2PC là phải 100% `READY`, chương trình nhận thấy có một kết quả là `ABORT` nên nó đã gọi hàm `.rollback()` của TẤT CẢ các dịch vụ.
- Mặc dù `TrainService` không bị lỗi, nó vẫn nhận được lệnh `ROLLBACK` và in ra log: `"Đã hủy giữ chỗ và giải phóng vé"`, cho thấy hệ thống hoạt động chính xác theo chuẩn 2PC, giúp đảm bảo tính nhất quán (không xảy ra tình trạng khách bị giữ ghế nhưng lại chưa trừ tiền).
