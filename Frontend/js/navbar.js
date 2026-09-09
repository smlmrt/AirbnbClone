// ─── Ortak Navbar Yetki Kontrolü ───
// Bu dosya tüm HTML sayfalarında kullanılır.

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function checkNavbarAuth() {
    const token = localStorage.getItem("token");

    const userNameDisplay = document.getElementById("userNameDisplay");
    const addListingBtn   = document.getElementById("addListingBtn");
    const favoritesBtn    = document.getElementById("favoritesBtn");
    const myListingsBtn   = document.getElementById("myListingsBtn");
    const myTripsBtn      = document.getElementById("myTripsBtn");
    const profileBtn      = document.getElementById("profileBtn");
    const adminPanelBtn   = document.getElementById("adminPanelBtn");
    const logoutBtn       = document.getElementById("logoutBtn");
    const loginBtn        = document.getElementById("loginBtn");
    const registerBtn     = document.getElementById("registerBtn");

    if (token) {
        const decodedToken = parseJwt(token);
        if (!decodedToken) return;

        const userName = decodedToken.unique_name
            || decodedToken.name
            || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]
            || "Kullanıcı";

        const role = decodedToken.role
            || decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
            || "Guest";

        if (userNameDisplay) {
            userNameDisplay.innerText = `Merhaba, ${userName}`;
            userNameDisplay.style.display = "inline-block";
        }

        if (addListingBtn)  addListingBtn.style.display  = "inline-block";
        if (favoritesBtn)   favoritesBtn.style.display   = "inline-block";
        if (myListingsBtn)  myListingsBtn.style.display  = "inline-block";
        if (myTripsBtn)     myTripsBtn.style.display     = "inline-block";
        if (profileBtn)     profileBtn.style.display     = "inline-block";
        if (adminPanelBtn)  adminPanelBtn.style.display  = role === "Admin" ? "inline-block" : "none";

        if (logoutBtn) {
            logoutBtn.style.display = "inline-block";
            logoutBtn.onclick = () => {
                localStorage.removeItem("token");
                window.location.href = "index.html";
            };
        }

        if (loginBtn)    loginBtn.style.display    = "none";
        if (registerBtn) registerBtn.style.display = "none";
    } else {
        if (userNameDisplay) userNameDisplay.style.display = "none";
        if (addListingBtn)   addListingBtn.style.display   = "none";
        if (favoritesBtn)    favoritesBtn.style.display    = "none";
        if (myListingsBtn)   myListingsBtn.style.display   = "none";
        if (myTripsBtn)      myTripsBtn.style.display      = "none";
        if (profileBtn)      profileBtn.style.display      = "none";
        if (adminPanelBtn)   adminPanelBtn.style.display   = "none";
        if (logoutBtn)       logoutBtn.style.display       = "none";

        if (loginBtn)    loginBtn.style.display    = "inline-block";
        if (registerBtn) registerBtn.style.display = "inline-block";
    }
}

document.addEventListener("DOMContentLoaded", checkNavbarAuth);
