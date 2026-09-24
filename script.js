/**
 * HIGH-CONVERTING LANDING PAGE JAVASCRIPT
 * Features:
 * 1. Rolling Urgency Countdown Timer with localStorage persistence
 * 2. Interactive Booking / Strategy Call Modal & Lead Form Validation
 * 3. Animated Key Metric Number Counters (Intersection Observer)
 * 4. Smooth FAQ Accordion with accessible aria-expanded attributes
 * 5. Dynamic Sticky Bottom CTA Bar on scroll
 * 6. Interactive Video Modal preview
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdownTimer();
  initAnimatedCounters();
  initFaqAccordion();
  initBookingModal();
  initStickyBottomBar();
  initVideoPlayer();
});

/* ==========================================================================
   1. URGENCY COUNTDOWN TIMER
   ========================================================================== */
function initCountdownTimer() {
  const timerDisplays = document.querySelectorAll('.timer-display');
  if (!timerDisplays.length) return;

  const STORAGE_KEY = 'launchpad_timer_target';
  const DEFAULT_DURATION_MS = 14 * 60 * 1000 + 45 * 1000; // 14 mins 45 secs

  let targetTime = localStorage.getItem(STORAGE_KEY);
  const now = Date.now();

  if (!targetTime || parseInt(targetTime, 10) <= now) {
    targetTime = now + DEFAULT_DURATION_MS;
    localStorage.setItem(STORAGE_KEY, targetTime);
  } else {
    targetTime = parseInt(targetTime, 10);
  }

  function updateTimer() {
    const current = Date.now();
    let remaining = targetTime - current;

    if (remaining <= 0) {
      // Reset timer to another 15 minutes cycle
      targetTime = Date.now() + DEFAULT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY, targetTime);
      remaining = DEFAULT_DURATION_MS;
    }

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    timerDisplays.forEach(el => {
      el.textContent = formatted;
    });
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   2. ANIMATED KEY METRIC COUNTERS
   ========================================================================== */
function initAnimatedCounters() {
  const counterElements = document.querySelectorAll('.stat-number[data-target]');
  if (!counterElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateValue(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  counterElements.forEach(el => observer.observe(el));

  function animateValue(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const isDecimal = target % 1 !== 0;
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = isDecimal 
        ? (easeProgress * target).toFixed(1) 
        : Math.floor(easeProgress * target);

      el.textContent = `${prefix}${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${target}${suffix}`;
      }
    }

    requestAnimationFrame(update);
  }
}

/* ==========================================================================
   3. INTERACTIVE FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item, index) => {
    const btn = item.querySelector('.faq-question-btn');
    const panel = item.querySelector('.faq-answer-panel');

    // Open first item by default
    if (index === 0) {
      item.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
          otherItem.querySelector('.faq-answer-panel').style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   4. BOOKING / STRATEGY CALL MODAL & FORM
   ========================================================================== */
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const bookingForm = document.getElementById('strategyBookingForm');
  const formState = document.getElementById('modalFormState');
  const submitBtn = document.getElementById('formSubmitBtn');

  if (!modal) return;

  function openModal(sourceName) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input[name="fullName"]');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 150);
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const source = btn.getAttribute('data-open-modal') || 'generic_cta';
      openModal(source);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Form Submission
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Simple Validation
      const name = (bookingForm.fullName ? bookingForm.fullName.value : '').trim();
      const email = (bookingForm.email ? bookingForm.email.value : '').trim();
      const phone = (bookingForm.phone ? bookingForm.phone.value : '').trim();

      if (!name || !email || !phone) {
        alert('Please complete all required fields.');
        return;
      }

      if (phone.length < 8) {
        alert('Please enter a valid phone number.');
        return;
      }

      // UI Loading state
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>⏳ Reserving Your Slot...</span>`;

      // Extract and save user's first name for personalization
      const firstName = name.split(' ')[0] || 'Friend';
      try {
        sessionStorage.setItem('bookedLeadName', name);
        sessionStorage.setItem('bookedLeadFirstName', firstName);
        sessionStorage.setItem('bookedLeadEmail', email);
        sessionStorage.setItem('bookedLeadPhone', phone);
      } catch (err) {}

      // Submit via fetch to form.php
      const formData = new FormData(bookingForm);

      try {
        const response = await fetch('form.php', {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && result.redirect) {
            window.location.href = result.redirect;
            return;
          }
        }
        // Fallback redirect
        window.location.href = `thank-you.html?name=${encodeURIComponent(firstName)}`;
      } catch (fetchErr) {
        // In local static file preview without a PHP server or temporary connection drop:
        console.warn('Form submission proceeding to confirmation:', fetchErr);
        window.location.href = `thank-you.html?name=${encodeURIComponent(firstName)}`;
      }
    });
  }
}

/* ==========================================================================
   5. STICKY BOTTOM BAR VISIBILITY ON SCROLL
   ========================================================================== */
function initStickyBottomBar() {
  const stickyBar = document.getElementById('stickyBottomBar');
  const heroSection = document.querySelector('.hero-section');
  if (!stickyBar || !heroSection) return;

  window.addEventListener('scroll', () => {
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    const scrollPos = window.scrollY || window.pageYOffset;

    // Show sticky bottom bar once scrolled 300px past hero
    if (scrollPos > heroBottom - 200) {
      stickyBar.classList.add('visible');
    } else {
      stickyBar.classList.remove('visible');
    }
  }, { passive: true });
}

/* ==========================================================================
   6. HERO VIDEO PLAYER MODAL & PREVIEW
   ========================================================================== */
function initVideoPlayer() {
  const videoBox = document.getElementById('heroVideoBox');
  const videoModal = document.getElementById('videoPlayerModal');
  const videoCloseBtn = document.getElementById('videoModalCloseBtn');
  const videoIframe = document.getElementById('previewVideoIframe');

  if (!videoBox || !videoModal) return;

  videoBox.addEventListener('click', () => {
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Embed training video or high-converting preview
    if (videoIframe && !videoIframe.src) {
      videoIframe.src = "https://www.youtube.com/embed/Fm6GyOdHZtc?autoplay=1&rel=0";
    }
  });

  function closeVideoModal() {
    videoModal.classList.remove('active');
    document.body.style.overflow = '';
    if (videoIframe) {
      videoIframe.src = "";
    }
  }

  if (videoCloseBtn) {
    videoCloseBtn.addEventListener('click', closeVideoModal);
  }

  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
      closeVideoModal();
    }
  });
}
