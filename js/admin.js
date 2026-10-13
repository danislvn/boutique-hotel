/**
 * Casa Amara Boutique Hotel - Admin & Room Inventory Publishing Engine
 * Industry Best Practices Property Management System (PMS)
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let allRooms = [];
  let allReservations = [];
  let currentUser = null;
  let activeTab = 'rooms';

  // DOM Elements
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const userPill = document.getElementById('userPill');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const btnSignOut = document.getElementById('btnSignOut');

  const kpiTotalRooms = document.getElementById('kpiTotalRooms');
  const kpiAvailableUnits = document.getElementById('kpiAvailableUnits');
  const kpiMaintenanceRooms = document.getElementById('kpiMaintenanceRooms');
  const kpiTotalReservations = document.getElementById('kpiTotalReservations');

  const roomsContainer = document.getElementById('roomsContainer');
  const reservationsContainer = document.getElementById('reservationsContainer');
  const reservationsTableBody = document.getElementById('reservationsTableBody');

  const roomSearchInput = document.getElementById('roomSearchInput');
  const roomStatusFilter = document.getElementById('roomStatusFilter');

  const roomModalBackdrop = document.getElementById('roomModalBackdrop');
  const roomForm = document.getElementById('roomForm');
  const modalTitle = document.getElementById('modalTitle');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const btnOpenPostModal = document.getElementById('btnOpenPostModal');

  const adminToast = document.getElementById('adminToast');
  const toastMessage = document.getElementById('toastMessage');

  const tabButtons = document.querySelectorAll('.admin-tab-btn');

  // --- Toast Feedback ---
  function showToast(msg) {
    if (!adminToast || !toastMessage) return;
    toastMessage.textContent = msg;
    adminToast.classList.add('show');
    setTimeout(() => {
      adminToast.classList.remove('show');
    }, 3800);
  }

  // --- Authentication ---
  function checkAuth() {
    const sessionUser = sessionStorage.getItem('casa_amara_admin_user');
    if (sessionUser) {
      try {
        currentUser = JSON.parse(sessionUser);
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (userNameDisplay) userNameDisplay.textContent = `${currentUser.full_name} (${currentUser.role})`;
        loadData();
      } catch (e) {
        showLogin();
      }
    } else {
      showLogin();
    }
  }

  function showLogin() {
    if (loginOverlay) loginOverlay.style.display = 'flex';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          currentUser = data.user;
          sessionStorage.setItem('casa_amara_admin_user', JSON.stringify(currentUser));
          loginOverlay.style.display = 'none';
          if (userNameDisplay) userNameDisplay.textContent = `${currentUser.full_name} (${currentUser.role})`;
          showToast(`Welcome back, ${currentUser.full_name}`);
          loadData();
        } else {
          loginError.textContent = data.error || 'Invalid credentials';
          loginError.style.display = 'block';
        }
      } catch (err) {
        loginError.textContent = 'Network or server error occurred.';
        loginError.style.display = 'block';
      }
    });
  }

  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      sessionStorage.removeItem('casa_amara_admin_user');
      currentUser = null;
      showLogin();
      showToast('Signed out successfully.');
    });
  }

  // --- Data Loading ---
  async function loadData() {
    await Promise.all([fetchRooms(), fetchReservations()]);
    updateKpis();
    renderRooms();
    renderReservations();
  }

  async function fetchRooms() {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        allRooms = await res.json();
      }
    } catch (e) {
      console.error('Failed to load rooms:', e);
    }
  }

  async function fetchReservations() {
    try {
      const res = await fetch('/api/reservations');
      if (res.ok) {
        allReservations = await res.json();
      }
    } catch (e) {
      console.error('Failed to load reservations:', e);
    }
  }

  // --- KPI Updates ---
  function updateKpis() {
    if (kpiTotalRooms) kpiTotalRooms.textContent = allRooms.length;
    
    const availableUnits = allRooms.reduce((acc, r) => acc + (r.status === 'available' ? (r.available_units || 0) : 0), 0);
    if (kpiAvailableUnits) kpiAvailableUnits.textContent = availableUnits;

    const maintenanceRooms = allRooms.filter(r => r.status === 'maintenance').length;
    if (kpiMaintenanceRooms) kpiMaintenanceRooms.textContent = maintenanceRooms;

    if (kpiTotalReservations) kpiTotalReservations.textContent = allReservations.length;
  }

  // --- Render Rooms ---
  function renderRooms() {
    if (!roomsContainer) return;
    const query = (roomSearchInput?.value || '').toLowerCase().trim();
    const statusFilter = roomStatusFilter?.value || 'all';

    const filtered = allRooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(query) ||
                            (room.tagline || '').toLowerCase().includes(query) ||
                            (room.bed_config || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      roomsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; background: #fff; border-radius: 8px; padding: 3rem; text-align: center; border: 1px dashed var(--ca-border-subtle);">
          <p style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--ca-espresso); margin-bottom: 0.5rem;">No rooms match criteria</p>
          <p style="font-size: 0.9rem; color: var(--ca-text-muted);">Try adjusting your search filters or post a new room category.</p>
        </div>
      `;
      return;
    }

    roomsContainer.innerHTML = filtered.map(room => {
      const isAvail = room.status === 'available';
      const isMaint = room.status === 'maintenance';
      const statusClass = isAvail ? 'status-badge-available' :
                          isMaint ? 'status-badge-maintenance' : 'status-badge-soldout';
      const statusText = isAvail ? '● Available' :
                         isMaint ? '▲ Maintenance' : '✕ Sold Out';

      const pctUnits = room.inventory_units > 0 ? Math.round(((room.available_units || 0) / room.inventory_units) * 100) : 0;
      
      // Clean size to only meter squared
      const cleanSize = (room.room_size || '40 m²').split('/')[0].trim();

      return `
        <div class="admin-room-card" data-room-id="${room.id}">
          <div class="admin-room-media">
            <img src="${room.image || 'assets/images/deluxe-room.jpg'}" alt="${room.name}" />
            ${room.badge ? `<span class="room-badge-overlay">${room.badge}</span>` : ''}
            <span class="room-status-badge ${statusClass}">${statusText}</span>
          </div>
          
          <div class="admin-room-content">
            <!-- Header: Title & Nightly Rate -->
            <div class="admin-room-header">
              <div class="admin-room-title-block">
                <h3 class="admin-room-name">${room.name}</h3>
                ${room.featured ? '<span class="room-featured-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Featured on Home</span>' : ''}
              </div>
              <div class="admin-room-rate-block">
                <span class="rate-amount">₱${Number(room.rate_per_night).toLocaleString()}</span>
                <span class="rate-period">/ night</span>
              </div>
            </div>

            <!-- Tagline -->
            <p class="admin-room-tagline">${room.tagline || 'Boutique accommodations tailored for serenity and luxury.'}</p>
            
            <!-- Organized 2x2 Specs Matrix -->
            <div class="admin-room-specs-matrix">
              <div class="spec-matrix-cell" title="Maximum Capacity">
                <span class="matrix-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </span>
                <span class="matrix-text">Up to ${room.max_guests} Guests</span>
              </div>
              <div class="spec-matrix-cell" title="Bed Configuration">
                <span class="matrix-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>
                </span>
                <span class="matrix-text">${room.bed_config || '1 King Bed'}</span>
              </div>
              <div class="spec-matrix-cell" title="Room Dimensions">
                <span class="matrix-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
                </span>
                <span class="matrix-text">${cleanSize}</span>
              </div>
              <div class="spec-matrix-cell" title="Room View">
                <span class="matrix-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13V9a7 7 0 0 1 7-7 7 7 0 0 1 7 7v4a7 7 0 0 1-7 7z"></path><path d="M11 20v-9"></path></svg>
                </span>
                <span class="matrix-text">${room.view || 'Courtyard View'}</span>
              </div>
            </div>

            <!-- Organized Inventory Status Card (Clean Text Only) -->
            <div class="admin-room-inventory-card">
              <span class="inv-label">Inventory Status</span>
              <span class="inv-stats"><strong>${room.available_units || 0}</strong> of ${room.inventory_units} Available</span>
            </div>

            <!-- Organized 2-Tier Actions (Prevents Awkward Text Wrapping) -->
            <div class="admin-room-actions-organized">
              <button class="btn-card-primary" onclick="window.editRoom('${room.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit Room Details</span>
              </button>
              <div class="admin-room-actions-row">
                <button class="btn-card-secondary ${isMaint ? 'is-in-maintenance' : ''}" onclick="window.toggleRoomStatus('${room.id}')">
                  ${isAvail 
                    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg><span>Set Maintenance</span>' 
                    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Set Available</span>'}
                </button>
                <button class="btn-card-danger" onclick="window.deleteRoom('${room.id}', '${room.name}')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Unpublish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Render Reservations ---
  function renderReservations() {
    if (!reservationsTableBody) return;
    if (allReservations.length === 0) {
      reservationsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--ca-text-muted);">
            No guest reservations found.
          </td>
        </tr>
      `;
      return;
    }

    reservationsTableBody.innerHTML = allReservations.map(res => {
      return `
        <tr>
          <td><strong style="font-family: monospace; color: var(--ca-espresso);">${res.reference_id}</strong></td>
          <td>
            <strong>${res.guest_name}</strong><br>
            <span style="font-size: 0.78rem; color: var(--ca-text-muted);">${res.email}</span>
          </td>
          <td><strong>${res.room_name}</strong><br><span style="font-size: 0.78rem; color: var(--ca-text-muted);">${res.guests} Guests</span></td>
          <td>${res.check_in} → ${res.check_out}<br><span style="font-size: 0.78rem; color: var(--ca-text-muted);">${res.nights} Nights</span></td>
          <td><strong>₱${Number(res.total_amount || 0).toLocaleString()}</strong></td>
          <td>
            <span style="display: inline-block; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: rgba(181, 154, 114, 0.15); color: var(--ca-espresso);">
              ${res.payment_status}
            </span>
          </td>
          <td>
            <button class="btn-card-action btn-delete-room" style="padding: 0.35rem 0.65rem;" onclick="window.cancelReservation('${res.reference_id}')">Cancel</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Global Window Actions ---
  window.editRoom = function(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    modalTitle.textContent = `Edit Room: ${room.name}`;
    document.getElementById('roomId').value = room.id;
    document.getElementById('roomName').value = room.name;
    document.getElementById('roomTagline').value = room.tagline || '';
    document.getElementById('roomRate').value = room.rate_per_night;
    document.getElementById('roomMaxGuests').value = room.max_guests;
    document.getElementById('roomTotalUnits').value = room.inventory_units;
    document.getElementById('roomAvailUnits').value = room.available_units !== undefined ? room.available_units : room.inventory_units;
    document.getElementById('roomBedConfig').value = room.bed_config || '';
    // Set Room Size
    const rawSize = room.room_size || '';
    document.getElementById('roomSize').value = rawSize;
    const sizeMatch = rawSize.match(/(\d+(\.\d+)?)/);
    const roomSizeNum = document.getElementById('roomSizeNum');
    if (sizeMatch && roomSizeNum) {
      roomSizeNum.value = sizeMatch[1];
      updateRoomSizeFromNum(sizeMatch[1]);
    } else if (roomSizeNum) {
      roomSizeNum.value = '';
      updateRoomSizeFromNum('');
    }

    document.getElementById('roomView').value = room.view || '';
    document.getElementById('roomBadge').value = room.badge || '';
    document.getElementById('roomStatus').value = room.status || 'available';
    document.getElementById('roomFeatured').checked = !!room.featured;
    document.getElementById('roomImage').value = room.image || 'assets/images/deluxe-room.jpg';

    // Set amenities
    const checkBoxes = document.querySelectorAll('input[name="roomAmenities"]');
    checkBoxes.forEach(cb => {
      cb.checked = (room.amenities || []).includes(cb.value);
    });
    syncCheckboxCards();

    roomModalBackdrop.classList.add('active');
  };

  window.toggleRoomStatus = async function(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    const newStatus = room.status === 'available' ? 'maintenance' : 'available';
    room.status = newStatus;

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      if (res.ok) {
        showToast(`Updated ${room.name} status to ${newStatus}`);
        loadData();
      }
    } catch (e) {
      showToast('Error toggling room status.');
    }
  };

  window.deleteRoom = async function(roomId, roomName) {
    if (!confirm(`Are you sure you want to unpublish "${roomName}" from the website catalog?`)) return;

    try {
      const res = await fetch(`/api/rooms?id=${encodeURIComponent(roomId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`Room "${roomName}" removed from catalog.`);
        loadData();
      } else {
        showToast('Failed to delete room.');
      }
    } catch (e) {
      showToast('Server error while deleting room.');
    }
  };

  window.cancelReservation = async function(refId) {
    if (!confirm(`Cancel reservation reference ${refId}?`)) return;
    try {
      const res = await fetch(`/api/reservations?reference_id=${encodeURIComponent(refId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`Reservation ${refId} cancelled.`);
        loadData();
      }
    } catch (e) {
      showToast('Error cancelling reservation.');
    }
  };

  // --- Modal Open/Close ---
  if (btnOpenPostModal) {
    btnOpenPostModal.addEventListener('click', () => {
      modalTitle.textContent = 'Post / Publish New Room';
      roomForm.reset();
      document.getElementById('roomId').value = '';
      document.getElementById('roomTotalUnits').value = '5';
      document.getElementById('roomAvailUnits').value = '5';
      document.getElementById('roomStatus').value = 'available';
      
      const roomSizeNum = document.getElementById('roomSizeNum');
      if (roomSizeNum) {
        roomSizeNum.value = '52';
        updateRoomSizeFromNum('52');
      }
      const defaultAmenities = [
        "Courtyard garden view",
        "Walk-in rain shower",
        "Complimentary Wi-Fi",
        "Complimentary daily breakfast"
      ];
      document.querySelectorAll('input[name="roomAmenities"]').forEach(cb => {
        cb.checked = defaultAmenities.includes(cb.value);
      });
      syncCheckboxCards();
      roomModalBackdrop.classList.add('active');
    });
  }

  function closeModal() {
    roomModalBackdrop.classList.remove('active');
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  // --- Form Submission (Post/Edit Room) ---
  if (roomForm) {
    roomForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedAmenities = [];
      document.querySelectorAll('input[name="roomAmenities"]:checked').forEach(cb => {
        selectedAmenities.push(cb.value);
      });

      const payload = {
        id: document.getElementById('roomId').value.trim() || undefined,
        name: document.getElementById('roomName').value.trim(),
        tagline: document.getElementById('roomTagline').value.trim(),
        rate_per_night: Number(document.getElementById('roomRate').value),
        max_guests: Number(document.getElementById('roomMaxGuests').value),
        inventory_units: Number(document.getElementById('roomTotalUnits').value),
        available_units: Number(document.getElementById('roomAvailUnits').value),
        bed_config: document.getElementById('roomBedConfig').value.trim(),
        room_size: document.getElementById('roomSize').value.trim(),
        view: document.getElementById('roomView').value.trim(),
        badge: document.getElementById('roomBadge').value.trim(),
        status: document.getElementById('roomStatus').value,
        featured: document.getElementById('roomFeatured').checked,
        image: document.getElementById('roomImage').value,
        amenities: selectedAmenities,
        posted_by: currentUser?.full_name || 'Hotel Admin'
      };

      try {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          closeModal();
          showToast(`Successfully published "${payload.name}" to website!`);
          loadData();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to save room.');
        }
      } catch (err) {
        alert('Server network error while saving room.');
      }
    });
  }

  // --- Search and Filter Listeners ---
  if (roomSearchInput) roomSearchInput.addEventListener('input', renderRooms);
  if (roomStatusFilter) roomStatusFilter.addEventListener('change', renderRooms);

  // --- Tabs Switching ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-tab');

      if (activeTab === 'rooms') {
        if (roomsContainer) roomsContainer.style.display = 'grid';
        if (reservationsContainer) reservationsContainer.style.display = 'none';
      } else {
        if (roomsContainer) roomsContainer.style.display = 'none';
        if (reservationsContainer) reservationsContainer.style.display = 'block';
      }
    });
  });

  // --- Room Size Automation (Strictly m²) ---
  function updateRoomSizeFromNum(sqmVal) {
    const roomSizeHidden = document.getElementById('roomSize');
    if (!sqmVal || isNaN(sqmVal) || parseFloat(sqmVal) <= 0) {
      if (roomSizeHidden) roomSizeHidden.value = '';
      return;
    }
    const sqm = parseFloat(sqmVal);
    if (roomSizeHidden) roomSizeHidden.value = `${sqm} m²`;
  }

  const roomSizeNum = document.getElementById('roomSizeNum');
  if (roomSizeNum) {
    roomSizeNum.addEventListener('input', (e) => {
      updateRoomSizeFromNum(e.target.value);
    });
  }

  // --- Luxury Checkbox Card Synchronization ---
  function syncCheckboxCards() {
    document.querySelectorAll('.amenity-check-card').forEach(card => {
      const cb = card.querySelector('input[type="checkbox"]');
      if (cb) {
        if (cb.checked) {
          card.classList.add('is-checked');
        } else {
          card.classList.remove('is-checked');
        }
      }
    });
  }

  document.querySelectorAll('.amenity-check-card input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', syncCheckboxCards);
  });

  // Init
  checkAuth();
  if (roomSizeNum && roomSizeNum.value) {
    updateRoomSizeFromNum(roomSizeNum.value);
  }
  syncCheckboxCards();
});
