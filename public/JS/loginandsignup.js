document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signupForm');
    const su_errorMsg = document.getElementById('su_errorMsg');
    const li_errorMsg = document.getElementById('li_errorMsg');

    // SIGNUP FORM HANDLER
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fname = signupForm.fname.value;
            const lname = signupForm.lname.value;
            const email = signupForm.email.value;
            const password = signupForm.password.value;

            try {
                const res = await fetch('http://localhost:3000/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fname, lname, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('Account created successfully! Redirecting to login...');
                    window.location.href = '/Pages/login.html';
                } else {
                    su_errorMsg.textContent = data.error || 'Signup failed.';
                }
            } catch (err) {
                console.error(err);
                su_errorMsg.textContent = 'Server error. Try again later.';
            }
        });
    }

    // LOGIN FORM HANDLER
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const res = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user || { email }));
                    window.location.href = '/Pages/index.html';
                } else {
                    li_errorMsg.textContent = data.error || 'Login failed.';
                }

            } catch (err) {
                li_errorMsg.textContent = 'Server error. Try again later.';
                console.error(err);
            }
        });
    }

});
