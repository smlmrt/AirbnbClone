const AUTH_API_URL = "http://localhost:5019/api/auth";

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            firstName: document.getElementById("regFirstName").value,
            lastName: document.getElementById("regLastName").value,
            email: document.getElementById("regEmail").value,
            password: document.getElementById("regPassword").value
        };

        const res = await fetch(`${AUTH_API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("Kayıt başarılı! Lütfen giriş yapın.");
            window.location.href = "login.html";
        } else {
            alert("Kayıt başarısız. E-posta kullanımda olabilir.");
        }
    });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            email: document.getElementById("loginEmail").value,
            password: document.getElementById("loginPassword").value
        };

        const res = await fetch(`${AUTH_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const result = await res.json();
            localStorage.setItem("token", result.token);
            window.location.href = "index.html"; // Başarılı girişte ana sayfaya yönlendir
        } else {
            alert("E-posta veya şifre hatalı!");
        }
    });
}