/**
 * VNPT LANDING PAGE - MAIN APPLICATION LOGIC
 * Quản lý hiển thị động 4 nhóm gói cước, Slider tự động trượt ngang khi có > 3 gói,
 * Tự động đồng bộ thời gian thực từ Google Sheets (Real-time Live Sync & Background Polling).
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  elements: {
    // 4 Grids / Containers sản phẩm
    comboGrid: document.getElementById('combo-internet-grid'),
    simGrid: document.getElementById('sim-so-grid'),
    cameraGrid: document.getElementById('camera-an-ninh-grid'),
    caGrid: document.getElementById('chu-ky-so-grid'),

    // Forms
    mainForm: document.getElementById('main-register-form'),
    heroForm: document.getElementById('hero-quick-form'),
    packageSelect: document.getElementById('package-select'),
    heroPackageSelect: document.getElementById('hero-package-select'),

    // Form Alert containers
    formAlertSuccess: document.getElementById('form-alert-success'),
    formAlertError: document.getElementById('form-alert-error'),
    formErrorMessage: document.getElementById('form-error-message'),
    formSubmitBtn: document.getElementById('btn-submit-main'),

    // Mobile nav
    mobileToggle: document.getElementById('mobile-menu-toggle'),
    mainNav: document.getElementById('main-nav'),
    navLinks: document.querySelectorAll('.nav-link'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  },

  state: {
    packages: {
      combo_internet: [],
      sim_so: [],
      camera_an_ninh: [],
      chu_ky_so: []
    },
    allActivePackagesList: [],
    isSubmitting: false,
    isLoadingPackages: false,
    lastSyncTime: null,
    activeSliders: {} // Lưu các timer và state của slider từng category
  },

  async init() {
    this.bindEvents();
    // Tải dữ liệu mới nhất từ Google Sheets ngay khi tải trang (F5 hoặc mở trình duyệt)
    await this.loadPackages(false);

    // Xử lý resize để điều chỉnh slider mượt mà
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        Object.values(this.state.activeSliders).forEach(slider => {
          if (slider && typeof slider.updateDimensions === 'function') {
            slider.updateDimensions();
          }
        });
      }, 150);
    });
  },

  bindEvents() {
    // Mobile navigation toggle
    if (this.elements.mobileToggle && this.elements.mainNav) {
      this.elements.mobileToggle.addEventListener('click', () => {
        this.elements.mainNav.classList.toggle('show');
      });
    }

    // Đóng mobile nav khi bấm link
    this.elements.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.elements.mainNav) {
          this.elements.mainNav.classList.remove('show');
        }
      });
    });

    // Form đăng ký chính
    if (this.elements.mainForm) {
      this.elements.mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(this.elements.mainForm);
      });
    }

    // Quick form trên Hero Banner
    if (this.elements.heroForm) {
      this.elements.heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(this.elements.heroForm);
      });
    }

    // Xóa cảnh báo lỗi khi người dùng sửa input
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const hint = input.parentElement.querySelector('.form-hint.error');
        if (hint) hint.textContent = '';
      });
    });
  },

  /**
   * Tải dữ liệu gói cước từ Google Apps Script / Google Sheets
   * @param {boolean} isSilent Nếu true, không hiện skeleton mà cập nhật ngầm mượt mà
   */
  async loadPackages(isSilent = false) {
    if (this.state.isLoadingPackages) return;
    this.state.isLoadingPackages = true;

    try {
      if (!isSilent) {
        this.renderSkeletons();
      }

      const result = await window.VNPT_API.fetchPackages();
      
      if (result && result.data) {
        this.state.packages = result.data;
        this.state.allActivePackagesList = [];
        this.state.lastSyncTime = Date.now();

        // Gom danh sách toàn bộ gói cước để đổ vào dropdown
        ['combo_internet', 'sim_so', 'camera_an_ninh', 'chu_ky_so'].forEach(key => {
          if (Array.isArray(this.state.packages[key])) {
            this.state.packages[key].forEach(pkg => {
              if (pkg.package_name) {
                this.state.allActivePackagesList.push(pkg.package_name);
              }
            });
          }
        });

        // Render 4 danh mục (Tự động kích hoạt Slider nếu có > 3 gói)
        this.renderCategorySection(this.elements.comboGrid, this.state.packages.combo_internet, 'combo');
        this.renderCategorySection(this.elements.simGrid, this.state.packages.sim_so, 'sim');
        this.renderCategorySection(this.elements.cameraGrid, this.state.packages.camera_an_ninh, 'camera');
        this.renderCategorySection(this.elements.caGrid, this.state.packages.chu_ky_so, 'ca');

        // Populate dropdown
        this.populatePackageSelects();
      }
    } catch (err) {
      console.error('Lỗi khi tải gói cước:', err);
      if (!isSilent) {
        this.showToast('Không thể kết nối đến dữ liệu Google Sheets', 'error');
      }
    } finally {
      this.state.isLoadingPackages = false;
    }
  },

  renderSkeletons() {
    const skeletonHtml = Array(3).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-line" style="width: 40%; height: 24px;"></div>
        <div class="skeleton-line" style="width: 80%; height: 16px; margin-top: 10px;"></div>
        <div class="skeleton-line" style="width: 60%; height: 28px; margin: 20px 0;"></div>
        <div class="skeleton-line" style="width: 95%; height: 14px;"></div>
        <div class="skeleton-line" style="width: 90%; height: 14px;"></div>
        <div class="skeleton-line" style="width: 85%; height: 14px;"></div>
        <div class="skeleton-line" style="width: 100%; height: 44px; margin-top: 24px; border-radius: 8px;"></div>
      </div>
    `).join('');

    if (this.elements.comboGrid) this.elements.comboGrid.innerHTML = skeletonHtml;
    if (this.elements.simGrid) this.elements.simGrid.innerHTML = skeletonHtml;
    if (this.elements.cameraGrid) this.elements.cameraGrid.innerHTML = skeletonHtml;
    if (this.elements.caGrid) this.elements.caGrid.innerHTML = skeletonHtml;
  },

  /**
   * Tạo HTML cho 1 thẻ gói cước
   */
  generateCardHtml(pkg) {
    const isHighlight = pkg.highlight === true || String(pkg.highlight).toLowerCase() === 'true';
    const badgeText = pkg.badge || (isHighlight ? 'Khuyên dùng' : '');
    const features = pkg.feature_list && pkg.feature_list.length > 0 
      ? pkg.feature_list 
      : (typeof pkg.features === 'string' ? pkg.features.split(';').filter(Boolean) : []);

    const featuresHtml = features.map(feat => `
      <li class="card-feature-item">
        <svg class="feature-check-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>${this.escapeHtml(feat.trim())}</span>
      </li>
    `).join('');

    const safePackageName = this.escapeHtml(pkg.package_name);

    return `
      <div class="package-card ${isHighlight ? 'highlighted' : ''}" id="card-${this.slugify(pkg.package_name)}">
        ${badgeText ? `<div class="card-badge-top"><span class="badge ${isHighlight ? 'badge-hot' : 'badge-vnpt'}">${this.escapeHtml(badgeText)}</span></div>` : ''}
        
        <div class="card-header">
          <h3 class="card-name">${safePackageName}</h3>
          <p class="card-desc">${this.escapeHtml(pkg.description || '')}</p>
          <div class="card-price-box">
            <span class="card-price">${this.escapeHtml(pkg.price || 'Liên hệ')}</span>
          </div>
        </div>

        <ul class="card-features">
          ${featuresHtml}
        </ul>

        <div class="card-footer">
          <button type="button" 
                  class="btn ${isHighlight ? 'btn-primary' : 'btn-secondary'} btn-block select-package-btn"
                  data-package="${safePackageName}">
            ${this.escapeHtml(pkg.cta_label || 'Đăng ký ngay')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Render danh mục: Nếu > 3 gói cước -> Tạo Slider tự động trượt ngang
   */
  renderCategorySection(container, items, categoryKey) {
    if (!container) return;

    // Hủy slider cũ nếu đang chạy
    if (this.state.activeSliders[categoryKey]) {
      this.state.activeSliders[categoryKey].destroy();
      delete this.state.activeSliders[categoryKey];
    }

    if (!items || items.length === 0) {
      container.className = 'packages-grid';
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: #FFFFFF; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <svg style="margin: 0 auto 12px auto; width: 40px; height: 40px; color: var(--text-light);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 12V8H4v12h16v-4"/>
            <path d="M4 8l8-4 8 4"/>
          </svg>
          <p style="font-weight: 500;">Chưa có gói cước nào trong danh mục này trên Google Sheets.</p>
          <small style="color: var(--text-light);">Thêm dòng mới vào Google Sheet và dữ liệu sẽ tự động xuất hiện tại đây.</small>
        </div>
      `;
      return;
    }

    const cardsHtml = items.map(pkg => this.generateCardHtml(pkg)).join('');

    // NẾU CÓ NHIỀU HƠN 3 GÓI CƯỚC -> TẠO SLIDER TRƯỢT NGANG TỰ ĐỘNG
    if (items.length > 3) {
      container.className = 'slider-section-container';
      container.innerHTML = `
        <div class="slider-wrapper" id="slider-wrap-${categoryKey}">
          <button type="button" class="slider-btn slider-prev" aria-label="Gói cước trước">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div class="slider-container">
            <div class="slider-track" id="slider-track-${categoryKey}">
              ${cardsHtml}
            </div>
          </div>

          <button type="button" class="slider-btn slider-next" aria-label="Gói cước tiếp theo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div class="slider-dots" id="slider-dots-${categoryKey}"></div>
        </div>
      `;

      // Khởi tạo logic slider
      this.initSlider(categoryKey, items.length);

    } else {
      // DƯỚI HOẶC BẰNG 3 GÓI -> HIỂN THỊ GRID BÌNH THƯỜNG
      container.className = 'packages-grid';
      container.innerHTML = cardsHtml;
    }

    // Gắn sự kiện click cho các nút Đăng ký trên từng Card
    container.querySelectorAll('.select-package-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const packageName = e.currentTarget.getAttribute('data-package');
        this.selectPackageAndScrollToForm(packageName);
      });
    });
  },

  /**
   * Logic khởi tạo Slider: Tự động trượt ngang, Prev/Next, Dots, Pause on Hover, Touch Swipe
   */
  initSlider(categoryKey, totalItems) {
    const wrapper = document.getElementById(`slider-wrap-${categoryKey}`);
    const track = document.getElementById(`slider-track-${categoryKey}`);
    const dotsContainer = document.getElementById(`slider-dots-${categoryKey}`);
    const btnPrev = wrapper?.querySelector('.slider-prev');
    const btnNext = wrapper?.querySelector('.slider-next');

    if (!wrapper || !track || !dotsContainer) return;

    let currentIndex = 0;
    let autoTimer = null;
    let touchStartX = 0;
    let touchEndX = 0;

    const getItemsPerView = () => {
      const width = window.innerWidth;
      if (width <= 768) return 1;
      if (width <= 1024) return 2;
      return 3;
    };

    const getMaxIndex = () => {
      const itemsPerView = getItemsPerView();
      return Math.max(0, totalItems - itemsPerView);
    };

    const renderDots = () => {
      const maxIndex = getMaxIndex();
      let dotsHtml = '';
      for (let i = 0; i <= maxIndex; i++) {
        dotsHtml += `<button type="button" class="slider-dot ${i === currentIndex ? 'active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>`;
      }
      dotsContainer.innerHTML = dotsHtml;

      dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          goToSlide(idx);
          restartTimer();
        });
      });
    };

    const goToSlide = (index) => {
      const maxIndex = getMaxIndex();
      if (index < 0) {
        currentIndex = maxIndex;
      } else if (index > maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex = index;
      }

      const firstCard = track.querySelector('.package-card');
      if (firstCard) {
        const cardWidth = firstCard.getBoundingClientRect().width;
        const gap = 28;
        const offset = currentIndex * (cardWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;
      }

      // Cập nhật active dot
      dotsContainer.querySelectorAll('.slider-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    };

    const startTimer = () => {
      stopTimer();
      autoTimer = setInterval(() => {
        const maxIndex = getMaxIndex();
        const nextIndex = (currentIndex >= maxIndex) ? 0 : currentIndex + 1;
        goToSlide(nextIndex);
      }, 3800);
    };

    const stopTimer = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    const restartTimer = () => {
      stopTimer();
      startTimer();
    };

    // Nút Next & Prev
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        restartTimer();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        restartTimer();
      });
    }

    // Tạm dừng khi rê chuột vào slider
    wrapper.addEventListener('mouseenter', stopTimer);
    wrapper.addEventListener('mouseleave', startTimer);

    // Hỗ trợ Touch Swipe vuốt trên điện thoại
    wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      stopTimer();
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const diffX = touchStartX - touchEndX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          goToSlide(currentIndex + 1);
        } else {
          goToSlide(currentIndex - 1);
        }
      }
      startTimer();
    }, { passive: true });

    // Khởi tạo
    renderDots();
    goToSlide(0);
    startTimer();

    // Lưu instance
    this.state.activeSliders[categoryKey] = {
      destroy: () => {
        stopTimer();
      },
      updateDimensions: () => {
        renderDots();
        goToSlide(Math.min(currentIndex, getMaxIndex()));
      }
    };
  },

  populatePackageSelects() {
    const currentMainVal = this.elements.packageSelect ? this.elements.packageSelect.value : '';
    const currentHeroVal = this.elements.heroPackageSelect ? this.elements.heroPackageSelect.value : '';

    const optionsHtml = `
      <option value="">-- Chọn gói cước bạn quan tâm --</option>
      ${this.state.allActivePackagesList.map(name => `
        <option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>
      `).join('')}
    `;

    if (this.elements.packageSelect) {
      this.elements.packageSelect.innerHTML = optionsHtml;
      if (currentMainVal) this.elements.packageSelect.value = currentMainVal;
    }
    if (this.elements.heroPackageSelect) {
      this.elements.heroPackageSelect.innerHTML = optionsHtml;
      if (currentHeroVal) this.elements.heroPackageSelect.value = currentHeroVal;
    }
  },

  selectPackageAndScrollToForm(packageName) {
    if (this.elements.packageSelect) {
      this.elements.packageSelect.value = packageName;
    }

    const formSection = document.getElementById('dang-ky');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
      
      // Focus vào ô họ tên
      const nameInput = document.getElementById('fullname');
      if (nameInput) {
        setTimeout(() => {
          nameInput.focus();
        }, 500);
      }
    }

    this.showToast(`Đã chọn gói: ${packageName}. Vui lòng hoàn tất thông tin đăng ký.`, 'info');
  },

  /**
   * Xử lý gửi Form ĐĂNG KÝ VÀ CHỜ PHẢN HỒI THÀNH CÔNG ĐỒNG BỘ
   */
  async handleFormSubmit(form) {
    if (this.state.isSubmitting) return;

    const nameInput = form.querySelector('[name="fullname"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const packageInput = form.querySelector('[name="package_interest"]');
    const noteInput = form.querySelector('[name="note"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    const fullName = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const packageInterest = packageInput ? packageInput.value : '';
    const note = noteInput ? noteInput.value.trim() : '';

    // Validate Họ tên
    let hasError = false;
    if (!fullName || fullName.length < 2) {
      this.setInputError(nameInput, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).');
      hasError = true;
    } else {
      this.clearInputError(nameInput);
    }

    // Validate Số điện thoại (chuẩn 10 số đầu 0 của VN)
    const cleanPhone = phone.replace(/[\s\.\-]/g, '');
    const vnPhoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    if (!cleanPhone || !vnPhoneRegex.test(cleanPhone)) {
      this.setInputError(phoneInput, 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09).');
      hasError = true;
    } else {
      this.clearInputError(phoneInput);
    }

    if (hasError) {
      this.showToast('Vui lòng kiểm tra lại các thông tin chưa hợp lệ.', 'error');
      return;
    }

    // Bắt đầu trạng thái gửi
    this.state.isSubmitting = true;
    this.setSubmitButtonLoading(submitBtn, true);
    this.hideAlerts();

    try {
      // GỌI API ĐỒNG BỘ VÀ CHỜ PHẢN HỒI TỪ APPS SCRIPT
      const response = await window.VNPT_API.submitRegistration({
        fullName,
        phone: cleanPhone,
        packageInterest: packageInterest || 'Tư vấn tổng quát',
        note
      });

      // XÁC NHẬN PHẢN HỒI THÀNH CÔNG THỰC TẾ
      if (response && response.status === 'success') {
        this.showAlertSuccess(response.message || 'Đăng ký thành công! VNPT sẽ liên hệ tư vấn trong 15 phút.');
        this.showToast('🎉 Đăng ký thành công! Đã ghi nhận thông tin vào hệ thống.', 'success');

        // Reset form sau khi chắc chắn ghi thành công
        form.reset();
      } else {
        throw new Error(response.message || 'Không nhận được xác nhận từ hệ thống.');
      }

    } catch (err) {
      console.error('❌ Lỗi submit form:', err);
      
      // Hiển thị thông báo lỗi rõ ràng, GIỮ NGUYÊN DỮ LIỆU ĐÃ NHẬP
      const errorMsg = err.message || 'Gửi đăng ký không thành công do sự cố mạng hoặc máy chủ. Vui lòng bấm thử lại.';
      this.showAlertError(errorMsg);
      this.showToast(`Lỗi: ${errorMsg}`, 'error');

    } finally {
      this.state.isSubmitting = false;
      this.setSubmitButtonLoading(submitBtn, false);
    }
  },

  setInputError(input, message) {
    if (!input) return;
    input.classList.add('is-invalid');
    const hint = input.parentElement.querySelector('.form-hint');
    if (hint) {
      hint.classList.add('error');
      hint.textContent = message;
    }
  },

  clearInputError(input) {
    if (!input) return;
    input.classList.remove('is-invalid');
    const hint = input.parentElement.querySelector('.form-hint');
    if (hint) {
      hint.classList.remove('error');
      hint.textContent = '';
    }
  },

  setSubmitButtonLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `
        <span class="spinner"></span>
        <span>Đang ghi nhận vào Google Sheet...</span>
      `;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
      }
    }
  },

  hideAlerts() {
    if (this.elements.formAlertSuccess) this.elements.formAlertSuccess.classList.remove('show');
    if (this.elements.formAlertError) this.elements.formAlertError.classList.remove('show');
  },

  showAlertSuccess(message) {
    if (this.elements.formAlertSuccess) {
      const msgEl = this.elements.formAlertSuccess.querySelector('.alert-text');
      if (msgEl) msgEl.textContent = message;
      this.elements.formAlertSuccess.classList.add('show');
    }
  },

  showAlertError(message) {
    if (this.elements.formAlertError) {
      if (this.elements.formErrorMessage) {
        this.elements.formErrorMessage.textContent = message;
      }
      this.elements.formAlertError.classList.add('show');
    }
  },

  showToast(message, type = 'info') {
    if (!this.elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let title = 'Thông báo VNPT';
    if (type === 'success') title = 'Thành công';
    if (type === 'error') title = 'Thông báo lỗi';

    toast.innerHTML = `
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;

    this.elements.toastContainer.appendChild(toast);

    // Animation in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Tự động ẩn sau 4 giây
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 4000);
  },

  escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
};
