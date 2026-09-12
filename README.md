# VNPT Service Registration Landing Page (Google Sheets Backend)

Landing Page giới thiệu & thu thập đăng ký các gói dịch vụ viễn thông & giải pháp số **VNPT** (Tập đoàn Bưu chính Viễn thông Việt Nam), tích hợp trực tiếp **Google Sheets** làm backend thông qua **Google Apps Script Web App**.

---

## 📌 Tính năng nổi bật & Tuân thủ yêu cầu

1. **4 Nhóm sản phẩm trọng tâm**:
   - **Combo Internet + Truyền hình "Gói Cưới"** (Home Combo hộ mới)
   - **Sim Số & Data** (Sim số đẹp + gói cước di động VinaPhone)
   - **Camera An Ninh** (Thiết bị VNPT Home Camera 360°/IP66 + Gói Cloud)
   - **Chữ Ký Số** (VNPT SmartCA cá nhân & doanh nghiệp không cần USB Token)
2. **Backend Serverless Google Sheets**:
   - Quản lý gói cước động qua 4 tab Google Sheet (`combo_internet`, `sim_so`, `camera_an_ninh`, `chu_ky_so`).
   - Cập nhật giá / gói cước trên Sheet sẽ phản ánh ngay trên Landing Page mà không cần build lại.
3. **Form đăng ký Real-time Write & Đồng bộ**:
   - Gọi `POST` đến Google Apps Script Web App.
   - Script thực hiện `appendRow()` và `SpreadsheetApp.flush()` để ghi đĩa tức thời vào tab `submissions`.
   - Frontend **chỉ hiển thị thông báo thành công sau khi nhận được xác nhận HTTP 200 `{ status: "success" }`**.
   - Nếu xảy ra lỗi mạng / quota: hiển thị thông báo lỗi rõ ràng, **giữ nguyên dữ liệu người dùng đã nhập** để bấm thử lại.
4. **Chuẩn nhận diện thương hiệu VNPT**:
   - Tông màu chủ đạo: Xanh dương VNPT (`#005BAA`, `#003870`), nền sáng `#F8FAFC`.
   - Responsive hoàn hảo từ Mobile 375px đến Desktop 1440px.
   - Không chứa mã đăng nhập thừa, không dark mode, không đa ngôn ngữ.

---

## 🚀 Hướng dẫn 3 bước kết nối Google Sheets thật

### Bước 1: Chuẩn bị Google Sheet
1. Tạo một bảng tính Google Sheets mới tại [sheets.google.com](https://sheets.google.com).
2. Đặt tên bảng tính (ví dụ: `VNPT_LandingPage_Data`).

### Bước 2: Dán mã Google Apps Script
1. Trên thanh menu Google Sheets, chọn **Tiện ích mở rộng (Extensions)** > **Apps Script**.
2. Xóa toàn bộ nội dung mặc định trong tệp `Code.gs`.
3. Mở tệp [`google-apps-script/Code.gs`](file:///f:/Landing%20Page/google-apps-script/Code.gs) trong dự án này, copy toàn bộ nội dung và dán vào `Code.gs` trên Google Apps Script.
4. Chọn hàm `setupInitialSheets` trong danh sách hàm và bấm **Chạy (Run)** (cho phép quyền truy cập một lần). Hàm này sẽ tự động tạo đủ 5 tab với đầy đủ dữ liệu mẫu chuẩn VNPT và tạo tab `submissions`.

### Bước 3: Triển khai Web App (Deploy)
1. Ở góc trên bên phải của Apps Script, bấm nút **Triển khai (Deploy)** > **Tùy chọn triển khai mới (New deployment)**.
2. Chọn loại triển khai: **Ứng dụng web (Web App)**.
   - **Mô tả**: `VNPT Backend v1`
   - **Thực thi dưới dạng (Execute as)**: `Tôi (Me)`
   - **Ai có quyền truy cập (Who has access)**: `Bất kỳ ai (Anyone)` *(Bắt buộc để form frontend có thể gửi dữ liệu)*.
3. Bấm **Triển khai (Deploy)**.
4. Copy đường dẫn **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
5. Mở file [`js/config.js`](file:///f:/Landing%20Page/js/config.js), dán URL vừa copy vào biến:
   ```javascript
   const CONFIG = {
     APPS_SCRIPT_ENDPOINT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
     ...
   };
   ```

---

## 📂 Cấu trúc thư mục dự án

```text
├── index.html                  # Semantic HTML5 Landing Page
├── css/
│   └── style.css               # Hệ thống Style chuẩn VNPT Brand, Responsive & Micro-interactions
├── js/
│   ├── config.js               # Cấu hình APPS_SCRIPT_ENDPOINT_URL & Dữ liệu dự phòng
│   ├── api.js                  # API Client kết nối Google Apps Script (GET & POST)
│   └── app.js                  # Logic Frontend điều phối UI, Form Validation & Submit
├── google-apps-script/
│   └── Code.gs                 # Backend Apps Script (doGet, doPost, setupInitialSheets)
└── README.md                   # Hướng dẫn chi tiết
```

## ⚠️ Lưu ý khi deploy lên Vercel

Đây là site tĩnh (static HTML/CSS/JS), **không cần chạy `server.js` khi lên production** — file đó chỉ dùng để preview local (`npm run dev`).

Đã thêm sẵn `vercel.json` ép cấu hình static hosting tường minh (không để Vercel tự suy luận framework), tránh lỗi vỡ giao diện do CSS/JS không được serve đúng.

Nếu vẫn gặp lỗi sau khi deploy lại:
1. Vào Vercel Dashboard > Project > Settings > General, kiểm tra **Root Directory** trỏ đúng vào thư mục chứa `index.html` (không lồng thêm 1 cấp thư mục con).
2. Mở DevTools (F12) > tab Network trên bản deploy, reload trang, lọc theo `style.css` và các file `.js` — xem status code có phải 404 không, và Content-Type có đúng `text/css`/`application/javascript` không.
3. Xóa cache deployment cũ và **Redeploy** (không dùng cache) để chắc chắn cấu hình mới được áp dụng.
