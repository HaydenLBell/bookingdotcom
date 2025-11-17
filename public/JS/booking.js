document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ booking.js loaded");

    const urlParams = new URLSearchParams(window.location.search);
    const roomID = urlParams.get("roomID");
    console.log("Room ID:", roomID);

    if (!roomID) {
        alert("No room selected.");
        return;
    }

    // Fetch room details
    const res = await fetch(`/api/room/${roomID}`);
    const room = await res.json();
    console.log("Room data:", room);

    document.getElementById("hotelName").textContent = room.hotelName;
    document.getElementById("roomType").textContent = room.roomType;
    document.getElementById("price").textContent = `£${room.pricePerNight} per night`;

    const bookingForm = document.getElementById("bookingForm");

    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Booking form submitted");

        // Load logged-in user
        const storedUser = JSON.parse(localStorage.getItem("user"));
        console.log("Loaded user:", storedUser);

        if (!storedUser || storedUser.id == null) {
            alert("You must be logged in to book a room.");
            return;
        }

        const userID = storedUser.id;  

        const checkInDate = document.getElementById("checkInDate").value;
        const numberOfNights = parseInt(document.getElementById("numberOfNights").value);

        console.log("Check-in:", checkInDate);
        console.log("Nights:", numberOfNights);

        // Correct validation
        if (!checkInDate || !numberOfNights || numberOfNights < 1) {
            alert("All fields required");
            return;
        }

        // Send booking request
        const response = await fetch("/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID, roomID, checkInDate, numberOfNights })
        });

        const data = await response.json();
        console.log("Booking response:", data);

        if (response.ok) {
            document.getElementById("bookingMessage").textContent =
                `Booking confirmed! Booking ID: ${data.bookingID}`;
            alert('Booking confirmed! Redirecting to home page...');
            window.location.href = '/Pages/index.html';
        } else {
            document.getElementById("bookingMessage").textContent =
                `Booking failed: ${data.error}`;
        }
    });
});
