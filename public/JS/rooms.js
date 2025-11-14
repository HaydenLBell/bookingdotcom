document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get("hotelID");

    fetch(`/PHP/getRooms.php?hotelID=${hotelId}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("hotelName").textContent = data.hotelName;
            document.getElementById("hotelAddress").textContent = data.address;

            const container = document.getElementById("roomTypeContainer");

            data.rooms.forEach(room => {
                const card = document.createElement("div");
                card.classList.add("room-card");

                // Pick image based on room type
                const roomImages = {
                    "Single": "/Resources/rooms/single.jpg",
                    "Double": "/Resources/rooms/double.jpg",
                    "Suite": "/Resources/rooms/suite.jpg",
                    "Deluxe": "/Resources/rooms/deluxe.jpg"
                };

                const imgSrc = roomImages[room.roomType] || "/Resources/rooms/default.jpg";

                card.innerHTML = `
                    <img src="${imgSrc}" alt="${room.roomType} Room">

                    <div class="room-info">
                        <h3>${room.roomType} Room</h3>

                        <div class="room-price">£${room.pricePerNight}/night</div>

                        <div class="room-status ${room.available ? 'available' : 'unavailable'}">
                            ${room.available ? "Available" : "Fully Booked"}
                        </div>

                        <button ${room.available ? "" : "disabled"}>
                            ${room.available ? "Reserve" : "Unavailable"}
                        </button>
                    </div>
                `;

                container.appendChild(card);
            });
        });
});
