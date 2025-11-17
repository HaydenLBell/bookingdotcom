// public/JS/listings.js
document.addEventListener("DOMContentLoaded", () => {
    const hotelContainer = document.getElementById("hotel-container");
    const filterCity = document.getElementById("filterCity");
    const sortPrice = document.getElementById("sortPrice");
    const searchBtn = document.querySelector(".search-btn");
    const whereInput = document.getElementById("where");

    let hotels = [];

    // Read URL parameters
    const params = new URLSearchParams(window.location.search);
    const initialCityFilter = params.get("city"); // e.g. "Paris"

    // roomType -> capacity mapping (Option B)
    const roomCapacity = {
        "Single": 1,
        "Double": 2,
        "Deluxe": 3,
        "Suite": 5
    };

    // Fetch hotel data (basic + minPrice)
    async function loadHotels() {
        const res = await fetch("/api/hotels");
        hotels = await res.json();

        populateCityFilter();

        // If listings.html?city=Something → auto filter
        if (initialCityFilter && initialCityFilter !== "all") {
            filterCity.value = initialCityFilter; // set dropdown
            await applyFiltersAndRender();
        } else {
            await applyFiltersAndRender();
        }
    }

    // Populate unique cities
    function populateCityFilter() {
        // Avoid duplicates and sort
        const cities = [...new Set(hotels.map(h => extractCity(h.address)))].filter(Boolean).sort();

        // ensure default option exists
        filterCity.innerHTML = `<option value="all">Filter by City</option>`;
        cities.forEach(city => {
            const opt = document.createElement("option");
            opt.value = city;
            opt.textContent = city;
            filterCity.appendChild(opt);
        });

        // if initial filter present, try to select it
        if (initialCityFilter) {
            const match = [...filterCity.options].find(o => o.value.toLowerCase() === initialCityFilter.toLowerCase());
            if (match) filterCity.value = match.value;
        }
    }

    // ✅ Extract city from address (expects "street, City, Country")
    function extractCity(address) {
        if (!address) return "Unknown";
        const parts = address.split(",").map(p => p.trim());
        // city is likely the second element
        return parts[1] || parts[0] || "Unknown";
    }

    function extractCountry(address) {
        if (!address) return "";
        const parts = address.split(",").map(p => p.trim());
        return parts[2] || "";
    }

    // returns true if hotel has >=1 room available with capacity >= totalGuests
    async function hotelHasRoomForGuests(hotel, totalGuests) {
        try {
            const res = await fetch(`/api/hotel/${hotel.hotelID}/rooms`);
            if (!res.ok) return false;
            const data = await res.json();
            if (!Array.isArray(data.rooms)) return false;

            // look for any room where available && capacity >= totalGuests
            return data.rooms.some(r => {
                const cap = roomCapacity[r.roomType] || 0;
                return (r.available == 1 || r.available === 1 || r.available === true) && cap >= totalGuests;
            });
        } catch (err) {
            console.error("Error fetching rooms for hotel:", hotel.hotelID, err);
            return false;
        }
    }

    // Render hotel cards
    function renderHotels(list) {
        hotelContainer.innerHTML = "";

        if (list.length === 0) {
            hotelContainer.innerHTML = "<p>No hotels found.</p>";
            return;
        }

        list.forEach(hotel => {
            const hotelCard = document.createElement("div");
            hotelCard.classList.add("destination-card");

            hotelCard.innerHTML = `
                <img src="../Resources/images/hotel_placeholder.jpg" alt="Hotel Image">
                <h3>${hotel.hotelName}</h3>
                <p>${hotel.address}</p>
                <p><strong>From £${hotel.minPrice}</strong> / night</p>

                <button class="view-rooms-btn"
                        onclick="window.location.href='/Pages/rooms.html?hotelID=${hotel.hotelID}'">
                    View Rooms
                </button>
            `;

            hotelContainer.appendChild(hotelCard);
        });
    }

    // Run full filter pipeline (city + where + guests + sort)
    async function applyFiltersAndRender() {
        hotelContainer.innerHTML = `<p class="muted">Loading hotels…</p>`;

        // start from master list
        let list = hotels.slice();

        // city dropdown filter
        if (filterCity && filterCity.value && filterCity.value !== "all") {
            list = list.filter(h => extractCity(h.address) === filterCity.value);
        }

        // text search (where input) — match city or country or hotel name
        const where = whereInput?.value?.trim().toLowerCase();
        if (where) {
            list = list.filter(h => {
                return h.hotelName.toLowerCase().includes(where)
                    || extractCity(h.address).toLowerCase().includes(where)
                    || extractCountry(h.address).toLowerCase().includes(where);
            });
        }

        // total guests from app.js helper (falls back to 0)
        const totalGuests = (window.getTotalGuestsFromSearch && typeof window.getTotalGuestsFromSearch === 'function')
            ? window.getTotalGuestsFromSearch()
            : 0;

        // If no guests selected, don't filter by capacity.
        if (totalGuests > 0) {
            // check each hotel for rooms that fit. This will make multiple requests, so run them concurrently
            const checks = await Promise.all(list.map(h => hotelHasRoomForGuests(h, totalGuests)));
            list = list.filter((h, idx) => checks[idx]);
        }

        // apply sorting
        list = applySort(list);

        renderHotels(list);
    }

    // Sorting logic (works on current filtered list)
    function applySort(list) {
        if (sortPrice.value === "asc") {
            return [...list].sort((a, b) => a.minPrice - b.minPrice);
        }
        if (sortPrice.value === "desc") {
            return [...list].sort((a, b) => b.minPrice - a.minPrice);
        }
        return list;
    }

    // Handlers
    filterCity.addEventListener("change", applyFiltersAndRender);
    sortPrice.addEventListener("change", applyFiltersAndRender);
    if (searchBtn) searchBtn.addEventListener("click", applyFiltersAndRender);

    // Also handle Enter key on the where input
    const whereBox = document.getElementById('where');
    whereBox?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFiltersAndRender();
        }
    });

    // initial load
    loadHotels();
});
