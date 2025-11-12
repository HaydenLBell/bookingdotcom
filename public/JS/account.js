// /public/JS/account.js
document.addEventListener('DOMContentLoaded', () => {
  // Elements and containers
  const tabProfileBtn = createEl('button', { className: 'tab-btn active', textContent: 'Profile' });
  const tabBookingsBtn = createEl('button', { className: 'tab-btn', textContent: 'Bookings' });
  const tabSettingsBtn = createEl('button', { className: 'tab-btn', textContent: 'Settings' });

  const tabsBar = createEl('div', { id: 'tabsBar', className: 'tabs-bar' });
  tabsBar.append(tabProfileBtn, tabBookingsBtn, tabSettingsBtn);

  const root = document.querySelector('section') ?? document.body;
  // Create main container if not present
  let main = document.getElementById('accountMain');
  if (!main) {
    main = createEl('div', { id: 'accountMain', className: 'account-main', style: 'padding:40px 10%;' });
    root.prepend(main);
  }
  main.prepend(tabsBar);

  // Profile panel
  const profilePanel = createEl('div', { id: 'profilePanel', className: 'panel active' });
  profilePanel.innerHTML = `
    <div class="card" id="accountCard" style="padding:20px; max-width:800px; margin-bottom:24px;">
      <h2>Your Details</h2>
      <p><strong>Name:</strong> <span id="accName">-</span></p>
      <p><strong>Email:</strong> <span id="accEmail">-</span></p>
      <p><strong>User ID:</strong> <span id="accUserID">-</span></p>
      <p><strong>Role:</strong> <span id="accRole">-</span></p>
    </div>
  `;

  // Bookings panel
  const bookingsPanel = createEl('div', { id: 'bookingsPanel', className: 'panel', style: 'display:none;' });
  bookingsPanel.innerHTML = `
    <h2>Your Bookings</h2>
    <p id="noBookings" style="display:none;">You have no bookings yet.</p>
    <div id="bookingsList" class="destination-grid" style="margin-top:12px;"></div>
  `;

  // Settings panel (change password + delete account)
  const settingsPanel = createEl('div', { id: 'settingsPanel', className: 'panel', style: 'display:none; max-width:700px;' });
  settingsPanel.innerHTML = `
    <h2>Settings</h2>

    <section class="card" style="padding:16px; margin-bottom:18px;">
      <h3>Change Password</h3>
      <form id="changePasswordForm" class="booking-form" style="max-width:420px;">
        <label for="oldPassword">Current Password</label>
        <input type="password" id="oldPassword" required>
        <label for="newPassword">New Password</label>
        <input type="password" id="newPassword" required>
        <label for="confirmNewPassword">Confirm New Password</label>
        <input type="password" id="confirmNewPassword" required>
        <button type="submit">Change Password</button>
        <p id="changePasswordMsg" style="margin-top:10px;"></p>
      </form>
    </section>

    <section class="card" style="padding:16px;">
      <h3>Danger Zone — Delete Account</h3>
      <p>Deleting your account will remove your user record and ALL bookings. This cannot be undone.</p>
      <label for="confirmDelete">Type your email to confirm:</label>
      <input id="confirmDelete" placeholder="your@email.com" />
      <button id="deleteAccountBtn" style="background:#ff4d4d; color:white; margin-top:8px;">Delete account</button>
      <p id="deleteAccountMsg" style="margin-top:10px;"></p>
    </section>
  `;

  main.append(profilePanel, bookingsPanel, settingsPanel);

  // Helper: create element
  function createEl(tag, props = {}) {
    const el = document.createElement(tag);
    Object.keys(props).forEach(k => {
      if (k === 'textContent' || k === 'innerHTML') el[k] = props[k];
      else el.setAttribute(k, props[k]);
    });
    return el;
  }

  // Tabs behavior
  const tabs = {
    Profile: profilePanel,
    Bookings: bookingsPanel,
    Settings: settingsPanel
  };

  function activateTab(name) {
    // buttons
    [tabProfileBtn, tabBookingsBtn, tabSettingsBtn].forEach(b => b.classList.remove('active'));
    if (name === 'Profile') tabProfileBtn.classList.add('active');
    if (name === 'Bookings') tabBookingsBtn.classList.add('active');
    if (name === 'Settings') tabSettingsBtn.classList.add('active');

    // panels
    Object.entries(tabs).forEach(([k, panel]) => {
      if (k === name) {
        panel.style.display = '';
      } else {
        panel.style.display = 'none';
      }
    });
  }

  tabProfileBtn.addEventListener('click', () => activateTab('Profile'));
  tabBookingsBtn.addEventListener('click', () => { activateTab('Bookings'); loadBookings(); });
  tabSettingsBtn.addEventListener('click', () => activateTab('Settings'));

  // Load logged-in user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user'));
  if (!storedUser || (storedUser.id == null && storedUser.userID == null)) {
    // Not logged in
    document.getElementById('accountCard').innerHTML = `
      <h3>Please log in</h3>
      <p>You must be logged in to view your account. <a href="/Pages/login.html">Login</a></p>
    `;
    return;
  }

  const userID = storedUser.id ?? storedUser.userID;
  // Fill profile details
  document.getElementById('accName').textContent = `${storedUser.fname ?? ''} ${storedUser.lname ?? ''}`;
  document.getElementById('accEmail').textContent = storedUser.email ?? '-';
  document.getElementById('accUserID').textContent = userID;
  document.getElementById('accRole').textContent = storedUser.isAdmin ? 'Admin' : 'User';

  // ---------------------------
  // Bookings: load + render
  // ---------------------------
  async function loadBookings() {
    const list = document.getElementById('bookingsList');
    const noBookings = document.getElementById('noBookings');
    list.innerHTML = '';
    noBookings.style.display = 'none';

    try {
      const res = await fetch(`/api/user/${userID}/bookings`);
      if (!res.ok) throw new Error('Failed fetching bookings');
      const rows = await res.json();

      if (!rows || rows.length === 0) {
        noBookings.style.display = '';
        return;
      }

      rows.forEach(b => {
        const card = document.createElement('div');
        card.className = 'destination-card';
        card.style.padding = '14px';
        card.style.background = '#A6A3AF';
        card.style.borderRadius = '12px';

        card.innerHTML = `
          <h3>${escapeHtml(b.hotelName)}</h3>
          <p><strong>Room:</strong> ${escapeHtml(b.roomType)} — £${b.pricePerNight} / night</p>
          <p><strong>Check-in:</strong> ${b.checkInDate} • <strong>Nights:</strong> ${b.numberOfNights}</p>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="edit-booking" data-bookingid="${b.bookingID}">Edit</button>
            <button class="cancel-booking" data-bookingid="${b.bookingID}" style="background:#ff5c5c;color:white;">Cancel</button>
          </div>

          <div class="edit-area" data-bookingid="${b.bookingID}" style="display:none; margin-top:12px;">
            <label>New check-in</label>
            <input type="date" class="edit-checkin" />
            <label>New nights</label>
            <input type="number" min="1" class="edit-nights" />
            <div style="margin-top:8px;">
              <button class="save-edit" data-bookingid="${b.bookingID}">Save</button>
              <button class="cancel-edit" data-bookingid="${b.bookingID}">Close</button>
            </div>
            <p class="edit-msg" style="margin-top:8px;"></p>
          </div>
        `;

        list.appendChild(card);
      });

      // Add listeners (delegation)
      list.querySelectorAll('.edit-booking').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.bookingid;
          const editArea = list.querySelector(`.edit-area[data-bookingid="${id}"]`);
          if (editArea) editArea.style.display = '';
        });
      });

      list.querySelectorAll('.cancel-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.bookingid;
          const editArea = list.querySelector(`.edit-area[data-bookingid="${id}"]`);
          if (editArea) {
            editArea.style.display = 'none';
            editArea.querySelector('.edit-msg').textContent = '';
          }
        });
      });

      list.querySelectorAll('.save-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const bookingID = e.currentTarget.dataset.bookingid;
          const editArea = list.querySelector(`.edit-area[data-bookingid="${bookingID}"]`);
          const newCheckin = editArea.querySelector('.edit-checkin').value;
          const newNights = parseInt(editArea.querySelector('.edit-nights').value, 10);

          if (!newCheckin || !newNights) {
            editArea.querySelector('.edit-msg').textContent = 'Please provide both fields.';
            return;
          }

          try {
            const res = await fetch(`/api/bookings/${bookingID}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userID, checkInDate: newCheckin, numberOfNights: newNights })
            });
            const j = await res.json();
            if (!res.ok) {
              editArea.querySelector('.edit-msg').textContent = j.error || 'Failed to update.';
            } else {
              editArea.querySelector('.edit-msg').textContent = 'Updated — reloading...';
              setTimeout(loadBookings, 800);
            }
          } catch (err) {
            editArea.querySelector('.edit-msg').textContent = 'Network error.';
            console.error(err);
          }
        });
      });

      list.querySelectorAll('.cancel-booking').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const bookingID = e.currentTarget.dataset.bookingid;
          if (!confirm('Cancel this booking?')) return;
          try {
            const res = await fetch(`/api/bookings/${bookingID}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userID })
            });
            const j = await res.json();
            if (!res.ok) alert(j.error || 'Failed to cancel');
            else {
              alert('Booking cancelled');
              loadBookings();
            }
          } catch (err) {
            console.error(err);
            alert('Network error');
          }
        });
      });

    } catch (err) {
      console.error('Load bookings failed', err);
      document.getElementById('noBookings').textContent = 'Failed to load bookings.';
      document.getElementById('noBookings').style.display = '';
    }
  }

  // Escape helper
  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
  }

  // ---------------------------
  // Settings: change password
  // ---------------------------
  const changeForm = document.getElementById('changePasswordForm');
  if (changeForm) {
    changeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('changePasswordMsg');
      msg.textContent = '';

      const oldP = document.getElementById('oldPassword').value.trim();
      const newP = document.getElementById('newPassword').value.trim();
      const confirmP = document.getElementById('confirmNewPassword').value.trim();

      if (!oldP || !newP || !confirmP) {
        msg.textContent = 'All fields required';
        return;
      }
      if (newP.length < 6) {
        msg.textContent = 'New password must be at least 6 characters';
        return;
      }
      if (newP !== confirmP) {
        msg.textContent = 'New passwords do not match';
        return;
      }

      // Call server endpoint (you must add this route server-side)
      try {
        const res = await fetch('/api/user/change-password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID, oldPassword: oldP, newPassword: newP })
        });
        const j = await res.json();
        if (!res.ok) {
          msg.textContent = j.error || 'Failed to change password';
        } else {
          msg.style.color = 'lightgreen';
          msg.textContent = 'Password changed successfully';
          changeForm.reset();
        }
      } catch (err) {
        console.error(err);
        msg.textContent = 'Network error';
      }
    });
  }

  // ---------------------------
  // Settings: delete account
  // ---------------------------
  const deleteBtn = document.getElementById('deleteAccountBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmInput = document.getElementById('confirmDelete').value.trim();
      const msg = document.getElementById('deleteAccountMsg');
      msg.textContent = '';

      if (!confirmInput) {
        msg.textContent = 'Please type your email to confirm';
        return;
      }
      if (confirmInput !== (storedUser.email ?? '')) {
        msg.textContent = 'Email mismatch';
        return;
      }

      if (!confirm('This will delete your account and bookings permanently. Continue?')) return;

      try {
        const res = await fetch(`/api/user/${userID}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID }) // server may require body confirmation
        });
        const j = await res.json();
        if (!res.ok) {
          msg.textContent = j.error || 'Failed to delete';
        } else {
          // logout and redirect
          localStorage.removeItem('user');
          alert('Account deleted. Redirecting to homepage.');
          window.location.href = '/Pages/index.html';
        }
      } catch (err) {
        console.error(err);
        msg.textContent = 'Network error';
      }
    });
  }

  // initial load: show profile
  activateTab('Profile');

});
