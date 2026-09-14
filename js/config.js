/**
 * CẤU HÌNH HỆ THỐNG VNPT LANDING PAGE
 * 
 * Để kết nối với Google Sheets của bạn:
 * 1. Triển khai Google Apps Script thành Web App (xem hướng dẫn trong README.md hoặc google-apps-script/Code.gs)
 * 2. Dán URL Web App (dạng https://script.google.com/macros/s/.../exec) vào biến APPS_SCRIPT_ENDPOINT_URL dưới đây.
 */

const CONFIG = {
  // Điền URL Apps Script Web App của bạn vào đây:
  APPS_SCRIPT_ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbz5XdSSL1ALr56rLRdpZYmp6Fdpr-xmOYrSXbDNwziOQl-sgGN3YyNqVcDqGk6bMQ2FBQ/exec",

  // Timeout khi gọi API (milliseconds)
  REQUEST_TIMEOUT_MS: 15000,

  // Cấu hình Tự Động Trượt Dọc Từng Mục Như Slider (Section Carousel Auto-Slide)
  AUTO_SCROLL: {
    ENABLED_BY_DEFAULT: true,       // Tự động trượt ngay khi mở trang mà không cần thao tác
    INITIAL_DELAY_MS: 10000,        // Thời gian chờ 30 giây ở Mục 1 Hero Banner
    SECTION_DURATION_MS: 10000,     // Thời gian chờ 30 giây ở mỗi nhóm dịch vụ sau khi trượt đến
    LAST_SECTION_DURATION_MS: 10000,// Thời gian chờ 30 giây ở form Đăng ký cuối trang trước khi trượt về đầu
    IDLE_RESUME_MS: 4000            // Tự tiếp tục trượt sau 4s khi người dùng dừng thao tác
  },

  // Dữ liệu dự phòng chuẩn nhận diện VNPT (Mỗi danh mục có 5 gói cước -> Tự động kích hoạt Slider trượt ngang mượt mà)
  FALLBACK_DATA: {
    // 1. COMBO INTERNET + TRUYỀN HÌNH "GÓI CƯỚI"
    combo_internet: [
      {
        package_name: "Home Net 1",
        price: "165.000 đ/tháng",
        description: "Gói cước Internet cáp quang tốc độ cao tiết kiệm cho gia đình trẻ",
        features: "Tốc độ 150 Mbps thả ga lướt web;Trang bị modem Wifi 5 / Wifi 6 băng tần kép;Phù hợp 3-5 thiết bị truy cập;Miễn phí lắp đặt khi trả trước 6 hoặc 12 tháng",
        feature_list: [
          "Tốc độ 150 Mbps thả ga lướt web",
          "Trang bị modem Wifi 5 / Wifi 6 băng tần kép",
          "Phù hợp 3-5 thiết bị truy cập đồng thời",
          "Miễn phí lắp đặt khi trả trước 6 hoặc 12 tháng"
        ],
        cta_label: "Đăng ký gói",
        is_active: true,
        badge: "Phổ biến",
        highlight: false
      },
      {
        package_name: "Home Combo Hạnh Phúc (Gói Cưới)",
        price: "279.000 đ/tháng",
        description: "Combo Internet + Truyền hình MyTV 4K thiết kế riêng cho hộ gia đình mới",
        features: "Internet tốc độ 250 Mbps cực nhanh;Truyền hình MyTV VIP 180+ kênh & kho phim 4K;Tặng kèm 01 thiết bị Wifi Mesh tăng phủ sóng;Tặng 30GB data VinaPhone + 1000 phút thoại/tháng;Ưu đãi tặng đến 2 tháng cước khi hòa mạng mới",
        feature_list: [
          "Internet tốc độ 250 Mbps cực nhanh",
          "Truyền hình MyTV VIP 180+ kênh & kho phim 4K",
          "Tặng kèm 01 thiết bị Wifi Mesh tăng phủ sóng",
          "Tặng 30GB data VinaPhone + 1000 phút thoại/tháng",
          "Ưu đãi tặng đến 2 tháng cước khi hòa mạng mới"
        ],
        cta_label: "Đăng ký ngay",
        is_active: true,
        badge: "Gói Cưới Khuyên Dùng",
        highlight: true
      },
      {
        package_name: "Home Sành 2",
        price: "239.000 đ/tháng",
        description: "Combo trọn gói Internet tốc độ cao và Data di động gia đình",
        features: "Tốc độ 200 Mbps không giới hạn;Tích hợp 5GB Data 4G VinaPhone mỗi ngày;Miễn phí gọi nội mạng VinaPhone;Trang bị modem cao cấp băng tần kép",
        feature_list: [
          "Tốc độ 200 Mbps không giới hạn",
          "Tích hợp 5GB Data 4G VinaPhone mỗi ngày",
          "Miễn phí gọi nội mạng VinaPhone",
          "Trang bị modem cao cấp băng tần kép"
        ],
        cta_label: "Đăng ký gói",
        is_active: true,
        badge: "Ưu đãi HOT",
        highlight: false
      },
      {
        package_name: "Home Đỉnh 2 (Gói Cưới Cao Cấp)",
        price: "319.000 đ/tháng",
        description: "Gói cước đỉnh cao cho gia đình đa thiết bị và truyền hình MyTV Nâng Cao",
        features: "Tốc độ 300 Mbps siêu mượt;Truyền hình MyTV VIP 180+ kênh & kho phim 4K;Tặng kèm 02 thiết bị Wifi Mesh thế hệ mới;Tặng 60GB Data 4G VinaPhone + 1000 phút thoại;Miễn phí modem Wifi 6 cao cấp",
        feature_list: [
          "Tốc độ 300 Mbps siêu mượt",
          "Truyền hình MyTV VIP 180+ kênh & kho phim 4K",
          "Tặng kèm 02 thiết bị Wifi Mesh thế hệ mới",
          "Tặng 60GB Data 4G VinaPhone + 1000 phút thoại",
          "Miễn phí modem Wifi 6 cao cấp"
        ],
        cta_label: "Đăng ký ngay",
        is_active: true,
        badge: "Gói Cưới VIP",
        highlight: true
      },
      {
        package_name: "Home Kết Nối 1",
        price: "195.000 đ/tháng",
        description: "Combo gia đình tiết kiệm trọn gói Internet cáp quang và truyền hình MyTV",
        features: "Tốc độ 150 Mbps ổn định;Truyền hình MyTV 150+ kênh chuẩn HD;Miễn phí modem Wifi băng tần kép;Lắp đặt nhanh chóng trong 24h",
        feature_list: [
          "Tốc độ 150 Mbps ổn định",
          "Truyền hình MyTV 150+ kênh chuẩn HD",
          "Miễn phí modem Wifi băng tần kép",
          "Lắp đặt nhanh chóng trong 24h"
        ],
        cta_label: "Đăng ký gói",
        is_active: true,
        badge: "Tiết Kiệm",
        highlight: false
      }
    ],

    // 2. SIM SỐ & GÓI CƯỚC DI ĐỘNG VINAPHONE
    sim_so: [
      {
        package_name: "Gói YOLO125V + Sim Số Đẹp",
        price: "125.000 đ/tháng",
        description: "Combo Sim số chọn lọc phong thủy kèm data giải trí tốc độ cao",
        features: "7GB Data tốc độ cao mỗi ngày (210GB/tháng);Miễn phí data xem MyTV & Youtube;Chọn sim số đẹp đầu số 091, 094, 088;Giao sim tận nhà toàn quốc",
        feature_list: [
          "7GB Data tốc độ cao mỗi ngày (210GB/tháng)",
          "Miễn phí 100% data xem MyTV & Youtube",
          "Kho sim số đẹp phong thủy, lộc phát đầu 091, 094, 088",
          "Giao sim tận nhà và hỗ trợ đăng ký chính chủ miễn phí"
        ],
        cta_label: "Chọn số & Đăng ký",
        is_active: true,
        badge: "Data Khủng",
        highlight: true
      },
      {
        package_name: "Gói VD149 Đẳng Cấp",
        price: "149.000 đ/tháng",
        description: "Gói cước thoại & data toàn diện cho khách hàng cá nhân",
        features: "4GB Data 4G tốc độ cao/ngày (120GB/tháng);Miễn phí cuộc gọi nội mạng dưới 30 phút;200 phút gọi ngoại mạng miễn phí;200 SMS nội mạng/tháng",
        feature_list: [
          "4GB Data 4G tốc độ cao/ngày (120GB/tháng)",
          "Miễn phí tất cả cuộc gọi nội mạng dưới 30 phút",
          "200 phút gọi ngoại mạng miễn phí",
          "200 tin nhắn SMS nội mạng/tháng"
        ],
        cta_label: "Đăng ký gói",
        is_active: true,
        badge: "Bán Chạy",
        highlight: false
      },
      {
        package_name: "VinaPhone Thương Gia 249",
        price: "249.000 đ/tháng",
        description: "Gói cước di động trả sau cao cấp dành cho doanh nhân và chủ hộ kinh doanh",
        features: "4GB Data tốc độ cao mỗi ngày (120GB/tháng);Miễn phí 2.500 phút gọi nội mạng VinaPhone;200 phút gọi tất cả các mạng ngoài;Chọn kho sim thần tài, lộc phát miễn phí",
        feature_list: [
          "4GB Data tốc độ cao mỗi ngày (120GB/tháng)",
          "Miễn phí 2.500 phút gọi nội mạng VinaPhone",
          "200 phút gọi tất cả các mạng ngoài",
          "Chọn kho sim thần tài, lộc phát miễn phí"
        ],
        cta_label: "Đăng ký trả sau",
        is_active: true,
        badge: "Doanh Nhân",
        highlight: true
      },
      {
        package_name: "Gói D30S Siêu Tiết Kiệm",
        price: "90.000 đ/tháng",
        description: "Gói data kèm thoại thả ga hàng tháng cho người dùng thường xuyên di chuyển",
        features: "30GB Data 4G/tháng (1GB/ngày);1.500 phút gọi nội mạng VinaPhone;30 phút gọi ngoại mạng miễn phí;Kích hoạt tức thì qua tin nhắn",
        feature_list: [
          "30GB Data 4G/tháng (1GB/ngày)",
          "1.500 phút gọi nội mạng VinaPhone",
          "30 phút gọi ngoại mạng miễn phí",
          "Kích hoạt tức thì qua tin nhắn"
        ],
        cta_label: "Đăng ký gói",
        is_active: true,
        badge: "Tiết Kiệm",
        highlight: false
      },
      {
        package_name: "Gói BIG50 Giá Rẻ",
        price: "50.000 đ/tháng",
        description: "Gói cước di động quốc dân giá rẻ cho học sinh, sinh viên, gia đình",
        features: "1.5GB Data/ngày (45GB/tháng);Truy cập ứng dụng MyTV OTT miễn phí;Đăng ký dễ dàng, kích hoạt tức thì;Không phát sinh cước vượt gói",
        feature_list: [
          "1.5GB Data 4G/ngày (45GB/tháng)",
          "Truy cập ứng dụng MyTV OTT miễn phí",
          "Đăng ký dễ dàng, kích hoạt tức thì",
          "Không phát sinh cước vượt gói"
        ],
        cta_label: "Đăng ký ngay",
        is_active: true,
        badge: "Giá Tốt Nhất",
        highlight: false
      }
    ],

    // 3. CAMERA AN NINH VNPT HOME
    camera_an_ninh: [
      {
        package_name: "Home Camera Trong Nhà 360°",
        price: "45.000 đ/tháng",
        description: "Camera xoay 360 độ chuẩn Full HD 1080p có tích hợp AI thông minh",
        features: "Góc nhìn toàn cảnh 360°, đàm thoại 2 chiều;Phát hiện chuyển động và cảnh báo người xâm nhập AI;Lưu trữ Cloud VNPT chuẩn an toàn tại Data Center Việt Nam;Bảo hành 1 đổi 1 trong 12 tháng tại nhà",
        feature_list: [
          "Góc nhìn toàn cảnh 360°, đàm thoại 2 chiều",
          "Phát hiện chuyển động và cảnh báo người xâm nhập AI",
          "Lưu trữ Cloud VNPT an toàn bảo mật tại Data Center Việt Nam",
          "Bảo hành 1 đổi 1 trong 12 tháng tại nhà"
        ],
        cta_label: "Đặt lắp đặt",
        is_active: true,
        badge: "Gia Đình Yêu Thích",
        highlight: false
      },
      {
        package_name: "Combo 2 Camera + Lưu Trữ Cloud 7 Ngày",
        price: "90.000 đ/tháng",
        description: "Giải pháp bảo vệ toàn diện sân vườn, cổng nhà và phòng khách gia đình",
        features: "Gồm 01 Camera ngoài trời chống nước IP66 + 01 Camera trong nhà;Lưu trữ Cloud xem lại 7 ngày gần nhất;Hình ảnh hồng ngoại sắc nét ban đêm;Miễn phí nhân công lắp đặt & hỗ trợ kỹ thuật 24/7",
        feature_list: [
          "Gồm 01 Camera ngoài trời IP66 + 01 Camera 360 trong nhà",
          "Lưu trữ Cloud xem lại video 7 ngày liên tục",
          "Hình ảnh hồng ngoại sắc nét ban đêm có màu",
          "Miễn phí nhân công lắp đặt & hỗ trợ kỹ thuật 24/7"
        ],
        cta_label: "Đăng ký trọn gói",
        is_active: true,
        badge: "Khuyên Dùng",
        highlight: true
      },
      {
        package_name: "Combo 3 Camera Biệt Thự + Cloud 30 Ngày",
        price: "155.000 đ/tháng",
        description: "Giải pháp giám sát cao cấp cho nhà vườn, biệt thự và chuỗi cửa hàng",
        features: "Gồm 02 Camera ngoài trời IP66 + 01 Camera 360 trong nhà;Lưu trữ Cloud xem lại trọn vẹn 30 ngày;AI phát hiện vượt hàng rào ảo và hú còi báo động;Hỗ trợ kỹ thuật ưu tiên 24/7",
        feature_list: [
          "Gồm 02 Camera ngoài trời IP66 + 01 Camera 360 trong nhà",
          "Lưu trữ Cloud xem lại trọn vẹn 30 ngày",
          "AI phát hiện vượt hàng rào ảo và hú còi báo động",
          "Hỗ trợ kỹ thuật ưu tiên 24/7 tại nhà"
        ],
        cta_label: "Đăng ký VIP",
        is_active: true,
        badge: "Gói Biệt Thự",
        highlight: true
      },
      {
        package_name: "Home Camera Ngoài Trời IP66",
        price: "55.000 đ/tháng",
        description: "Camera ngoài trời kháng nước kháng bụi, giám sát ngày đêm",
        features: "Tiêu chuẩn chống nước IP66 chịu mưa nắng;Đèn rọi Spotlight quan sát có màu ban đêm;Cảnh báo còi hú khi phát hiện đột nhập;Quản lý dễ dàng trên ứng dụng VNPT OneHome",
        feature_list: [
          "Tiêu chuẩn chống nước IP66 bền bỉ dưới mọi thời tiết",
          "Đèn rọi Spotlight quan sát có màu ban đêm",
          "Cảnh báo còi hú khi phát hiện đột nhập",
          "Quản lý dễ dàng trên ứng dụng VNPT OneHome"
        ],
        cta_label: "Đặt lắp đặt",
        is_active: true,
        badge: "Bền Bỉ",
        highlight: false
      },
      {
        package_name: "Gói Cloud Camera Nâng Cao 14 Ngày",
        price: "35.000 đ/tháng",
        description: "Gói cước lưu trữ đám mây xem lại video 14 ngày cho khách hàng đã có thiết bị",
        features: "Lưu trữ đám mây an toàn tại máy chủ VNPT IDC;Không lo mất dữ liệu khi bị trộm mất thẻ nhớ/camera;Tải video bằng chứng tốc độ cao;Xem lại mượt mà trên điện thoại",
        feature_list: [
          "Lưu trữ đám mây an toàn tại máy chủ VNPT IDC",
          "Không lo mất dữ liệu khi bị trộm mất thẻ nhớ/camera",
          "Tải video bằng chứng tốc độ cao",
          "Xem lại mượt mà trên điện thoại"
        ],
        cta_label: "Đăng ký Cloud",
        is_active: true,
        badge: "Dịch Vụ Cloud",
        highlight: false
      }
    ],

    // 4. CHỮ KÝ SỐ (VNPT SMARTCA / VNPT-CA)
    chu_ky_so: [
      {
        package_name: "VNPT SmartCA Cá Nhân",
        price: "99.000 đ/năm",
        description: "Chữ ký số từ xa thế hệ mới trên Smartphone không cần USB Token",
        features: "Ký số mọi lúc mọi nơi trên điện thoại & máy tính bảng;Tích hợp Cổng Dịch vụ công Quốc gia, Thuế TNCN, BHXH;Không cần cài đặt USB Token cồng kềnh;Chuẩn bảo mật châu Âu eIDAS và Bộ TT&TT",
        feature_list: [
          "Ký số mọi lúc mọi nơi trên điện thoại & máy tính bảng",
          "Tích hợp Cổng Dịch vụ công Quốc gia, Thuế TNCN, BHXH",
          "Không cần cài đặt USB Token cồng kềnh",
          "Chuẩn bảo mật châu Âu eIDAS và Bộ TT&TT"
        ],
        cta_label: "Đăng ký cá nhân",
        is_active: true,
        badge: "Xu Hướng 2026",
        highlight: true
      },
      {
        package_name: "VNPT SmartCA Cá Nhân VIP (3 Năm)",
        price: "249.000 đ/3 năm",
        description: "Giải pháp ký số từ xa dài hạn tiết kiệm 30% cho cá nhân và chuyên gia",
        features: "Thời hạn 3 năm không lo gián đoạn ký duyệt văn bản;Ký số hợp đồng lao động, hợp đồng mua bán điện tử;Tích hợp ứng dụng ngân hàng và chứng khoán số;Hỗ trợ kích hoạt trực tuyến trong 5 phút qua eKYC",
        feature_list: [
          "Thời hạn 3 năm không lo gián đoạn ký duyệt văn bản",
          "Ký số hợp đồng lao động, hợp đồng mua bán điện tử",
          "Tích hợp ứng dụng ngân hàng và chứng khoán số",
          "Hỗ trợ kích hoạt trực tuyến trong 5 phút qua eKYC"
        ],
        cta_label: "Đăng ký 3 năm",
        is_active: true,
        badge: "Tiết Kiệm 3 Năm",
        highlight: false
      },
      {
        package_name: "VNPT SmartCA Doanh Nghiệp (1 Năm)",
        price: "1.150.000 đ/năm",
        description: "Chữ ký số từ xa bảo mật cao cho Giám đốc, Kế toán trưởng ký văn bản, hóa đơn",
        features: "Ký số Hóa đơn điện tử, Hợp đồng kinh tế, Kê khai Thuế;Phân quyền và ký duyệt đa cấp độ;Tương thích 100% phần mềm kế toán và ERP hiện nay;Cấp phát chứng thư số nhanh trong 15 phút",
        feature_list: [
          "Ký số Hóa đơn điện tử, Hợp đồng kinh tế, Kê khai Thuế",
          "Phân quyền và ký duyệt đa cấp độ",
          "Tương thích 100% phần mềm kế toán và ERP hiện nay",
          "Cấp phát chứng thư số nhanh chóng trong 15 phút"
        ],
        cta_label: "Đăng ký doanh nghiệp",
        is_active: true,
        badge: "Doanh Nghiệp",
        highlight: true
      },
      {
        package_name: "VNPT SmartCA Doanh Nghiệp (3 Năm Tiết Kiệm)",
        price: "2.750.000 đ/3 năm",
        description: "Gói cước ký số từ xa toàn diện cho doanh nghiệp, tiết kiệm chi phí tối đa",
        features: "Thời hạn sử dụng trọn gói 3 năm (tiết kiệm đến 700.000đ);Tặng kèm 500 số hóa đơn điện tử VNPT Invoice;Tương thích hóa đơn, thuế, bảo hiểm xã hội, hải quan;Hỗ trợ kỹ thuật VIP 24/7",
        feature_list: [
          "Thời hạn sử dụng trọn gói 3 năm (tiết kiệm đến 700.000đ)",
          "Tặng kèm 500 số hóa đơn điện tử VNPT Invoice",
          "Tương thích hóa đơn, thuế, bảo hiểm xã hội, hải quan",
          "Hỗ trợ kỹ thuật VIP 24/7"
        ],
        cta_label: "Đăng ký gói 3 năm",
        is_active: true,
        badge: "Tiết Kiệm 35%",
        highlight: false
      },
      {
        package_name: "VNPT-CA USB Token Truyền Thống",
        price: "1.820.000 đ/3 năm",
        description: "Thiết bị Token phần cứng bảo mật vật lý cho doanh nghiệp vừa và nhỏ",
        features: "Thời hạn sử dụng 3 năm siêu tiết kiệm;Ký nộp tờ khai hải quan, thuế điện tử, BHXH;Bảo hành phần cứng trọn đời thiết bị USB Token;Hỗ trợ kỹ thuật từ xa qua Ultraview/Teamviewer 24/7",
        feature_list: [
          "Thời hạn sử dụng 3 năm siêu tiết kiệm",
          "Ký nộp tờ khai hải quan, thuế điện tử, BHXH",
          "Bảo hành phần cứng trọn đời thiết bị USB Token",
          "Hỗ trợ kỹ thuật từ xa qua Ultraview/Teamviewer 24/7"
        ],
        cta_label: "Đăng ký Token",
        is_active: true,
        badge: "Phần Cứng Token",
        highlight: false
      }
    ],

    // 5. HÓA ĐƠN ĐIỆN TỬ (VNPT-INVOICE & MÁY TÍNH TIỀN)
    hoa_don_dien_tu: [
      {
        package_name: "VNPT-Invoice 300 HĐ (Hộ Kinh Doanh)",
        price: "300.000 đ",
        description: "Gói cước hóa đơn điện tử cơ bản cho Hộ kinh doanh cá thể mới thành lập",
        features: "Số lượng 300 số hóa đơn điện tử;Hợp chuẩn Thông tư 78 và Nghị định 123;Tặng mẫu hóa đơn tiêu chuẩn;Lưu trữ an toàn 10 năm tại VNPT IDC",
        feature_list: [
          "Số lượng 300 số hóa đơn điện tử (1.000đ/HĐ)",
          "Hợp chuẩn 100% Thông tư 78 và Nghị định 123/2020/NĐ-CP",
          "Miễn phí thiết kế mẫu hóa đơn theo nhận diện",
          "Lưu trữ dữ liệu an toàn bảo mật 10 năm tại VNPT IDC"
        ],
        cta_label: "Đăng ký gói 300 HĐ",
        is_active: true,
        badge: "Hộ Kinh Doanh",
        highlight: false
      },
      {
        package_name: "VNPT-Invoice 500 HĐ",
        price: "450.000 đ",
        description: "Gói cước phổ biến cho Hộ kinh doanh & Doanh nghiệp vừa và nhỏ",
        features: "Số lượng 500 số hóa đơn điện tử;Hỗ trợ ký số qua SmartCA hoặc USB Token;Tự động truyền nhận dữ liệu cơ quan Thuế;Tra cứu hóa đơn 24/7 trực tuyến",
        feature_list: [
          "Số lượng 500 số hóa đơn điện tử (900đ/HĐ)",
          "Hỗ trợ ký số qua SmartCA hoặc USB Token",
          "Tự động truyền nhận dữ liệu trực tiếp với Tổng cục Thuế",
          "Cổng tra cứu hóa đơn trực tuyến 24/7 cho khách mua"
        ],
        cta_label: "Đăng ký gói 500 HĐ",
        is_active: true,
        badge: "Bán Chạy",
        highlight: false
      },
      {
        package_name: "VNPT-Invoice 1.000 HĐ (Khuyên Dùng)",
        price: "750.000 đ",
        description: "Giải pháp hóa đơn điện tử toàn diện cho Doanh nghiệp & Chuỗi bán lẻ",
        features: "Số lượng 1.000 số hóa đơn điện tử;Tích hợp HĐĐT khởi tạo từ Máy tính tiền (POS);Tương thích phần mềm kế toán MISA, Fast, Bravo...;Hỗ trợ thủ tục nộp tờ khai Mẫu 01 lên Cơ quan Thuế",
        feature_list: [
          "Số lượng 1.000 số hóa đơn điện tử (750đ/HĐ)",
          "Tích hợp HĐĐT khởi tạo từ Máy tính tiền (POS)",
          "Tương thích 100% phần mềm kế toán MISA, Fast, Bravo...",
          "Hỗ trợ trọn gói nộp tờ khai Mẫu 01/ĐKTĐ-HĐĐT lên Thuế"
        ],
        cta_label: "Đăng ký ngay",
        is_active: true,
        badge: "Khuyên Dùng",
        highlight: true
      },
      {
        package_name: "VNPT-Invoice 2.000 HĐ + Máy Tính Tiền",
        price: "1.300.000 đ",
        description: "Tối ưu cho nhà hàng, quán cafe, siêu thị mini, bán lẻ & dịch vụ",
        features: "Số lượng 2.000 số hóa đơn điện tử;Xuất hóa đơn tức thời tại quầy thu ngân;Quản lý doanh thu, báo cáo thuế realtime;Hỗ trợ kỹ thuật chuyên biệt 24/7",
        feature_list: [
          "Số lượng 2.000 số hóa đơn điện tử (650đ/HĐ)",
          "Xuất hóa đơn tức thời tại quầy thu ngân theo ca",
          "Quản lý doanh thu, báo cáo thuế realtime minh bạch",
          "Hỗ trợ kỹ thuật ưu tiên 24/7 từ chuyên viên VNPT"
        ],
        cta_label: "Đăng ký POS",
        is_active: true,
        badge: "POS Máy Tính Tiền",
        highlight: true
      },
      {
        package_name: "VNPT-Invoice 5.000 HĐ (Doanh Nghiệp)",
        price: "2.650.000 đ",
        description: "Gói cước dung lượng lớn tiết kiệm tối đa cho Doanh nghiệp xuất hóa đơn thường xuyên",
        features: "Số lượng 5.000 số hóa đơn điện tử;Không giới hạn số lượng người dùng tạo lập HĐ;Mở API tích hợp hệ thống ERP, CRM doanh nghiệp;Phân quyền ký duyệt đa cấp độ",
        feature_list: [
          "Số lượng 5.000 số hóa đơn điện tử (siêu rẻ 530đ/HĐ)",
          "Không giới hạn số lượng tài khoản phân quyền tạo lập HĐ",
          "Cung cấp Web Service API kết nối ERP, SAP, CRM",
          "Phân quyền ký duyệt đa cấp độ (Kế toán -> Giám đốc)"
        ],
        cta_label: "Đăng ký Doanh Nghiệp",
        is_active: true,
        badge: "Tiết Kiệm 50%",
        highlight: false
      }
    ]
  }
};

window.CONFIG = CONFIG;
