document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelID = urlParams.get("hotelID");

    if (!hotelID) {
        alert("No hotel selected.");
        return;
    }

    // Fetch all rooms for this hotel
    const response = await fetch(`/api/hotel/${hotelID}/rooms`);
    const data = await response.json();

    // Header information
    document.getElementById("hotelName").textContent = data.hotelName;
    document.getElementById("hotelAddress").textContent = data.address;

    // Group rooms by roomType
    const grouped = {};

    data.rooms.forEach(room => {
        if (!grouped[room.roomType]) {
            grouped[room.roomType] = { total: 0, available: 0 };
        }
        grouped[room.roomType].total++;
        if (room.available) grouped[room.roomType].available++;
    });

    const container = document.getElementById("roomTypeContainer");
    container.innerHTML = "";

    Object.entries(grouped).forEach(([type, info]) => {
        const card = document.createElement("div");
        card.classList.add("room-card");

        const isAvailable = info.available > 0;

        card.innerHTML = `
            <h3>${type}</h3>
            <p><strong>Available:</strong> ${info.available > 0 ? info.available : "Unavailable"}</p>
            <button ${isAvailable ? "" : "disabled"} data-type="${type}">
                ${isAvailable ? "Book Now" : "Unavailable"}
            </button>
        `;

        container.appendChild(card);
    });

    // Booking handler — books *first available* room of that type
    container.addEventListener("click", async (e) => {
        if (!e.target.matches("button[data-type]")) return;

        const roomType = e.target.dataset.type;

        // Find the first available room of that type
        const availableRoom = data.rooms.find(
            room => room.roomType === roomType && room.available == 1
        );

        if (!availableRoom) {
            alert("Sorry, no rooms available of this type.");
            return;
        }

        // Redirect to booking page (or popup)
        window.location.href = `/Pages/booking.html?roomID=${availableRoom.roomID}`;
    });
});
