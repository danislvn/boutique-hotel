/**
 * CASA AMARA BOUTIQUE HOTEL
 * Main Script - Navigation, Micro-Interactions & Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navigation Scroll Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. Active Link Handling
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // 3. Mobile Navigation Drawer Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.classList.toggle('active', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when clicking nav links
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close when tapping outside
    document.addEventListener('click', (e) => {
      if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 4. Booking Button Feedback (Friendly toast notification)
  const bookingButtons = document.querySelectorAll('button:not(.mobile-toggle), .btn-primary');
  bookingButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const actionName = btn.innerText.trim();
      if (actionName.includes('Book') || actionName.includes('dates')) {
        showToast(`Opening booking inquiry: ${actionName}...`);
      }
    });
  });

  function showToast(message) {
    let existingToast = document.querySelector('.ca-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'ca-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#23201D',
      color: '#FAF7F2',
      padding: '12px 22px',
      borderRadius: '4px',
      fontSize: '13px',
      letterSpacing: '0.04em',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      zIndex: '9999',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      transform: 'translateY(10px)',
      opacity: '0'
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  // 5. Kinetic Typography Font Stretching Wave for "Casa Amara"
  const giantFooter = document.querySelector('.giant-footer-title');
  const stretchChars = document.querySelectorAll('.stretch-char');

  if (giantFooter && stretchChars.length > 0) {
    giantFooter.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      stretchChars.forEach(char => {
        const rect = char.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;

        const distX = Math.abs(mouseX - charCenterX);
        const distY = Math.abs(mouseY - charCenterY);
        const distance = Math.hypot(distX, distY);

        // Maximum interaction radius: 220px
        const maxDist = 220;
        if (distance < maxDist) {
          const intensity = 1 - (distance / maxDist);
          // Scale vertical from 1.0 up to 1.62
          const scaleY = 1 + (intensity * 0.62);
          const scaleX = 1 + (intensity * 0.14);
          char.style.transform = `scaleY(${scaleY.toFixed(3)}) scaleX(${scaleX.toFixed(3)})`;
          char.style.color = intensity > 0.6 ? '#FFF3DD' : '#DFC8A5';
        } else {
          char.style.transform = '';
          char.style.color = '';
        }
      });
    });

    giantFooter.addEventListener('mouseleave', () => {
      stretchChars.forEach(char => {
        char.style.transform = '';
        char.style.color = '';
      });
    });
  }

  // 6. Dynamic Catalog Synchronization for rooms.html
  const roomsCatalogGrid = document.querySelector('.rooms-catalog-grid');
  if (roomsCatalogGrid) {
    fetch('/api/rooms')
      .then(res => res.ok ? res.json() : null)
      .then(rooms => {
        if (!rooms || rooms.length === 0) return;
        const liveRooms = rooms.filter(r => r.status === 'available');
        if (liveRooms.length === 0) return;

        roomsCatalogGrid.innerHTML = liveRooms.map(room => {
          const amenitiesList = (room.amenities || ['King bed', 'Courtyard view', 'Rain shower']).slice(0, 3).map(a => `
            <li>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${a}
            </li>
          `).join('');

          return `
            <article class="room-card" data-room-id="${room.id}">
              <div class="room-image-box">
                <span class="room-badge">${(room.badge || room.name).toUpperCase()}</span>
                <img src="${room.image || 'assets/images/deluxe-room.svg'}" alt="${room.name}" loading="lazy">
              </div>
              <div class="room-content">
                <div class="room-header">
                  <h2 class="room-title">${room.name}</h2>
                  <div class="room-price">₱${Number(room.rate_per_night).toLocaleString()} <span>/ night</span></div>
                </div>
                <div class="room-meta">
                  <span class="room-meta-item">
                    <svg class="meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Up to ${room.max_guests} guests
                  </span>
                  <span class="room-meta-sep">·</span>
                  <span class="room-meta-item">
                    <svg class="meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>
                    ${room.bed_config || '1 king bed'}
                  </span>
                </div>
                <p class="room-desc">
                  ${room.tagline || 'A serene boutique retreat with tailored luxury amenities.'}
                </p>
                <ul class="room-features">
                  ${amenitiesList}
                </ul>
                <div class="room-actions">
                  <button type="button" class="btn-outline-dark btn-view-room" data-room-id="${room.id}">View room</button>
                  <a href="booking.html?room=${room.id}" class="btn-primary">Book now &rarr;</a>
                </div>
              </div>
            </article>
          `;
        }).join('');
      })
      .catch(err => {
        console.log('Using static rooms catalog fallback.');
      });
  }

  // 7. Scroll Reading Progress Bar
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  });

  // 8. Scroll-Driven IntersectionObserver Reveal Animations
  const revealElements = document.querySelectorAll(
    '.room-card, .dining-card, .pool-card, .amenity-feature-item, ' +
    '.about-grid > div, .reserve-direct-card, .section-header, .rooms-catalog-section .room-card'
  );

  revealElements.forEach((el, index) => {
    el.classList.add('reveal-init');
    // Stagger delay within groups
    const delay = (index % 4) * 120;
    el.style.transitionDelay = `${delay}ms`;
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // 9. Floating "Back to Top" Luxury Scroll Button
  const backToTopBtn = document.createElement('button');
  backToTopBtn.className = 'back-to-top-btn';
  backToTopBtn.setAttribute('aria-label', 'Return to top of page');
  backToTopBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  `;
  document.body.appendChild(backToTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 380) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // 10. Click Ripple Effect on Interactive CTAs
  const interactiveBtns = document.querySelectorAll('.btn-primary, .btn-outline-dark, .btn-post-room');
  interactiveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
      circle.style.transform = 'scale(0)';
      circle.style.animation = 'rippleEffect 0.6s linear';
      circle.style.pointerEvents = 'none';

      const existingRipple = btn.querySelector('.btn-ripple');
      if (existingRipple) existingRipple.remove();

      circle.className = 'btn-ripple';
      btn.appendChild(circle);

      setTimeout(() => circle.remove(), 600);
    });
  });

  // 11. View Room Detail Modal Controller (Exact Figma Spec Replication)
  const ROOM_DETAILS_MAP = {
    'deluxe': {
      id: 'deluxe',
      tag: 'Deluxe room',
      title: 'Deluxe Room',
      desc: 'A serene garden-facing retreat with natural linens, handcrafted details, and a generous rainfall shower.',
      specs: 'Up to 2 guests · 1 king bed · 4 rooms in hotel inventory',
      features: ['King bed', 'Garden view', 'Rain shower'],
      price: '₱8,200',
      image: 'assets/images/deluxe-room.jpg'
    },
    'executive': {
      id: 'executive',
      tag: 'Executive room',
      title: 'Executive Room',
      desc: 'An intimate room pairing a quiet private terrace with layered textures and a deep soaking tub.',
      specs: 'Up to 3 guests · 1 king bed and daybed · 3 rooms in hotel inventory',
      features: ['Private terrace', 'King bed and daybed', 'Soaking tub'],
      price: '₱11,500',
      image: 'assets/images/executive-room.jpg'
    },
    'family': {
      id: 'family',
      tag: 'Family room',
      title: 'Family Room',
      desc: 'Generous shared space with two queen beds, serene inner courtyard lighting, and breakfast included.',
      specs: 'Up to 5 guests · 2 queen beds · 3 rooms in hotel inventory',
      features: ['Two queen beds', 'Courtyard view', 'Family breakfast'],
      price: '₱9,800',
      image: 'assets/images/family-room.jpg'
    },
    'premium': {
      id: 'premium',
      tag: 'Premium suite',
      title: 'Premium Suite',
      desc: 'Our most spacious retreat, with a private lounge, bespoke furnishings, and thoughtful evening turndown.',
      specs: 'Up to 5 guests · 1 king bed and sofa bed · 2 rooms in hotel inventory',
      features: ['Separate lounge', 'Soaking tub', 'Evening turndown'],
      price: '₱14,500',
      image: 'assets/images/premium-suite.jpg'
    }
  };

  const viewRoomModal = document.getElementById('viewRoomModal');
  const closeViewRoomModalBtn = document.getElementById('closeViewRoomModal');
  const modalImg = document.getElementById('viewRoomModalImg');
  const modalTag = document.getElementById('viewRoomModalTag');
  const modalTitle = document.getElementById('viewRoomModalTitle');
  const modalDesc = document.getElementById('viewRoomModalDesc');
  const modalSpecs = document.getElementById('viewRoomModalSpecs');
  const modalFeatures = document.getElementById('viewRoomModalFeatures');
  const modalPrice = document.getElementById('viewRoomModalPrice');
  const modalBookBtn = document.getElementById('viewRoomModalBookBtn');

  function openRoomModal(roomId) {
    if (!viewRoomModal) return;
    const room = ROOM_DETAILS_MAP[roomId] || ROOM_DETAILS_MAP['deluxe'];

    if (modalImg) {
      modalImg.src = room.image;
      modalImg.alt = room.title;
    }
    if (modalTag) modalTag.textContent = room.tag;
    if (modalTitle) modalTitle.textContent = room.title;
    if (modalDesc) modalDesc.textContent = room.desc;
    if (modalSpecs) modalSpecs.textContent = room.specs;
    if (modalFeatures) {
      modalFeatures.innerHTML = room.features.map(f => `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> ${f}</span>`).join('');
    }
    if (modalPrice) modalPrice.textContent = room.price;
    if (modalBookBtn) {
      modalBookBtn.href = `booking.html?room=${room.id}`;
      modalBookBtn.textContent = 'Book this room';
    }

    viewRoomModal.classList.add('active');
    viewRoomModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeRoomModal() {
    if (!viewRoomModal) return;
    viewRoomModal.classList.remove('active');
    viewRoomModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Delegated event listener for all "View room" triggers
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-view-room');
    if (btn) {
      e.preventDefault();
      const roomId = btn.getAttribute('data-room-id') || 'deluxe';
      openRoomModal(roomId);
    }
  });

  if (closeViewRoomModalBtn) {
    closeViewRoomModalBtn.addEventListener('click', closeRoomModal);
  }

  if (viewRoomModal) {
    viewRoomModal.addEventListener('click', (e) => {
      if (e.target === viewRoomModal) {
        closeRoomModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewRoomModal && viewRoomModal.classList.contains('active')) {
      closeRoomModal();
    }
  });
});

