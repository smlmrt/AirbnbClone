const AUTH_API_URL = "http://localhost:5019/api/auth";

// Kayıt Formu
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            firstName: document.getElementById("regFirstName").value,
            lastName:  document.getElementById("regLastName").value,
            email:     document.getElementById("regEmail").value,
            password:  document.getElementById("regPassword").value
        };

        try {
            const res = await fetch(`${AUTH_API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
                window.location.href = "login.html";
            } else {
                const errorText = await res.text();
                alert(`Kayıt başarısız: ${errorText || "Bu e-posta adresi zaten kullanımda olabilir."}`);
            }
        } catch (error) {
            console.error("Kayıt hatası:", error);
            alert("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
        }
    });
}

// Giriş Formu
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            email:    document.getElementById("loginEmail").value,
            password: document.getElementById("loginPassword").value
        };

        try {
            const res = await fetch(`${AUTH_API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const result = await res.json();
                localStorage.setItem("token", result.token);
                window.location.href = "index.html";
            } else {
                alert("E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.");
            }
        } catch (error) {
            console.error("Giriş hatası:", error);
            alert("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
        }
    });
}