/**
 * CASA AMARA BOUTIQUE HOTEL
 * Interactive Multi-step Booking Flow (6 Steps)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Booking State
  const bookingState = {
    currentStep: 1,
    checkin: '10/27/2026',
    checkout: '10/30/2026',
    guests: 2,
    nights: 3,
    room: {
      id: 'deluxe',
      name: 'Deluxe Room',
      price: 8200,
      thumb: 'assets/images/deluxe-room.svg',
      tag: 'Deluxe room'
    },
    guest: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'guest@example.com',
      phone: '+63 917 123 4567',
      requests: ''
    },
    paymentMethod: 'card'
  };

  // Date parsing and night calculation helpers
  function parseDate(str) {
    if (!str) return null;
    const s = String(str).trim();
    // MM/DD/YYYY format
    const slashParts = s.split('/');
    if (slashParts.length === 3) {
      const m = parseInt(slashParts[0], 10) - 1;
      const d = parseInt(slashParts[1], 10);
      const y = parseInt(slashParts[2], 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
    // YYYY-MM-DD format
    const isoParts = s.split('-');
    if (isoParts.length === 3) {
      const y = parseInt(isoParts[0], 10);
      const m = parseInt(isoParts[1], 10) - 1;
      const d = parseInt(isoParts[2], 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function formatShortDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function calculateNights(cinStr, coutStr) {
    const cin = parseDate(cinStr);
    const cout = parseDate(coutStr);
    if (cin && cout) {
      const diffMs = cout.getTime() - cin.getTime();
      const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    }
    return 3;
  }

  function parseSlashToIso(slashDate) {
    if (!slashDate) return '';
    const parts = String(slashDate).trim().split('/');
    if (parts.length === 3) {
      const m = parts[0].padStart(2, '0');
      const d = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  function parseIsoToSlash(isoDate) {
    if (!isoDate) return '';
    const parts = String(isoDate).trim().split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${m}/${d}/${y}`;
    }
    return '';
  }

  // 1. Check URL parameters and sessionStorage to pre-fill Step 1 & select room
  const urlParams = new URLSearchParams(window.location.search);
  const paramRoom = urlParams.get('room');
  let paramCheckin = urlParams.get('checkin');
  let paramCheckout = urlParams.get('checkout');
  let paramGuests = urlParams.get('guests');

  // Fallback to session storage if not explicitly passed in URL
  try {
    if (!paramCheckin) paramCheckin = sessionStorage.getItem('ca_search_checkin');
    if (!paramCheckout) paramCheckout = sessionStorage.getItem('ca_search_checkout');
    if (!paramGuests) paramGuests = sessionStorage.getItem('ca_search_guests');
  } catch (e) {}

  // Auto-fill Step 1 inputs and booking state
  const inCheckin = document.getElementById('inCheckin');
  const inCheckout = document.getElementById('inCheckout');
  const inGuests = document.getElementById('inGuests');

  let wasPrefilled = false;
  if (paramCheckin) {
    bookingState.checkin = paramCheckin;
    if (inCheckin) inCheckin.value = paramCheckin;
    wasPrefilled = true;
  }
  if (paramCheckout) {
    bookingState.checkout = paramCheckout;
    if (inCheckout) inCheckout.value = paramCheckout;
    wasPrefilled = true;
  }
  if (paramGuests) {
    bookingState.guests = parseInt(paramGuests, 10) || 2;
    if (inGuests) inGuests.value = bookingState.guests;
    wasPrefilled = true;
  }

  // Visual confirmation glow on pre-filled inputs
  if (wasPrefilled) {
    [inCheckin, inCheckout, inGuests].forEach(el => {
      if (el) {
        el.classList.add('input-prefilled-highlight');
        setTimeout(() => el.classList.remove('input-prefilled-highlight'), 2200);
      }
    });
  }

  // Room pre-selection
  if (paramRoom) {
    const roomMap = {
      'deluxe': { name: 'Deluxe Room', price: 8200, thumb: 'assets/images/deluxe-room.svg', tag: 'Deluxe room' },
      'executive': { name: 'Executive Room', price: 11500, thumb: 'assets/images/executive-room.svg', tag: 'Executive room' },
      'family': { name: 'Family Room', price: 9800, thumb: 'assets/images/family-room.svg', tag: 'Family room' },
      'premium': { name: 'Premium Suite', price: 14500, thumb: 'assets/images/premium-suite.svg', tag: 'Premium suite' }
    };
    if (roomMap[paramRoom]) {
      bookingState.room.id = paramRoom;
      bookingState.room.name = roomMap[paramRoom].name;
      bookingState.room.price = roomMap[paramRoom].price;
      bookingState.room.thumb = roomMap[paramRoom].thumb;
      bookingState.room.tag = roomMap[paramRoom].tag;
    }
  }

  // Wire up Step 1 native date pickers
  const inCheckinPicker = document.getElementById('inCheckinPicker');
  const inCheckoutPicker = document.getElementById('inCheckoutPicker');
  const btnPickInCheckin = document.getElementById('btnPickInCheckin');
  const btnPickInCheckout = document.getElementById('btnPickInCheckout');

  if (inCheckinPicker && inCheckin) {
    inCheckinPicker.value = parseSlashToIso(inCheckin.value);
    btnPickInCheckin?.addEventListener('click', () => {
      inCheckinPicker.value = parseSlashToIso(inCheckin.value);
      if (typeof inCheckinPicker.showPicker === 'function') {
        inCheckinPicker.showPicker();
      } else {
        inCheckinPicker.focus();
      }
    });
    inCheckinPicker.addEventListener('change', () => {
      if (inCheckinPicker.value) {
        inCheckin.value = parseIsoToSlash(inCheckinPicker.value);
        updateCalculations();
      }
    });
  }

  if (inCheckoutPicker && inCheckout) {
    inCheckoutPicker.value = parseSlashToIso(inCheckout.value);
    btnPickInCheckout?.addEventListener('click', () => {
      inCheckoutPicker.value = parseSlashToIso(inCheckout.value);
      if (typeof inCheckoutPicker.showPicker === 'function') {
        inCheckoutPicker.showPicker();
      } else {
        inCheckoutPicker.focus();
      }
    });
    inCheckoutPicker.addEventListener('change', () => {
      if (inCheckoutPicker.value) {
        inCheckout.value = parseIsoToSlash(inCheckoutPicker.value);
        updateCalculations();
      }
    });
  }

  // 2. Stepper Management
  function goToStep(stepNumber) {
    bookingState.currentStep = stepNumber;

    // Show only active pane
    document.querySelectorAll('.step-pane').forEach((pane, idx) => {
      pane.style.display = (idx + 1 === stepNumber) ? 'block' : 'none';
    });

    // Update stepper nodes
    const stepNodes = document.querySelectorAll('.step-node');
    stepNodes.forEach((node) => {
      const nodeStep = parseInt(node.getAttribute('data-step'), 10);
      const bubble = node.querySelector('.step-node-bubble');

      node.classList.remove('active', 'completed');
      if (nodeStep < stepNumber) {
        node.classList.add('completed');
        bubble.innerHTML = '&#10003;'; // Checkmark
      } else if (nodeStep === stepNumber) {
        node.classList.add('active');
        if (stepNumber === 6) {
          node.classList.add('completed');
          bubble.innerHTML = '&#10003;';
        } else {
          bubble.textContent = nodeStep;
        }
      } else {
        bubble.textContent = nodeStep;
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateCalculations();
  }

  // Allow clicking completed step nodes in stepper
  document.querySelectorAll('.step-node').forEach(node => {
    node.addEventListener('click', () => {
      const targetStep = parseInt(node.getAttribute('data-step'), 10);
      if (targetStep < bookingState.currentStep && bookingState.currentStep !== 6) {
        goToStep(targetStep);
      }
    });
  });

  // 3. Calculation & Display Updates
  function updateCalculations() {
    // Read current form inputs
    const inCinEl = document.getElementById('inCheckin');
    const inCoutEl = document.getElementById('inCheckout');
    const inGuestsEl = document.getElementById('inGuests');

    if (inCinEl) bookingState.checkin = inCinEl.value.trim() || '10/27/2026';
    if (inCoutEl) bookingState.checkout = inCoutEl.value.trim() || '10/30/2026';
    if (inGuestsEl) bookingState.guests = parseInt(inGuestsEl.value, 10) || 2;

    bookingState.nights = calculateNights(bookingState.checkin, bookingState.checkout);

    const cinDate = parseDate(bookingState.checkin);
    const coutDate = parseDate(bookingState.checkout);
    const cinFormatted = cinDate ? formatShortDate(cinDate) : bookingState.checkin;
    const coutFormatted = coutDate ? formatShortDate(coutDate) : bookingState.checkout;

    // Update Step 2 summary text
    const step2DateSummary = document.getElementById('step2DateSummary');
    if (step2DateSummary) {
      step2DateSummary.textContent = `${cinFormatted}–${coutFormatted} · ${bookingState.guests} guest${bookingState.guests > 1 ? 's' : ''}`;
    }

    // Money calculations
    const subtotal = bookingState.room.price * bookingState.nights;
    const taxes = Math.round(subtotal * 0.12); // 12% VAT/Service
    const total = subtotal + taxes;
    const deposit30 = Math.round(total * 0.30);

    const fmt = (num) => '₱' + num.toLocaleString('en-US');

    // Step 4 (Review) updates
    const reviewRoomImg = document.getElementById('reviewRoomImg');
    if (reviewRoomImg) reviewRoomImg.src = bookingState.room.thumb;

    const reviewRoomTag = document.getElementById('reviewRoomTag');
    if (reviewRoomTag) reviewRoomTag.textContent = bookingState.room.tag;

    const reviewRoomTitle = document.getElementById('reviewRoomTitle');
    if (reviewRoomTitle) reviewRoomTitle.textContent = bookingState.room.name;

    const reviewCheckinTxt = document.getElementById('reviewCheckinTxt');
    if (reviewCheckinTxt) reviewCheckinTxt.textContent = cinFormatted;

    const reviewCheckoutTxt = document.getElementById('reviewCheckoutTxt');
    if (reviewCheckoutTxt) reviewCheckoutTxt.textContent = coutFormatted;

    const reviewStayMeta = document.getElementById('reviewStayMeta');
    if (reviewStayMeta) {
      reviewStayMeta.textContent = `${bookingState.nights} night${bookingState.nights > 1 ? 's' : ''} · ${bookingState.guests} guest${bookingState.guests > 1 ? 's' : ''} · 1 room`;
    }

    const priceFormulaTxt = document.getElementById('priceFormulaTxt');
    if (priceFormulaTxt) priceFormulaTxt.textContent = `${fmt(bookingState.room.price)} × ${bookingState.nights} night${bookingState.nights > 1 ? 's' : ''}`;

    const priceSubtotalTxt = document.getElementById('priceSubtotalTxt');
    if (priceSubtotalTxt) priceSubtotalTxt.textContent = fmt(subtotal);

    const priceTaxTxt = document.getElementById('priceTaxTxt');
    if (priceTaxTxt) priceTaxTxt.textContent = fmt(taxes);

    const priceTotalTxt = document.getElementById('priceTotalTxt');
    if (priceTotalTxt) priceTotalTxt.textContent = fmt(total);

    // Guest Info updates in Step 4
    const firstName = document.getElementById('inFirstName')?.value || 'John';
    const lastName = document.getElementById('inLastName')?.value || 'Doe';
    const email = document.getElementById('inEmail')?.value || 'guest@example.com';
    const phone = document.getElementById('inPhone')?.value || '+63 917 123 4567';

    bookingState.guest = { firstName, lastName, email, phone };

    const reviewGuestName = document.getElementById('reviewGuestName');
    if (reviewGuestName) reviewGuestName.textContent = `${firstName} ${lastName}`;

    const reviewGuestEmail = document.getElementById('reviewGuestEmail');
    if (reviewGuestEmail) reviewGuestEmail.textContent = email;

    const reviewGuestPhone = document.getElementById('reviewGuestPhone');
    if (reviewGuestPhone) reviewGuestPhone.textContent = phone;

    // Step 5 (Payment) updates
    const cardDepositSub = document.getElementById('cardDepositSub');
    if (cardDepositSub) cardDepositSub.textContent = `Simulated 30% deposit of ${fmt(deposit30)}`;

    const gcashDepositSub = document.getElementById('gcashDepositSub');
    if (gcashDepositSub) gcashDepositSub.textContent = `Simulated 30% deposit of ${fmt(deposit30)}`;

    const payStayRoomTitle = document.getElementById('payStayRoomTitle');
    if (payStayRoomTitle) payStayRoomTitle.textContent = bookingState.room.name;

    const payStayDates = document.getElementById('payStayDates');
    if (payStayDates) {
      payStayDates.textContent = `${cinFormatted}–${coutFormatted} · ${bookingState.nights} night${bookingState.nights > 1 ? 's' : ''}`;
    }

    const payStaySubtotal = document.getElementById('payStaySubtotal');
    if (payStaySubtotal) payStaySubtotal.textContent = fmt(subtotal);

    const payStayTax = document.getElementById('payStayTax');
    if (payStayTax) payStayTax.textContent = fmt(taxes);

    const payStayTotal = document.getElementById('payStayTotal');
    if (payStayTotal) payStayTotal.textContent = fmt(total);

    // Step 6 (Confirmation) updates
    const confEmailSpan = document.getElementById('confEmailSpan');
    if (confEmailSpan) confEmailSpan.textContent = email;

    const confEmailHintSpan = document.getElementById('confEmailHintSpan');
    if (confEmailHintSpan) confEmailHintSpan.textContent = email;

    const confColGuest = document.getElementById('confColGuest');
    if (confColGuest) confColGuest.textContent = `${firstName} ${lastName}`;

    const confColParty = document.getElementById('confColParty');
    if (confColParty) confColParty.textContent = `${bookingState.guests} guest${bookingState.guests > 1 ? 's' : ''}`;

    const confColCheckin = document.getElementById('confColCheckin');
    if (confColCheckin) confColCheckin.textContent = cinFormatted;

    const confColCheckout = document.getElementById('confColCheckout');
    if (confColCheckout) confColCheckout.textContent = `to ${coutFormatted}`;

    const confColRoom = document.getElementById('confColRoom');
    if (confColRoom) confColRoom.textContent = bookingState.room.name;

    const confColNights = document.getElementById('confColNights');
    if (confColNights) confColNights.textContent = `${bookingState.nights} night${bookingState.nights > 1 ? 's' : ''}`;

    const confColPayStatus = document.getElementById('confColPayStatus');
    const confColPayAmount = document.getElementById('confColPayAmount');
    if (bookingState.paymentMethod === 'hotel') {
      if (confColPayStatus) confColPayStatus.textContent = 'Pending';
      if (confColPayAmount) confColPayAmount.textContent = 'Pay at hotel';
    } else {
      if (confColPayStatus) confColPayStatus.textContent = 'Deposit paid';
      if (confColPayAmount) confColPayAmount.textContent = `${fmt(deposit30)} collected`;
    }
  }

  // Real-time calculation synchronization when inputs change
  ['inCheckin', 'inCheckout', 'inGuests'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateCalculations);
      el.addEventListener('change', updateCalculations);
    }
  });

  ['inFirstName', 'inLastName', 'inEmail', 'inPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateCalculations);
      el.addEventListener('change', updateCalculations);
    }
  });

  // 4. Room Card Selection
  function setupRoomCardEvents() {
    const roomCards = document.querySelectorAll('.room-select-card');
    roomCards.forEach(card => {
      if (card.getAttribute('data-room-id') === bookingState.room.id) {
        roomCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        bookingState.room.price = parseInt(card.getAttribute('data-room-price'), 10);
        bookingState.room.name = card.getAttribute('data-room-name');
        bookingState.room.thumb = card.getAttribute('data-room-thumb');
        updateCalculations();
      }

      card.addEventListener('click', () => {
        roomCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        bookingState.room.id = card.getAttribute('data-room-id');
        bookingState.room.name = card.getAttribute('data-room-name');
        bookingState.room.price = parseInt(card.getAttribute('data-room-price'), 10);
        bookingState.room.thumb = card.getAttribute('data-room-thumb');
        const tagElem = card.querySelector('.room-select-tag');
        bookingState.room.tag = tagElem ? tagElem.textContent : card.getAttribute('data-room-name');

        updateCalculations();
      });
    });
  }

  async function loadPublishedRooms() {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const rooms = await res.json();
        const availableRooms = rooms.filter(r => r.status === 'available');
        if (availableRooms.length > 0) {
          const listContainer = document.querySelector('.room-select-list');
          if (listContainer) {
            listContainer.innerHTML = availableRooms.map(r => `
              <div class="room-select-card ${r.id === bookingState.room.id ? 'selected' : ''}" 
                   data-room-id="${r.id}" 
                   data-room-name="${r.name}" 
                   data-room-price="${r.rate_per_night}" 
                   data-room-thumb="${r.image || 'assets/images/deluxe-room.svg'}">
                <div class="room-radio-circle">
                  <div class="room-radio-dot"></div>
                </div>
                <div class="room-select-thumb">
                  <img src="${r.image || 'assets/images/deluxe-room.svg'}" alt="${r.name}">
                </div>
                <div class="room-select-details">
                  <div class="room-select-tag">${r.badge || r.name}</div>
                  <h3 class="room-select-title">${r.name}</h3>
                  <p class="room-select-specs">Up to ${r.max_guests} guests · ${r.bed_config || 'King bed'} · ${r.view || 'Garden view'}</p>
                </div>
                <div class="room-select-price-box">
                  <div class="room-select-price">₱${Number(r.rate_per_night).toLocaleString()} <span>/ night</span></div>
                </div>
              </div>
            `).join('');
          }
        }
      }
    } catch (e) {
      console.log('Using static fallback for rooms.');
    }
    setupRoomCardEvents();
  }

  loadPublishedRooms();

  // 5. Payment Option Selection
  const payOptions = document.querySelectorAll('.payment-option-card');
  payOptions.forEach(card => {
    card.addEventListener('click', () => {
      payOptions.forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.room-radio-dot').style.opacity = '0';
      });
      card.classList.add('selected');
      card.querySelector('.room-radio-dot').style.opacity = '1';

      const method = card.getAttribute('data-pay-method');
      bookingState.paymentMethod = method;

      const cardInputs = document.getElementById('cardInputsContainer');
      if (cardInputs) {
        cardInputs.style.display = (method === 'card') ? 'block' : 'none';
      }
    });
  });

  // 6. Step Transitions
  document.getElementById('btnToStep2')?.addEventListener('click', () => goToStep(2));
  document.getElementById('btnBackToStep1')?.addEventListener('click', () => goToStep(1));

  document.getElementById('btnToStep3')?.addEventListener('click', () => goToStep(3));
  document.getElementById('btnBackToStep2')?.addEventListener('click', () => goToStep(2));

  document.getElementById('btnToStep4')?.addEventListener('click', () => goToStep(4));
  document.getElementById('btnBackToStep3')?.addEventListener('click', () => goToStep(3));

  document.getElementById('btnToStep5')?.addEventListener('click', () => goToStep(5));
  document.getElementById('btnBackToStep4')?.addEventListener('click', () => goToStep(4));

  document.getElementById('btnConfirmBooking')?.addEventListener('click', async () => {
    const refCode = 'CA-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const confCodeEl = document.getElementById('confBookingRefCode');
    if (confCodeEl) confCodeEl.textContent = refCode;

    const subtotal = bookingState.room.price * bookingState.nights;
    const taxes = Math.round(subtotal * 0.12);
    const total = subtotal + taxes;

    const newReservationRecord = {
      reference_id: refCode,
      guest_name: `${bookingState.guest.firstName} ${bookingState.guest.lastName}`,
      email: bookingState.guest.email,
      phone: bookingState.guest.phone,
      room_type_id: bookingState.room.id,
      room_name: bookingState.room.name,
      check_in: bookingState.checkin,
      check_out: bookingState.checkout,
      nights: bookingState.nights,
      guests: parseInt(bookingState.guests, 10),
      total_amount: total,
      payment_status: bookingState.paymentMethod === 'hotel' ? 'Pay at hotel' : 'Deposit paid',
      special_requests: document.getElementById('inRequests')?.value || ''
    };

    try {
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservationRecord)
      });
    } catch (e) {
      console.warn('API save fallback:', e);
    }

    goToStep(6);
  });

  // Initialize calculations on first load
  updateCalculations();
});
