document.addEventListener("DOMContentLoaded", function () {

  // ===========================
  // NAV MENU TOGGLE
  // ===========================
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-links");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  // ===========================
  // GUESTS DROPDOWN LOGIC
  // ===========================
  const guestsSection = document.getElementById("guestsSection");
  const guestsInput = document.getElementById("guests");
  const guestsDropdown = document.getElementById("guestsDropdown");

  if (guestsSection && guestsInput && guestsDropdown) {
    guestsInput.addEventListener("click", (e) => {
      e.stopPropagation();
      guestsDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!guestsSection.contains(e.target)) {
        guestsDropdown.classList.remove("active");
      }
    });

    guestsDropdown.addEventListener("click", (e) => e.stopPropagation());

    guestsDropdown.querySelectorAll(".increase, .decrease").forEach((btn) => {
      btn.addEventListener("click", () => {
        const countSpan = btn.parentElement.querySelector(".count");
        let count = parseInt(countSpan.textContent);

        if (btn.classList.contains("increase")) {
          count++;
        } else if (count > 0) {
          count--;
        }

        countSpan.textContent = count;
        updateGuestsInput();
      });
    });

    function updateGuestsInput() {
      const counts = {};
      guestsDropdown.querySelectorAll(".count").forEach((span) => {
        counts[span.dataset.type] = parseInt(span.textContent);
      });

      const parts = [];
      if (counts.adults > 0) parts.push(`${counts.adults} adult${counts.adults > 1 ? "s" : ""}`);
      if (counts.children > 0) parts.push(`${counts.children} child${counts.children > 1 ? "ren" : ""}`);
      if (counts.infants > 0) parts.push(`${counts.infants} infant${counts.infants > 1 ? "s" : ""}`);
      if (counts.pets > 0) parts.push(`${counts.pets} pet${counts.pets > 1 ? "s" : ""}`);

      guestsInput.value = parts.length > 0 ? parts.join(", ") : "Add guests";
    }
  }

  // ===========================
  // SEARCH BAR FILTER LOGIC
  // ===========================
  const searchInput = document.getElementById("searchBar");
  const destinationCards = document.querySelectorAll(".destination-card");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const query = searchInput.value.toLowerCase();

      destinationCards.forEach(card => {
        const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const description = card.querySelector("p")?.textContent.toLowerCase() || "";
        const altText = card.querySelector("img")?.alt.toLowerCase() || "";

        if (
          title.includes(query) ||
          description.includes(query) ||
          altText.includes(query)
        ) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  // ===========================
  // USER NAVBAR LOGIC
  // ===========================
  const storedUser = JSON.parse(localStorage.getItem('user'));

  if (storedUser && navMenu) {
    const loginItem = [...navMenu.children].find(li => li.textContent.includes('Log-in'));
    if (loginItem) navMenu.removeChild(loginItem);

    const accountItem = document.createElement('li');
    accountItem.innerHTML = `<a href="/Pages/account.html">Account (${storedUser.fname || storedUser.email})</a>`;
    navMenu.appendChild(accountItem);

    const logoutItem = document.createElement('li');
    logoutItem.innerHTML = `<a href="#" id="logout-link">Logout</a>`;
    navMenu.appendChild(logoutItem);

    document.getElementById('logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      window.location.reload();
    });
  }

  // ===========================
  // CLICKABLE CARDS — ALWAYS ENABLED
  // ===========================
  function makeCardsClickable(selector, getCity) {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener("click", () => {
        const city = getCity(card);
        if (!city) return;
        window.location.href = `/Pages/listings.html?city=${encodeURIComponent(city)}`;
      });
    });
  }

  makeCardsClickable(".trend-card", card => card.querySelector("h3")?.textContent.trim());
  makeCardsClickable(".recent-card", card => card.textContent.trim());
  makeCardsClickable(".destination-card", card => card.querySelector("h3")?.textContent.trim());

});
