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
      const statusClass = room.status === 'available' ? 'status-badge-available' :
                          room.status === 'maintenance' ? 'status-badge-maintenance' : 'status-badge-soldout';
      const statusText = room.status === 'available' ? '● Available' :
                         room.status === 'maintenance' ? '▲ Maintenance' : '✕ Sold Out';

      const pctUnits = room.inventory_units > 0 ? Math.round(((room.available_units || 0) / room.inventory_units) * 100) : 0;

      return `
        <div class="admin-room-card" data-room-id="${room.id}">
          <div class="admin-room-media">
            <img src="${room.image || 'assets/images/deluxe-room.svg'}" alt="${room.name}" />
            ${room.badge ? `<span class="room-badge-overlay">${room.badge}</span>` : ''}
            <span class="room-status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="admin-room-content">
            <div class="admin-room-title-row">
              <h3 class="admin-room-name">${room.name}</h3>
              <div class="admin-room-rate">₱${Number(room.rate_per_night).toLocaleString()} <span>/ night</span></div>
            </div>
            <p class="admin-room-tagline">${room.tagline || 'Comfortable boutique accommodation.'}</p>
            
            <div class="admin-room-specs">
              <span class="spec-item">👥 Up to ${room.max_guests} guests</span>
              <span class="spec-item">🛏 ${room.bed_config || 'King bed'}</span>
              <span class="spec-item">📐 ${room.room_size || '40 m²'}</span>
              <span class="spec-item">🌿 ${room.view || 'Courtyard'}</span>
            </div>

            <div class="admin-room-inventory-bar">
              <div class="inventory-meta">
                <span>Inventory Units: ${room.available_units || 0} / ${room.inventory_units} Available</span>
                <span>${pctUnits}%</span>
              </div>
              <div class="inventory-progress-track">
                <div class="inventory-progress-fill" style="width: ${pctUnits}%"></div>
              </div>
            </div>

            <div class="admin-room-actions">
              <button class="btn-card-action btn-edit-room" onclick="window.editRoom('${room.id}')">✏ Edit Details</button>
              <button class="btn-card-action btn-toggle-status" onclick="window.toggleRoomStatus('${room.id}')">
                ${room.status === 'available' ? 'Set Maintenance' : 'Set Available'}
              </button>
              <button class="btn-card-action btn-delete-room" onclick="window.deleteRoom('${room.id}', '${room.name}')">🗑 Unpublish</button>
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
    document.getElementById('roomSize').value = room.room_size || '';
    document.getElementById('roomView').value = room.view || '';
    document.getElementById('roomBadge').value = room.badge || '';
    document.getElementById('roomStatus').value = room.status || 'available';
    document.getElementById('roomFeatured').checked = !!room.featured;
    document.getElementById('roomImage').value = room.image || 'assets/images/deluxe-room.svg';

    // Set amenities
    const checkBoxes = document.querySelectorAll('input[name="roomAmenities"]');
    checkBoxes.forEach(cb => {
      cb.checked = (room.amenities || []).includes(cb.value);
    });

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

  // Init
  checkAuth();
});
