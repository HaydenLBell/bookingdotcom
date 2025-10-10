document.addEventListener("DOMContentLoaded", function() {
  // ===========================
  // NAV MENU TOGGLE
  // ===========================
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-links");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function () {
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
        if (btn.classList.contains("increase")) count++;
        else if (count > 0) count--;

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
  // STAR RATING LOGIC (Optional)
  // ===========================
  document.querySelectorAll(".rating span").forEach(star => {
    star.addEventListener("click", function() {
      let parent = this.parentElement;
      let allStars = parent.querySelectorAll("span");
      allStars.forEach(s => s.classList.remove("active"));
      this.classList.add("active");
      let index = Array.from(allStars).indexOf(this);
      for (let i = 0; i <= index; i++) {
        allStars[i].classList.add("active");
      }
    });
  });
});
