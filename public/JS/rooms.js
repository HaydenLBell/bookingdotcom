document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelID = urlParams.get("hotelID");
    const hotelNameEl = document.getElementById("hotel-name");
    const hotelAddressEl = document.getElementById("hotel-address");
    const roomsGrid = document.getElementById("rooms-grid");

    if (!hotelID) {
        roomsGrid.innerHTML = "<p>No hotel selected.</p>";
        return;
    }

    // Fetch hotel and rooms
    fetch(`/api/hotels/${hotelID}`)
        .then(res => res.json())
        .then(data => {
            hotelNameEl.textContent = data.hotelName;
            hotelAddressEl.textContent = data.address;

            roomsGrid.innerHTML = "";

            data.rooms.forEach(room => {
                const card = document.createElement("div");
                card.classList.add("destination-card");
                card.innerHTML = `
                    <img src="../Resources/images/hotel-placeholder.png" alt="Room Image">
                    <h3>${room.roomType}</h3>
                    <p>Price per night: £${room.pricePerNight}</p>
                    <p>Available: ${room.available ? "Yes" : "No"}</p>
                    <form class="booking-form" data-roomid="${room.roomID}">
                        <label>Check-in: <input type="date" name="checkin" required></label>
                        <label>Nights: <input type="number" name="nights" min="1" value="1" required></label>
                        <button type="submit" ${!room.available ? "disabled" : ""}>Book Now</button>
                    </form>
                `;
                roomsGrid.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            roomsGrid.innerHTML = "<p>Failed to load rooms.</p>";
        });

    // Booking handler
    roomsGrid.addEventListener("submit", e => {
        e.preventDefault();
        const form = e.target.closest(".booking-form");
        if (!form) return;

        const roomID = form.dataset.roomid;
        const checkIn = form.checkin.value;
        const nights = form.nights.value;

        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            alert("You must log in to book a room.");
            return;
        }

        fetch("/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userID: storedUser.id,
                roomID,
                checkInDate: checkIn,
                numberOfNights: nights
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) alert(data.error);
            else {
                alert("Booking successful!");
                form.querySelector("button").disabled = true;
                form.closest(".destination-card").querySelector("p:nth-child(3)").textContent = "Available: No";
            }
        })
        .catch(err => {
            console.error(err);
            alert("Booking failed. Try again.");
        });
    });
});
