document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelID = urlParams.get("hotelID");

    if (!hotelID) {
        alert("No hotel selected.");
        return;
    }

    try {
        // Fetch hotel + rooms data
        const response = await fetch(`/api/hotels/${hotelID}`);
        if (!response.ok) throw new Error("Failed to fetch hotel data");

        const data = await response.json();

        // Fill header info
        document.getElementById("hotelName").textContent = data.hotelName;
        document.getElementById("hotelAddress").textContent = data.address;

        const container = document.getElementById("roomTypeContainer");
        container.innerHTML = "";

        // Room images mapping
        const roomImages = {
            "Single": "/Resources/images/rooms/single.jpg",
            "Double": "/Resources/images/rooms/double.jpg",
            "Suite": "/Resources/images/rooms/suite.jpg",
            "Deluxe": "/Resources/images/rooms/deluxe.jpg"
        };

        // Group rooms by type
        const groupedRooms = {};
        data.rooms.forEach(room => {
            if (!groupedRooms[room.roomType]) {
                groupedRooms[room.roomType] = [];
            }
            groupedRooms[room.roomType].push(room);
        });

        // Create cards
        Object.entries(groupedRooms).forEach(([type, rooms]) => {
            const availableCount = rooms.filter(r => r.available).length;
            const isAvailable = availableCount > 0;
            const firstAvailableRoom = rooms.find(r => r.available);

            const card = document.createElement("div");
            card.classList.add("room-card");

            card.innerHTML = `
                <img src="${roomImages[type] || '/Resources/rooms/default.jpg'}" alt="${type} Room">
                <div class="room-info">
                    <h3>${type} Room</h3>
                    <div class="room-price">£${Math.min(...rooms.map(r => r.pricePerNight))}/night</div>
                    <div class="room-status ${isAvailable ? 'available' : 'unavailable'}">
                        ${isAvailable ? availableCount + ' available' : 'Fully booked'}
                    </div>
                    <button ${isAvailable ? "" : "disabled"} data-room-id="${firstAvailableRoom?.roomID || ''}">
                        ${isAvailable ? "Book Now" : "Unavailable"}
                    </button>
                </div>
            `;

            container.appendChild(card);
        });

        // Booking click handler
        container.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-room-id]");
            if (!btn || !btn.dataset.roomId) return;

            const roomID = btn.dataset.roomId;
            window.location.href = `/Pages/booking.html?roomID=${roomID}`;
        });

    } catch (err) {
        console.error(err);
        alert("An error occurred while loading rooms. Please try again later.");
    }
});
