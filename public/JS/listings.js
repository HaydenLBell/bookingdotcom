document.addEventListener("DOMContentLoaded", () => {
    const hotelContainer = document.getElementById("hotel-container");
    const filterCity = document.getElementById("filterCity");
    const sortPrice = document.getElementById("sortPrice");

    let hotels = [];

    // ✅ Fetch hotel data
    async function loadHotels() {
        const res = await fetch("/api/hotels");
        hotels = await res.json();
        populateCityFilter();
        renderHotels(hotels);
    }

    // ✅ Populate unique cities
    function populateCityFilter() {
        const cities = [...new Set(hotels.map(h => extractCity(h.address)))];

        cities.forEach(city => {
            const opt = document.createElement("option");
            opt.value = city;
            opt.textContent = city;
            filterCity.appendChild(opt);
        });
    }

    // ✅ Extract city from address
    function extractCity(address) {
        if (!address) return "Unknown";
        return address.split(",")[1]?.trim() || address.trim();
    }

    // ✅ Render hotel cards
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

    // ✅ Apply Filters + Sorting
    filterCity.addEventListener("change", () => {
        let filtered = hotels;

        if (filterCity.value !== "all") {
            filtered = hotels.filter(h => extractCity(h.address) === filterCity.value);
        }

        renderHotels(applySort(filtered));
    });

    sortPrice.addEventListener("change", () => {
        renderHotels(applySort(hotels));
    });

    function applySort(list) {
        if (sortPrice.value === "asc") {
            return [...list].sort((a, b) => a.minPrice - b.minPrice);
        }
        if (sortPrice.value === "desc") {
            return [...list].sort((a, b) => b.minPrice - a.minPrice);
        }
        return list;
    }

    loadHotels();
});
