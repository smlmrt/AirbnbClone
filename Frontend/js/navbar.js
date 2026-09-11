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

    const userNameDisplay  = document.getElementById("userNameDisplay");
    const addListingBtn    = document.getElementById("addListingBtn");
    const favoritesBtn     = document.getElementById("favoritesBtn");
    const myListingsBtn    = document.getElementById("myListingsBtn");
    const myExperiencesBtn = document.getElementById("myExperiencesBtn");
    const myTripsBtn       = document.getElementById("myTripsBtn");
    const profileBtn       = document.getElementById("profileBtn");
    const adminPanelBtn    = document.getElementById("adminPanelBtn");
    const logoutBtn        = document.getElementById("logoutBtn");
    const loginBtn         = document.getElementById("loginBtn");
    const registerBtn      = document.getElementById("registerBtn");
    const navMenu          = document.getElementById("navMenu");

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

        if (userNameDisplay) userNameDisplay.innerText = `Merhaba, ${userName}`;

        if (navMenu) navMenu.style.display = "inline-flex";
        if (addListingBtn)    addListingBtn.style.display    = "inline-block";
        if (favoritesBtn)     favoritesBtn.style.display     = "block";
        if (myListingsBtn)    myListingsBtn.style.display    = "block";
        if (myExperiencesBtn) myExperiencesBtn.style.display = "block";
        if (myTripsBtn)       myTripsBtn.style.display       = "block";
        if (profileBtn)       profileBtn.style.display       = "block";
        if (adminPanelBtn)    adminPanelBtn.style.display    = role === "Admin" ? "block" : "none";

        if (logoutBtn) {
            logoutBtn.style.display = "block";
            logoutBtn.onclick = () => {
                localStorage.removeItem("token");
                window.location.href = "index.html";
            };
        }

        if (loginBtn)    loginBtn.style.display    = "none";
        if (registerBtn) registerBtn.style.display = "none";
    } else {
        if (navMenu) navMenu.style.display = "none";
        if (addListingBtn)    addListingBtn.style.display    = "none";
        if (favoritesBtn)     favoritesBtn.style.display     = "none";
        if (myListingsBtn)    myListingsBtn.style.display    = "none";
        if (myExperiencesBtn) myExperiencesBtn.style.display = "none";
        if (myTripsBtn)       myTripsBtn.style.display       = "none";
        if (profileBtn)       profileBtn.style.display       = "none";
        if (adminPanelBtn)    adminPanelBtn.style.display    = "none";
        if (logoutBtn)        logoutBtn.style.display        = "none";

        if (loginBtn)    loginBtn.style.display    = "inline-block";
        if (registerBtn) registerBtn.style.display = "inline-block";
    }
}

// ─── Kullanıcı Menüsü Açılır/Kapanır ───
function setupNavMenuToggle() {
    const trigger = document.getElementById("navMenuTrigger");
    const dropdown = document.getElementById("navMenuDropdown");
    if (!trigger || !dropdown) return;

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle("open");
        trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    dropdown.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("click", () => {
        dropdown.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    checkNavbarAuth();
    setupNavMenuToggle();
});
