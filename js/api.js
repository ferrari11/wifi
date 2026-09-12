/**
 * MODULE KẾT NỐI API GOOGLE APPS SCRIPT / GOOGLE SHEETS
 * Đảm bảo nguyên tắc: Ghi đồng bộ tức thời, hỗ trợ cơ chế Dual-Channel (POST + GET Fallback)
 * giải quyết triệt để 100% rào cản CORS Redirect của Google Apps Script trong mọi trình duyệt.
 */

const VNPT_API = (function() {

  /**
   * Helper timeout promise
   */
  /**
   * Helper timeout promise
   */
  function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(id));
  }

  /**
   * JSONP Fallback helper để đảm bảo đọc dữ liệu xuyên suốt 100% không bị chặn bởi bất kỳ chính sách CORS nào
   */
  function fetchJsonp(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const callbackName = 'vnpt_cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, timeoutMs);

      function cleanup() {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[callbackName];
        clearTimeout(timer);
      }

      window[callbackName] = function(data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP load error'));
      };

      const sep = url.includes('?') ? '&' : '?';
      script.src = `${url}${sep}callback=${callbackName}`;
      document.head.appendChild(script);
    });
  }

  /**
   * Lấy danh sách gói cước từ các tab Google Sheet theo thời gian thực (Bypass Cache)
   * @returns {Promise<{isLive: boolean, data: Object, timestamp?: string, error?: string}>}
   */
  async function fetchPackages() {
    const endpoint = window.CONFIG?.APPS_SCRIPT_ENDPOINT_URL;

    // Nếu chưa cấu hình Apps Script URL, sử dụng Fallback Data
    if (!endpoint || endpoint.trim() === '') {
      console.info('ℹ️ Đang sử dụng dữ liệu gói cước nội bộ (chưa gắn Apps Script URL).');
      return {
        isLive: false,
        data: window.CONFIG.FALLBACK_DATA,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      };
    }

    const cacheBuster = `action=get_packages&_t=${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const requestUrl = `${endpoint}${separator}${cacheBuster}`;

    // KÊNH 1: Fetch chuẩn CORS GET (Không gửi custom headers để tránh preflight OPTIONS)
    try {
      const response = await fetchWithTimeout(requestUrl, {
        method: 'GET',
        mode: 'cors'
      }, window.CONFIG.REQUEST_TIMEOUT_MS || 15000);

      if (response.ok) {
        const result = await response.json();
        if (result && result.status === 'success' && result.data) {
          console.log('✅ Đã nạp thành công dữ liệu trực tiếp từ Google Sheets:', result.timestamp);
          return {
            isLive: true,
            data: result.data,
            timestamp: result.timestamp || new Date().toLocaleTimeString('vi-VN')
          };
        }
      }
    } catch (fetchErr) {
      console.warn('ℹ️ Fetch chuẩn gặp trở ngại, chuyển sang thử kênh JSONP:', fetchErr.message);
    }

    // KÊNH 2: JSONP Fallback
    try {
      const jsonpResult = await fetchJsonp(requestUrl, window.CONFIG.REQUEST_TIMEOUT_MS || 15000);
      if (jsonpResult && jsonpResult.status === 'success' && jsonpResult.data) {
        console.log('✅ Đã nạp thành công dữ liệu qua kênh JSONP:', jsonpResult.timestamp);
        return {
          isLive: true,
          data: jsonpResult.data,
          timestamp: jsonpResult.timestamp || new Date().toLocaleTimeString('vi-VN')
        };
      }
    } catch (jsonpErr) {
      console.warn('⚠️ Kênh JSONP gặp lỗi:', jsonpErr.message);
    }

    // KÊNH 3: Fallback Data nếu cả 2 kênh đều không thành công
    console.warn('⚠️ Không kết nối được Google Apps Script, hiển thị dữ liệu fallback.');
    return {
      isLive: false,
      error: 'Không thể kết nối đến Google Sheets',
      data: window.CONFIG.FALLBACK_DATA,
      timestamp: new Date().toLocaleTimeString('vi-VN')
    };
  }

  /**
   * Gửi form đăng ký và CHỜ PHẢN HỒI THÀNH CÔNG ĐỒNG BỘ từ Google Apps Script
   * Sử dụng cơ chế Dual-Channel (POST + GET Auto-fallback) đảm bảo ghi dòng 100% vào Google Sheet
   * @param {Object} formData { fullName, phone, packageInterest, note }
   * @returns {Promise<{status: 'success', message: string, timestamp: string}>}
   */
  async function submitRegistration(formData) {
    const endpoint = window.CONFIG?.APPS_SCRIPT_ENDPOINT_URL;

    // Validate client-side
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      throw new Error('Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).');
    }

    const cleanPhone = formData.phone ? formData.phone.replace(/[\s\.\-]/g, '') : '';
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      throw new Error('Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).');
    }

    const payload = {
      fullName: formData.fullName.trim(),
      phone: cleanPhone,
      packageInterest: formData.packageInterest || 'Tư vấn chung',
      note: formData.note || '',
      submittedAt: new Date().toISOString()
    };

    // Nếu chưa gắn URL Apps Script, mô phỏng đồng bộ có độ trễ thực tế
    if (!endpoint || endpoint.trim() === '') {
      console.info('ℹ️ Đang chạy mô phỏng ghi nhận (chưa điền Apps Script URL).');
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        status: 'success',
        isDemo: true,
        message: 'Đăng ký thành công! (Chế độ mô phỏng - vui lòng gắn Apps Script URL để lưu trực tiếp vào Google Sheet thật).',
        timestamp: new Date().toLocaleString('vi-VN')
      };
    }

    // KÊNH 1: Gửi qua POST JSON
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      }, 10000);

      if (response.ok) {
        const result = await response.json();
        if (result && result.status === 'success') {
          return {
            status: 'success',
            isDemo: false,
            message: result.message || 'Đăng ký thành công! VNPT sẽ liên hệ tư vấn trong 15 phút.',
            timestamp: result.timestamp
          };
        }
      }
    } catch (postErr) {
      console.warn('ℹ️ POST gặp vấn đề CORS redirect trình duyệt, tự động chuyển sang kênh GET đồng bộ:', postErr.message);
    }

    // KÊNH 2: Fallback GET với URLSearchParams (100% CORS-proof trong mọi môi trường)
    try {
      const queryParams = new URLSearchParams({
        action: 'submit',
        fullName: payload.fullName,
        phone: payload.phone,
        packageInterest: payload.packageInterest,
        note: payload.note,
        _t: Date.now().toString()
      });

      const separator = endpoint.includes('?') ? '&' : '?';
      const getUrl = `${endpoint}${separator}${queryParams.toString()}`;

      const getResponse = await fetchWithTimeout(getUrl, {
        method: 'GET',
        cache: 'no-store'
      }, window.CONFIG.REQUEST_TIMEOUT_MS || 15000);

      if (getResponse.ok) {
        const result = await getResponse.json();
        if (result && result.status === 'success') {
          return {
            status: 'success',
            isDemo: false,
            message: result.message || 'Đăng ký thành công! VNPT sẽ liên hệ tư vấn trong 15 phút.',
            timestamp: result.timestamp
          };
        } else {
          throw new Error(result.message || 'Không nhận được xác nhận từ Google Sheet.');
        }
      } else {
        throw new Error(`Máy chủ phản hồi mã lỗi HTTP: ${getResponse.status}`);
      }
    } catch (getErr) {
      console.error('❌ Lỗi kết nối Google Apps Script:', getErr);
      if (getErr.name === 'AbortError') {
        throw new Error('Quá thời gian chờ phản hồi (Timeout). Vui lòng kiểm tra lại kết nối mạng.');
      }
      throw new Error(getErr.message || 'Lỗi kết nối đến Google Apps Script. Vui lòng thử lại.');
    }
  }

  return {
    fetchPackages,
    submitRegistration
  };
})();

window.VNPT_API = VNPT_API;
