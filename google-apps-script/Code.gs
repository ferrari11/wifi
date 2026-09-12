/**
 * GOOGLE APPS SCRIPT - BACKEND CHO VNPT LANDING PAGE
 * 
 * Hướng dẫn triển khai:
 * 1. Mở Google Sheet của bạn.
 * 2. Vào Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Dán toàn bộ mã nguồn này vào tệp Code.gs.
 * 4. Chạy hàm `setupInitialSheets()` một lần nếu muốn khởi tạo lại cấu trúc tab chuẩn.
 * 5. Bấm "Triển khai" (Deploy) -> "Quản lý tùy chọn triển khai" (Manage deployments).
 * 6. Chọn biểu tượng cây bút ✏️ (Chỉnh sửa) -> Ở mục "Phiên bản" (Version), chọn "Phiên bản mới" (New version) -> Bấm Triển khai (Deploy).
 */

const SHEET_TABS = {
  COMBO: 'combo_internet',
  SIM: 'sim_so',
  CAMERA: 'camera_an_ninh',
  CA: 'chu_ky_so',
  SUBMISSIONS: 'submissions'
};

/**
 * Xử lý yêu cầu GET - Đọc danh sách gói cước theo thời gian thực (Luôn ép flush để lấy dòng mới nhất)
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const callback = params.callback || params.jsonp;
    
    // Nếu là yêu cầu gửi form đăng ký qua GET
    if (params.action === 'submit' || (params.phone && (params.fullName || params.name))) {
      const fullName = (params.fullName || params.name || '').trim();
      const phone = (params.phone || params.phoneNumber || '').trim();
      const packageInterest = (params.packageInterest || params.package_name || 'Tư vấn chung').trim();
      const note = (params.note || '').trim();

      const subResponse = createSubmission(fullName, phone, packageInterest, note);
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(subResponse) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(subResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ép cập nhật bộ nhớ cache nội bộ của Google Sheets
    SpreadsheetApp.flush();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {
      status: 'success',
      timestamp: Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      data: {
        combo_internet: getSheetDataSmart(ss, ['combo_internet', 'combo internet', 'combo', 'internet', 'goi cuoi', 'gói cưới', 'home combo']),
        sim_so: getSheetDataSmart(ss, ['sim_so', 'sim số', 'sim so', 'sim', 'di động', 'vinaphone']),
        camera_an_ninh: getSheetDataSmart(ss, ['camera_an_ninh', 'camera an ninh', 'camera', 'home camera', 'giam sat']),
        chu_ky_so: getSheetDataSmart(ss, ['chu_ky_so', 'chữ ký số', 'chu ky so', 'smartca', 'ca', 'token'])
      }
    };

    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errObj = {
      status: 'error',
      message: error.toString()
    };
    const callback = (e && e.parameter && (e.parameter.callback || e.parameter.jsonp));
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(errObj) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(errObj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Xử lý yêu cầu POST - Ghi nhận đơn đăng ký ĐỒNG BỘ & TỨC THỜI vào tab submissions
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const fullName = (payload.fullName || payload.name || '').trim();
    const phone = (payload.phone || payload.phoneNumber || '').trim();
    const packageInterest = (payload.packageInterest || payload.package_name || 'Tư vấn chung').trim();
    const note = (payload.note || '').trim();

    return recordSubmission(fullName, phone, packageInterest, note);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Lỗi ghi nhận dữ liệu: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Ghi nhận dòng mới vào tab submissions (Đồng bộ, appendRow + flush)
 */
function createSubmission(fullName, phone, packageInterest, note) {
  if (!fullName || !phone) {
    return {
      status: 'error',
      message: 'Họ tên và số điện thoại không được để trống.'
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let subSheet = ss.getSheetByName(SHEET_TABS.SUBMISSIONS);
  
  if (!subSheet) {
    subSheet = ss.insertSheet(SHEET_TABS.SUBMISSIONS);
    subSheet.appendRow(['Timestamp', 'Họ và tên', 'Số điện thoại', 'Gói quan tâm', 'Ghi chú', 'Trạng thái xử lý']);
    subSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#005BAA').setFontColor('#FFFFFF');
  }

  const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  const newRow = [
    timestamp,
    fullName,
    "'" + phone,
    packageInterest,
    note,
    'Mới'
  ];

  subSheet.appendRow(newRow);
  SpreadsheetApp.flush();

  return {
    status: 'success',
    message: 'Đăng ký thành công! VNPT sẽ liên hệ tư vấn trong 15 phút.',
    timestamp: timestamp,
    data: {
      fullName: fullName,
      phone: phone,
      packageInterest: packageInterest
    }
  };
}

function recordSubmission(fullName, phone, packageInterest, note) {
  const result = createSubmission(fullName, phone, packageInterest, note);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Đọc thông minh dữ liệu từ một Sheet theo danh sách tên tab dự phòng
 * Hỗ trợ tự động fallback vị trí cột nếu người dùng đặt tên cột tùy ý
 */
function getSheetDataSmart(ss, possibleNames) {
  let sheet = null;
  for (let i = 0; i < possibleNames.length; i++) {
    sheet = ss.getSheetByName(possibleNames[i]);
    if (sheet) break;
  }

  // Quét theo normalized name nếu không khớp tên chính xác
  if (!sheet) {
    const allSheets = ss.getSheets();
    for (let i = 0; i < allSheets.length; i++) {
      const normName = normalizeString(allSheets[i].getName());
      for (let j = 0; j < possibleNames.length; j++) {
        if (normName.includes(normalizeString(possibleNames[j])) || normalizeString(possibleNames[j]).includes(normName)) {
          sheet = allSheets[i];
          break;
        }
      }
      if (sheet) break;
    }
  }

  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const rawHeaders = data[0].map(h => normalizeString(String(h)));
  const headerMap = mapHeaders(rawHeaders);
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Bỏ qua nếu dòng rỗng
    const isRowEmpty = row.every(cell => cell === '' || cell === null || cell === undefined);
    if (isRowEmpty) continue;

    // Lấy tên gói (ưu tiên header tìm được, nếu không tìm thấy header thì lấy cột 0)
    let packageName = getCellValue(row, headerMap.package_name);
    if (!packageName && headerMap.package_name === -1 && row.length > 0) {
      packageName = row[0];
    }
    if (!packageName || String(packageName).trim() === '') continue;

    // Lấy giá
    let price = getCellValue(row, headerMap.price, '');
    if (!price && headerMap.price === -1 && row.length > 1) price = row[1];
    if (!price) price = 'Liên hệ';

    // Lấy mô tả
    let description = getCellValue(row, headerMap.description, '');
    if (!description && headerMap.description === -1 && row.length > 2) description = row[2];

    // Lấy tính năng
    let rawFeatures = getCellValue(row, headerMap.features, '');
    if (!rawFeatures && headerMap.features === -1 && row.length > 3) rawFeatures = row[3];

    // Lấy nút CTA
    let ctaLabel = getCellValue(row, headerMap.cta_label, '');
    if (!ctaLabel && headerMap.cta_label === -1 && row.length > 4) ctaLabel = row[4];
    if (!ctaLabel) ctaLabel = 'Đăng ký ngay';

    // Lấy trạng thái is_active
    let rawActive = getCellValue(row, headerMap.is_active, '');
    if (rawActive === '' && headerMap.is_active === -1 && row.length > 5) rawActive = row[5];
    const isActive = checkIsActive(rawActive);
    if (!isActive) continue;

    // Lấy badge & highlight
    let badge = getCellValue(row, headerMap.badge, '');
    if (!badge && headerMap.badge === -1 && row.length > 6) badge = row[6];

    let rawHighlight = getCellValue(row, headerMap.highlight, false);
    if (rawHighlight === false && headerMap.highlight === -1 && row.length > 7) rawHighlight = row[7];

    const featureList = parseFeatures(rawFeatures);

    rows.push({
      package_name: String(packageName).trim(),
      price: String(price).trim(),
      description: String(description).trim(),
      features: String(rawFeatures || '').trim(),
      feature_list: featureList,
      cta_label: String(ctaLabel).trim() || 'Đăng ký ngay',
      badge: String(badge || '').trim(),
      highlight: checkIsHighlight(rawHighlight),
      is_active: true
    });
  }

  return rows;
}

/**
 * Mapping các biến thể tiêu đề cột Tiếng Việt và Tiếng Anh
 */
function mapHeaders(headers) {
  const findIndex = (aliases) => {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      for (let j = 0; j < aliases.length; j++) {
        if (h === aliases[j] || h.includes(aliases[j])) return i;
      }
    }
    return -1;
  };

  return {
    package_name: findIndex(['package_name', 'packagename', 'tengoi', 'tengoidichvu', 'tengoicuoc', 'goicuoc', 'goi', 'name', 'ten', 'dichvu']),
    price: findIndex(['price', 'gia', 'giacuoc', 'giatien', 'chiphi', 'cuoc', 'phi']),
    description: findIndex(['description', 'mota', 'motachitiet', 'desc', 'chitiet', 'thongtin']),
    features: findIndex(['features', 'tinhnang', 'dacdiem', 'uudai', 'noidung', 'quyenloi', 'thongso']),
    cta_label: findIndex(['cta_label', 'cta', 'nutbam', 'nhannut', 'nhancta', 'nut', 'hanhdong']),
    badge: findIndex(['badge', 'huyhieu', 'nhan', 'tag', 'noibatnhan']),
    highlight: findIndex(['highlight', 'noibat', 'khuyendung', 'hot', 'vip']),
    is_active: findIndex(['is_active', 'active', 'kichhoat', 'trangthai', 'hienthi', 'sudung', 'trang_thai'])
  };
}

function getCellValue(row, colIndex, defaultValue = '') {
  if (colIndex === -1 || colIndex >= row.length) return defaultValue;
  const val = row[colIndex];
  return (val !== '' && val !== null && val !== undefined) ? val : defaultValue;
}

function checkIsActive(val) {
  if (val === '' || val === null || val === undefined) return true;
  if (typeof val === 'boolean') return val;
  const str = normalizeString(String(val));
  if (str === 'false' || str === '0' || str === 'no' || str === 'khong' || str === 'tat' || str === 'an') {
    return false;
  }
  return true;
}

function checkIsHighlight(val) {
  if (typeof val === 'boolean') return val;
  const str = normalizeString(String(val));
  return str === 'true' || str === '1' || str === 'yes' || str === 'co' || str === 'noibat' || str === 'hot' || str === 'vip';
}

function parseFeatures(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const str = String(raw);
  
  return str.split(/[;\n\|]/)
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Hàm thiết lập cấu trúc 5 tab và chèn dữ liệu mẫu chuẩn VNPT
 */
function setupInitialSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tab Combo Internet + Truyền hình
  createOrUpdateSheet(ss, SHEET_TABS.COMBO, 
    ['package_name', 'price', 'description', 'features', 'cta_label', 'is_active', 'badge', 'highlight'],
    [
      [
        'Home Net 1',
        '165.000 đ/tháng',
        'Gói cước Internet cáp quang tốc độ cao tiết kiệm cho gia đình trẻ',
        'Tốc độ 150 Mbps thả ga lướt web;Trang bị modem Wifi 5 / Wifi 6 băng tần kép;Phù hợp 3-5 thiết bị truy cập;Miễn phí lắp đặt khi trả trước 6 hoặc 12 tháng',
        'Đăng ký gói',
        'TRUE',
        'Phổ biến',
        'FALSE'
      ],
      [
        'Home Combo Hạnh Phúc (Gói Cưới)',
        '279.000 đ/tháng',
        'Combo Internet + Truyền hình MyTV 4K thiết kế riêng cho hộ gia đình mới',
        'Internet tốc độ 250 Mbps cực nhanh;Truyền hình MyTV VIP 180+ kênh & kho phim 4K;Tặng kèm 01 thiết bị Wifi Mesh tăng phủ sóng;Tặng 30GB data VinaPhone + 1000 phút thoại/tháng;Ưu đãi tặng đến 2 tháng cước khi hòa mạng mới',
        'Đăng ký ngay',
        'TRUE',
        'Gói Cưới Khuyên Dùng',
        'TRUE'
      ],
      [
        'Home Sành 2',
        '239.000 đ/tháng',
        'Combo trọn gói Internet tốc độ cao và Data di động gia đình',
        'Tốc độ 200 Mbps không giới hạn;Tích hợp 5GB Data 4G VinaPhone mỗi ngày;Miễn phí gọi nội mạng VinaPhone;Trang bị modem cao cấp băng tần kép',
        'Đăng ký gói',
        'TRUE',
        'Ưu đãi HOT',
        'FALSE'
      ],
      [
        'Home Đỉnh 2 (Gói Cưới Cao Cấp)',
        '319.000 đ/tháng',
        'Gói cước đỉnh cao cho gia đình đa thiết bị và truyền hình MyTV Nâng Cao',
        'Tốc độ 300 Mbps siêu mượt;Truyền hình MyTV VIP 180+ kênh & kho phim 4K;Tặng kèm 02 thiết bị Wifi Mesh thế hệ mới;Tặng 60GB Data 4G VinaPhone + 1000 phút thoại;Miễn phí modem Wifi 6 cao cấp',
        'Đăng ký ngay',
        'TRUE',
        'Gói Cưới VIP',
        'TRUE'
      ],
      [
        'Home Kết Nối 1',
        '195.000 đ/tháng',
        'Combo gia đình tiết kiệm trọn gói Internet cáp quang và truyền hình MyTV',
        'Tốc độ 150 Mbps ổn định;Truyền hình MyTV 150+ kênh chuẩn HD;Miễn phí modem Wifi băng tần kép;Lắp đặt nhanh chóng trong 24h',
        'Đăng ký gói',
        'TRUE',
        'Tiết Kiệm',
        'FALSE'
      ]
    ]
  );

  // 2. Tab Sim số
  createOrUpdateSheet(ss, SHEET_TABS.SIM,
    ['package_name', 'price', 'description', 'features', 'cta_label', 'is_active', 'badge', 'highlight'],
    [
      [
        'Gói YOLO125V + Sim Số Đẹp',
        '125.000 đ/tháng',
        'Combo Sim số chọn lọc phong thủy kèm data giải trí tốc độ cao',
        '7GB Data tốc độ cao mỗi ngày (210GB/tháng);Miễn phí data xem MyTV & Youtube;Chọn sim số đẹp đầu số 091, 094, 088;Giao sim tận nhà toàn quốc',
        'Chọn số & Đăng ký',
        'TRUE',
        'Data Khủng',
        'TRUE'
      ],
      [
        'Gói VD149 Đẳng Cấp',
        '149.000 đ/tháng',
        'Gói cước thoại & data toàn diện cho khách hàng cá nhân',
        '4GB Data 4G tốc độ cao/ngày (120GB/tháng);Miễn phí cuộc gọi nội mạng dưới 30 phút;200 phút gọi ngoại mạng miễn phí;200 SMS nội mạng/tháng',
        'Đăng ký gói',
        'TRUE',
        'Bán Chạy',
        'FALSE'
      ],
      [
        'VinaPhone Thương Gia 249',
        '249.000 đ/tháng',
        'Gói cước di động trả sau cao cấp dành cho doanh nhân và chủ hộ kinh doanh',
        '4GB Data tốc độ cao mỗi ngày (120GB/tháng);Miễn phí 2.500 phút gọi nội mạng VinaPhone;200 phút gọi tất cả các mạng ngoài;Chọn kho sim thần tài, lộc phát miễn phí',
        'Đăng ký trả sau',
        'TRUE',
        'Doanh Nhân',
        'TRUE'
      ],
      [
        'Gói D30S Siêu Tiết Kiệm',
        '90.000 đ/tháng',
        'Gói data kèm thoại thả ga hàng tháng cho người dùng thường xuyên di chuyển',
        '30GB Data 4G/tháng (1GB/ngày);1.500 phút gọi nội mạng VinaPhone;30 phút gọi ngoại mạng miễn phí;Kích hoạt tức thì qua tin nhắn',
        'Đăng ký gói',
        'TRUE',
        'Tiết Kiệm',
        'FALSE'
      ],
      [
        'Gói BIG50 Giá Rẻ',
        '50.000 đ/tháng',
        'Gói cước di động quốc dân giá rẻ cho học sinh, sinh viên, gia đình',
        '1.5GB Data/ngày (45GB/tháng);Truy cập ứng dụng MyTV OTT miễn phí;Đăng ký dễ dàng, kích hoạt tức thì;Không phát sinh cước vượt gói',
        'Đăng ký ngay',
        'TRUE',
        'Giá Tốt Nhất',
        'FALSE'
      ]
    ]
  );

  // 3. Tab Camera an ninh
  createOrUpdateSheet(ss, SHEET_TABS.CAMERA,
    ['package_name', 'price', 'description', 'features', 'cta_label', 'is_active', 'badge', 'highlight'],
    [
      [
        'Home Camera Trong Nhà 360°',
        '45.000 đ/tháng',
        'Camera xoay 360 độ chuẩn Full HD 1080p có tích hợp AI thông minh',
        'Góc nhìn toàn cảnh 360°, đàm thoại 2 chiều;Phát hiện chuyển động và cảnh báo người xâm nhập AI;Lưu trữ Cloud VNPT chuẩn an toàn tại Data Center Việt Nam;Bảo hành 1 đổi 1 trong 12 tháng tại nhà',
        'Đặt lắp đặt',
        'TRUE',
        'Gia Đình Yêu Thích',
        'FALSE'
      ],
      [
        'Combo 2 Camera + Lưu Trữ Cloud 7 Ngày',
        '90.000 đ/tháng',
        'Giải pháp bảo vệ toàn diện sân vườn, cổng nhà và phòng khách gia đình',
        'Gồm 01 Camera ngoài trời chống nước IP66 + 01 Camera trong nhà;Lưu trữ Cloud xem lại 7 ngày gần nhất;Hình ảnh hồng ngoại sắc nét ban đêm;Miễn phí nhân công lắp đặt & hỗ trợ kỹ thuật 24/7',
        'Đăng ký trọn gói',
        'TRUE',
        'Khuyên Dùng',
        'TRUE'
      ],
      [
        'Combo 3 Camera Biệt Thự + Cloud 30 Ngày',
        '155.000 đ/tháng',
        'Giải pháp giám sát cao cấp cho nhà vườn, biệt thự và chuỗi cửa hàng',
        'Gồm 02 Camera ngoài trời IP66 + 01 Camera 360 trong nhà;Lưu trữ Cloud xem lại trọn vẹn 30 ngày;AI phát hiện vượt hàng rào ảo và hú còi báo động;Hỗ trợ kỹ thuật ưu tiên 24/7',
        'Đăng ký VIP',
        'TRUE',
        'Gói Biệt Thự',
        'TRUE'
      ],
      [
        'Home Camera Ngoài Trời IP66',
        '55.000 đ/tháng',
        'Camera ngoài trời kháng nước kháng bụi, giám sát ngày đêm',
        'Tiêu chuẩn chống nước IP66 chịu mưa nắng;Đèn rọi Spotlight quan sát có màu ban đêm;Cảnh báo còi hú khi phát hiện đột nhập;Quản lý dễ dàng trên ứng dụng VNPT OneHome',
        'Đặt lắp đặt',
        'TRUE',
        'Bền Bỉ',
        'FALSE'
      ],
      [
        'Gói Cloud Camera Nâng Cao 14 Ngày',
        '35.000 đ/tháng',
        'Gói cước lưu trữ đám mây xem lại video 14 ngày cho khách hàng đã có thiết bị',
        'Lưu trữ đám mây an toàn tại máy chủ VNPT IDC;Không lo mất dữ liệu khi bị trộm mất thẻ nhớ/camera;Tải video bằng chứng tốc độ cao;Xem lại mượt mà trên điện thoại',
        'Đăng ký Cloud',
        'TRUE',
        'Dịch Vụ Cloud',
        'FALSE'
      ]
    ]
  );

  // 4. Tab Chữ ký số
  createOrUpdateSheet(ss, SHEET_TABS.CA,
    ['package_name', 'price', 'description', 'features', 'cta_label', 'is_active', 'badge', 'highlight'],
    [
      [
        'VNPT SmartCA Cá Nhân',
        '99.000 đ/năm',
        'Chữ ký số từ xa thế hệ mới trên Smartphone không cần USB Token',
        'Ký số mọi lúc mọi nơi trên điện thoại & máy tính bảng;Tích hợp Cổng Dịch vụ công Quốc gia, Thuế TNCN, BHXH;Không cần cài đặt USB Token cồng kềnh;Chuẩn bảo mật châu Âu eIDAS và Bộ TT&TT',
        'Đăng ký cá nhân',
        'TRUE',
        'Xu Hướng 2026',
        'TRUE'
      ],
      [
        'VNPT SmartCA Cá Nhân VIP (3 Năm)',
        '249.000 đ/3 năm',
        'Giải pháp ký số từ xa dài hạn tiết kiệm 30% cho cá nhân và chuyên gia',
        'Thời hạn 3 năm không lo gián đoạn ký duyệt văn bản;Ký số hợp đồng lao động, hợp đồng mua bán điện tử;Tích hợp ứng dụng ngân hàng và chứng khoán số;Hỗ trợ kích hoạt trực tuyến trong 5 phút qua eKYC',
        'Đăng ký 3 năm',
        'TRUE',
        'Tiết Kiệm 3 Năm',
        'FALSE'
      ],
      [
        'VNPT SmartCA Doanh Nghiệp (1 Năm)',
        '1.150.000 đ/năm',
        'Chữ ký số từ xa bảo mật cao cho Giám đốc, Kế toán trưởng ký văn bản, hóa đơn',
        'Ký số Hóa đơn điện tử, Hợp đồng kinh tế, Kê khai Thuế;Phân quyền và ký duyệt đa cấp độ;Tương thích 100% phần mềm kế toán và ERP hiện nay;Cấp phát chứng thư số nhanh trong 15 phút',
        'Đăng ký doanh nghiệp',
        'TRUE',
        'Doanh Nghiệp',
        'TRUE'
      ],
      [
        'VNPT SmartCA Doanh Nghiệp (3 Năm Tiết Kiệm)',
        '2.750.000 đ/3 năm',
        'Gói cước ký số từ xa toàn diện cho doanh nghiệp, tiết kiệm chi phí tối đa',
        'Thời hạn sử dụng trọn gói 3 năm (tiết kiệm đến 700.000đ);Tặng kèm 500 số hóa đơn điện tử VNPT Invoice;Tương thích hóa đơn, thuế, bảo hiểm xã hội, hải quan;Hỗ trợ kỹ thuật VIP 24/7',
        'Đăng ký gói 3 năm',
        'TRUE',
        'Tiết Kiệm 35%',
        'FALSE'
      ],
      [
        'VNPT-CA USB Token Truyền Thống',
        '1.820.000 đ/3 năm',
        'Thiết bị Token phần cứng bảo mật vật lý cho doanh nghiệp vừa và nhỏ',
        'Thời hạn sử dụng 3 năm siêu tiết kiệm;Ký nộp tờ khai hải quan, thuế điện tử, BHXH;Bảo hành phần cứng trọn đời thiết bị USB Token;Hỗ trợ kỹ thuật từ xa qua Ultraview/Teamviewer 24/7',
        'Đăng ký Token',
        'TRUE',
        'Phần Cứng Token',
        'FALSE'
      ]
    ]
  );

  // 5. Tab Submissions
  let subSheet = ss.getSheetByName(SHEET_TABS.SUBMISSIONS);
  if (!subSheet) {
    subSheet = ss.insertSheet(SHEET_TABS.SUBMISSIONS);
    subSheet.appendRow(['Timestamp', 'Họ và tên', 'Số điện thoại', 'Gói quan tâm', 'Ghi chú', 'Trạng thái xử lý']);
    subSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#005BAA').setFontColor('#FFFFFF');
    subSheet.setFrozenRows(1);
  }
}

function createOrUpdateSheet(ss, name, headers, sampleRows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clear();
  }

  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005BAA').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  if (sampleRows && sampleRows.length > 0) {
    sampleRows.forEach(row => sheet.appendRow(row));
  }
}
