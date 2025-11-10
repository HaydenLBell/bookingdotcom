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

        // Group rooms by type
        const groupedRooms = {};
        data.rooms.forEach(room => {
            if (!groupedRooms[room.roomType]) {
                groupedRooms[room.roomType] = { total: 0, available: 0 };
            }
            groupedRooms[room.roomType].total++;
            if (room.available) groupedRooms[room.roomType].available++;
        });

        const container = document.getElementById("roomTypeContainer");
        container.innerHTML = "";

        // Create cards
        Object.entries(groupedRooms).forEach(([type, info]) => {
            const card = document.createElement("div");
            card.classList.add("room-type-card");

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

        // Booking click handler
        container.addEventListener("click", async (e) => {
            if (!e.target.matches("button[data-type]")) return;

            const roomType = e.target.dataset.type;

            // Find first available room of that type
            const availableRoom = data.rooms.find(
                room => room.roomType === roomType && room.available == 1
            );

            if (!availableRoom) {
                alert("Sorry, no rooms available of this type.");
                return;
            }

            // Redirect to booking page
            window.location.href = `/Pages/booking.html?roomID=${availableRoom.roomID}`;
        });

    } catch (err) {
        console.error(err);
        alert("An error occurred while loading rooms. Please try again later.");
    }
});
