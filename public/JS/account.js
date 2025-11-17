document.addEventListener("DOMContentLoaded", () => {

// ----------------------------
// Load user from localStorage
// ----------------------------
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "/Pages/login.html";
}

console.log("Loaded user:", user);

// ----------------------------
// Populate account details
// ----------------------------
function fillAccountDetails() {
    const fullName = `${user.fname} ${user.lname}`;

    // Main details
    document.getElementById("acc-fname").textContent = user.fname;
    document.getElementById("acc-lname").textContent = user.lname;
    document.getElementById("acc-email").textContent = user.email;
    document.getElementById("acc-type").textContent = user.isAdmin ? "Admin" : "Standard User";

    // Side profile card
    document.getElementById("acc-name").textContent = fullName;
    document.getElementById("acc-email-2").textContent = user.email;

    const initial = user.fname ? user.fname[0].toUpperCase() : "?";
    document.getElementById("acc-initial").textContent = initial;
}

fillAccountDetails();

if (user.isAdmin){
    document.getElementById("tab-admin").style.display = "block";
}

// ----------------------------
// Logout
// ----------------------------
document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/Pages/login.html";
});

// ----------------------------
// Fetch & display bookings
// ----------------------------
async function loadBookings() {
    const list = document.getElementById("booking-list");
    list.innerHTML = `<div class="muted">Loading your bookings…</div>`;

    try {
        const res = await fetch(`/api/user/${user.id}/bookings`);
        const bookings = await res.json();

        if (!Array.isArray(bookings) || bookings.length === 0) {
            list.innerHTML = `<div class="muted">You have no bookings yet.</div>`;
            return;
        }

        list.innerHTML = ""; // clear

        for (const booking of bookings) {
            const card = document.createElement("div");
            card.classList.add("booking-card");

            card.innerHTML = `
                <h3>${booking.hotelName}</h3>
                <div class="booking-meta">
                    Room Type: <strong>${booking.roomType}</strong><br>
                    Address: ${booking.address}<br>
                    Check-in: ${booking.checkInDate}<br>
                    Nights: ${booking.numberOfNights}
                </div>

                <div class="booking-actions">
                    <button class="btn-small btn-edit" data-id="${booking.bookingID}">Edit</button>
                    <button class="btn-small btn-cancel" data-id="${booking.bookingID}">Cancel</button>
                </div>
            `;

            list.appendChild(card);
        }

        attachBookingButtons();

    } catch (err) {
        console.error(err);
        list.innerHTML = `<div class="muted">Error loading bookings.</div>`;
    }
}

loadBookings();

// ----------------------------
// Booking card buttons
// ----------------------------
function attachBookingButtons() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", async () => {
        const bookingID = btn.dataset.id;
        const userID = btn.dataset.userid;  

        const newDate = prompt("Enter new check-in date (YYYY-MM-DD):");
        const newNights = prompt("Enter number of nights:");

        if (!newDate || !newNights) return;

        try {
            const res = await fetch(`/api/bookings/${bookingID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userID: user.id,
                    checkInDate: newDate,
                    numberOfNights: Number(newNights)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert("Update failed: " + data.error);
                return;
            }

            alert("Booking updated successfully!");
            location.reload(); // reload bookings
        }
        catch (err) {
            console.error("Edit error:", err);
            alert("Failed to update booking");
        }
    });
});


    document.querySelectorAll(".btn-cancel").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            if (!confirm("Are you sure you want to cancel this booking?")) return;

            const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                loadBookings();
            } else {
                alert("Error cancelling booking.");
            }
        });
    });
}

// ----------------------------
// CHANGE PASSWORD
// ----------------------------

document.getElementById("btn-change-password").addEventListener("click", async () => {
    const current = document.getElementById("currentPassword").value.trim();
    const newPw = document.getElementById("newPassword").value.trim();
    const msg = document.getElementById("security-msg");

    if (!current || !newPw) {
        msg.textContent = "Both fields are required.";
        return;
    }

    try {
        const res = await fetch(`/api/user/change-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID: user.id, oldPassword: current, newPassword: newPw })
        });

        const data = await res.json();

        msg.textContent = data.success
            ? data.message
            : (data.error || "Failed to update password.");

        if (data.success) {
            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
        }
    } catch (err) {
        console.error(err);
        msg.textContent = "Error connecting to server.";
    }
});



// ----------------------------
// DELETE ACCOUNT
// ----------------------------
document.getElementById("btn-delete-account").addEventListener("click", async () => {
    const msg = document.getElementById("security-msg");

    if (!confirm("Are you SURE you want to permanently delete your account?")) return;

    try {
        const res = await fetch(`/api/user/${user.id}`, { method: "DELETE" });
        const data = await res.json();

        if (data.success) {
            localStorage.removeItem("user");
            window.location.href = "/Pages/login.html";
        } else {
            msg.textContent = data.error || "Could not delete account.";
        }
    } catch (err) {
        console.error(err);
        msg.textContent = "Error communicating with server.";
    }
});


// ----------------------------
// ADMIN: ADD HOTEL
// ----------------------------
document.getElementById("admin-add-hotel")?.addEventListener("click", async () => {
    const hotelName = document.getElementById("admin-hotel-name").value.trim();
    const address = document.getElementById("admin-hotel-address").value.trim();
    const msg = document.getElementById("admin-msg");

    if (!hotelName || !address) {
        msg.textContent = "Hotel name and address are required.";
        return;
    }

    try {
        const res = await fetch("/api/admin/hotel", {  // singular, matches server
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userID: user.id,       // include current user's ID for admin check
                hotelName, 
                address 
            })
        });

        const data = await res.json();

        msg.textContent = data.hotelID
            ? "Hotel successfully added!"
            : (data.error || "Failed to add hotel.");

        if (data.hotelID) {
            document.getElementById("admin-hotel-name").value = "";
            document.getElementById("admin-hotel-address").value = "";
        }

    } catch (err) {
        msg.textContent = "Error contacting server.";
        console.error(err);
    }
});


// ----------------------------
// ADMIN: ADD ROOM TYPE
// ----------------------------
document.getElementById("admin-add-room")?.addEventListener("click", async () => {

    const hotelID = document.getElementById("admin-room-hotel-id").value.trim();
    const roomType = document.getElementById("admin-room-type").value.trim();
    const quantity = document.getElementById("admin-room-quantity").value.trim();
    const pricePerNight = document.getElementById("admin-room-pricePerNight").value.trim();
    const msg = document.getElementById("admin-msg");


    

    if (!hotelID || !roomType || !quantity || !pricePerNight) {
        msg.textContent = "All fields are required.";
        return;
    }

    try {
        const res = await fetch(`/api/admin/hotel/${hotelID}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userID: user.id,
                roomType,
                pricePerNight,
                quantity,
                available: 1
            })
        });

        const data = await res.json();

        if (data.inserted) {
            msg.textContent = `Added ${data.inserted} rooms successfully!`;
            document.getElementById("admin-room-type").value = "";
            document.getElementById("admin-room-hotel-id").value = "";
            document.getElementById("admin-room-quantity").value = "";
            document.getElementById("admin-room-pricePerNight").value = "";
        } else {
            msg.textContent = data.error || "Failed to add rooms.";
        }

    } catch (err) {
        msg.textContent = "Error contacting server.";
        console.error(err);
    }
});




});