// DİKKAT: Buradaki port numarasını kendi terminalinde çalışan API portunla değiştirmelisin!
const API_URL = "http://localhost:5019/api/listings"; 

// JWT Kimlik Kartını Çözümleyen Fonksiyon
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchListings();
    checkAuthStatus(); // Sayfa yüklendiğinde kullanıcının giriş durumunu kontrol et
});

// Backend'den evleri çeken asenkron fonksiyon
async function fetchListings() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Veriler alınamadı");
        
        const listings = await response.json();
        displayListings(listings);
    } catch (error) {
        console.error("Bağlantı hatası:", error);
        document.getElementById("listingsGrid").innerHTML = "<p>Evler yüklenirken bir sorun oluştu.</p>";
    }
}

// Gelen verileri HTML kartlarına dönüştüren fonksiyon
function displayListings(listings) {
    const grid = document.getElementById("listingsGrid");
    grid.innerHTML = ""; // Yükleniyor yazısını temizle

    if (listings.length === 0) {
        grid.innerHTML = "<p>Henüz sistemde hiç ev ilanı yok veya aradığınız kriterlere uygun ev bulunamadı.</p>";
        return;
    }

    listings.forEach(listing => {
        const card = document.createElement("div");
        card.className = "listing-card";
        card.style.position = "relative"; // Kalp ikonunu konumlandırmak için gerekli
        
        // Kalp İkonu (Sağ Üst Köşe)
        const heartIcon = document.createElement("div");
        heartIcon.innerHTML = "🤍"; // Başlangıçta boş kalp
        heartIcon.style.position = "absolute";
        heartIcon.style.top = "15px";
        heartIcon.style.right = "15px";
        heartIcon.style.fontSize = "24px";
        heartIcon.style.cursor = "pointer";
        heartIcon.style.zIndex = "10";
        heartIcon.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
        
        // Kalp ikonuna tıklama olayı
        heartIcon.onclick = async (e) => {
            e.stopPropagation(); // Karta tıklanıp detaya gitmesini engelle
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Favorilere eklemek için giriş yapmalısınız.");
                return;
            }

            try {
                const res = await fetch(`http://localhost:5019/api/favorites/${listing.id}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    heartIcon.innerHTML = data.isFavorite ? "❤️" : "🤍";
                }
            } catch (error) {
                console.error("Favori işlemi hatası:", error);
            }
        };

        // Karta Tıklayınca Detaya Gitme (Kalp hariç)
        const cardContent = document.createElement("div");
        cardContent.style.cursor = "pointer";
        cardContent.onclick = () => {
            window.location.href = `detail.html?id=${listing.id}`;
        };
        
        cardContent.innerHTML = `
            <img src="${listing.imageUrl || 'https://via.placeholder.com/300x200?text=Gorsel+Yok'}" 
                 alt="${listing.title}" 
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>${listing.city}, ${listing.country}</span>
                <span>★ 4.9</span>
            </div>
            <p style="color: #717171; font-size: 14px; margin-top: 4px;">${listing.propertyType} - ${listing.beds} Yatak</p>
            <p style="margin-top: 6px;"><strong>${listing.pricePerNight} ₺</strong> <span style="color:#717171;">gece</span></p>
        `;
        
        card.appendChild(heartIcon);
        card.appendChild(cardContent);
        grid.appendChild(card);
    });
}

// Modal Açma / Kapama İşlemleri
const modal = document.getElementById("addListingModal");
const addBtn = document.getElementById("addListingBtn");
const closeBtn = document.querySelector(".close-btn");

if (addBtn) addBtn.onclick = () => modal.style.display = "block";
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

// Form Gönderimi (POST İsteği - Cihazdan Görsel Yüklemeli)
document.getElementById("addListingForm").addEventListener("submit", async (e) => {
    e.preventDefault(); 
    const token = localStorage.getItem("token");

    // JSON yerine FormData kullanıyoruz (Dosya gönderimi için zorunludur)
    const formData = new FormData();
    formData.append("Title", document.getElementById("title").value);
    formData.append("Description", document.getElementById("description").value);
    formData.append("City", document.getElementById("city").value);
    formData.append("Country", document.getElementById("country").value);
    formData.append("FullAddress", document.getElementById("fullAddress").value);
    formData.append("PropertyType", document.getElementById("propertyType").value);
    formData.append("PricePerNight", document.getElementById("price").value);
    formData.append("MaxGuests", document.getElementById("maxGuests").value);
    formData.append("Bedrooms", document.getElementById("bedrooms").value);
    formData.append("Beds", document.getElementById("beds").value);
    formData.append("Bathrooms", document.getElementById("bathrooms").value);
    
    const fileInput = document.getElementById("imageFile");
    if (fileInput && fileInput.files.length > 0) {
        formData.append("ImageFile", fileInput.files[0]);
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}` 
                // DİKKAT: FormData kullanırken "Content-Type" başlığını BİZ YAZMIYORUZ, tarayıcı kendisi ayarlar.
            },
            body: formData
        });

        if (response.ok) {
            if(modal) modal.style.display = "none"; 
            document.getElementById("addListingForm").reset(); 
            fetchListings(); // Listeyi yenile
        } else {
            alert("İlan eklenirken bir hata oluştu.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
});

// Sayfa yüklendiğinde kullanıcının giriş yapıp yapmadığını kontrol et
function checkAuthStatus() {
    const token = localStorage.getItem("token");
    const userNameDisplay = document.getElementById("userNameDisplay");
    const adminPanelBtn = document.getElementById("adminPanelBtn");
    const myTripsBtn = document.getElementById("myTripsBtn"); 
    const myListingsBtn = document.getElementById("myListingsBtn");
    const favoritesBtn = document.getElementById("favoritesBtn"); 
    const profileBtn = document.getElementById("profileBtn"); // Profil butonu eklendi

    if (token) {
        const decodedToken = parseJwt(token);
        
        // İsmi yakala
        const userName = decodedToken ? (decodedToken.unique_name || decodedToken.name || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "Kullanıcı") : "Kullanıcı";
        
        // Yetkiyi (Role) yakala
        const role = decodedToken ? (decodedToken.role || decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]) : "Guest";

        if (userNameDisplay) {
            userNameDisplay.innerText = `Merhaba, ${userName}`;
            userNameDisplay.style.display = "inline-block";
        }

        if (adminPanelBtn) adminPanelBtn.style.display = role === "Admin" ? "inline-block" : "none";
        
        if (myTripsBtn) myTripsBtn.style.display = "inline-block"; 
        if (myListingsBtn) myListingsBtn.style.display = "inline-block";
        if (favoritesBtn) favoritesBtn.style.display = "inline-block"; 
        if (profileBtn) profileBtn.style.display = "inline-block"; // Giriş yapanlara Profil butonunu göster

        if (document.getElementById("loginBtn")) document.getElementById("loginBtn").style.display = "none";
        if (document.getElementById("registerBtn")) document.getElementById("registerBtn").style.display = "none";
        if (document.getElementById("logoutBtn")) document.getElementById("logoutBtn").style.display = "inline-block";
        if (document.getElementById("addListingBtn")) document.getElementById("addListingBtn").style.display = "inline-block";
    } else {
        if (userNameDisplay) userNameDisplay.style.display = "none";
        if (adminPanelBtn) adminPanelBtn.style.display = "none";
        if (myTripsBtn) myTripsBtn.style.display = "none"; 
        if (myListingsBtn) myListingsBtn.style.display = "none";
        if (favoritesBtn) favoritesBtn.style.display = "none"; 
        if (profileBtn) profileBtn.style.display = "none"; // Çıkış yapıldıysa Profil butonunu gizle
        
        if (document.getElementById("loginBtn")) document.getElementById("loginBtn").style.display = "inline-block";
        if (document.getElementById("registerBtn")) document.getElementById("registerBtn").style.display = "inline-block";
        if (document.getElementById("logoutBtn")) document.getElementById("logoutBtn").style.display = "none";
        if (document.getElementById("addListingBtn")) document.getElementById("addListingBtn").style.display = "none";
    }
}

// Çıkış Yapma İşlemi
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem("token");
        checkAuthStatus();
        window.location.reload();
    };
}

// Arama Motoru Fonksiyonu
async function performSearch() {
    const city = document.getElementById("searchCity").value;
    const price = document.getElementById("searchPrice").value;
    const guests = document.getElementById("searchGuests").value;

    let queryParams = [];
    if (city) queryParams.push(`city=${encodeURIComponent(city)}`);
    if (price) queryParams.push(`maxPrice=${price}`);
    if (guests) queryParams.push(`guests=${guests}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    try {
        const response = await fetch(`http://localhost:5019/api/listings/search${queryString}`);
        if (response.ok) {
            const listings = await response.json();
            displayListings(listings); 
        } else {
            alert("Arama sırasında bir hata oluştu.");
        }
    } catch (error) {
        console.error("Arama hatası:", error);
    }
}