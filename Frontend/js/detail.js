const API_URL = "http://localhost:5019/api/listings";

// JWT Çözümleyici — app.js ile aynı yardımcı fonksiyon
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

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (listingId) {
        fetchListingDetail(listingId);
    } else {
        document.getElementById("detailContainer").innerHTML =
            "<p class='empty-state'>Geçersiz ilan numarası.</p>";
    }
});

async function fetchListingDetail(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Detaylar alınamadı");
        const listing = await response.json();
        renderDetail(listing);
        fetchReviews(id);
    } catch (error) {
        console.error("Hata:", error);
        document.getElementById("detailContainer").innerHTML =
            "<p class='empty-state'>İlan bulunamadı veya bir hata oluştu.</p>";
    }
}

function renderDetail(listing) {
    const container = document.getElementById("detailContainer");
    const imageUrl = listing.imageUrl || 'https://via.placeholder.com/1000x480?text=Görsel+Yok';

    // Oturum açan kullanıcı ilan sahibi mi kontrol et
    const token = localStorage.getItem("token");
    let isOwner = false;
    if (token) {
        const decodedToken = parseJwt(token);
        if (decodedToken) {
            const currentUserId = decodedToken.nameid
                || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            if (currentUserId && currentUserId == listing.hostId) isOwner = true;
        }
    }

    const deleteBtnHtml = isOwner
        ? `<button onclick="deleteListing(${listing.id})" class="btn-dark-submit">İlanı Sil</button>`
        : '';

    container.innerHTML = `
        <div class="detail-container">
            <h1 class="detail-title">${listing.title}</h1>
            <p class="detail-location">📍 ${listing.city}, ${listing.country}</p>
            <img src="${imageUrl}" class="detail-image" alt="${listing.title}">

            <div class="detail-body">
                <!-- Sol: Bilgiler + Yorumlar -->
                <div class="detail-main">
                    <h2>Ev Tipi: ${listing.propertyType}</h2>
                    <p class="detail-specs">
                        Maksimum ${listing.maxGuests} Misafir &middot;
                        ${listing.bedrooms || 1} Yatak Odası &middot;
                        ${listing.beds || 1} Yatak &middot;
                        ${listing.bathrooms || 1} Banyo
                    </p>
                    <hr class="detail-divider">
                    <p class="detail-description">
                        ${listing.description || 'Bu harika evde unutulmaz bir konaklama deneyimi yaşayın.'}
                    </p>

                    <!-- HARİTA BÖLÜMÜ -->
                    <div style="margin-top: 40px; margin-bottom: 40px;">
                        <h2 style="font-size: 22px; margin-bottom: 20px;">Konum</h2>
                        <div id="map" style="width: 100%; height: 350px; border-radius: 12px; z-index: 1;"></div>
                    </div>

                    <!-- Yorumlar bu div içine enjekte edilir -->
                    <div id="reviewsSection" class="reviews-section">
                        Yorumlar yükleniyor...
                    </div>
                </div>

                <!-- Sağ: Rezervasyon Kutusu -->
                <div class="detail-sidebar">
                    <p class="detail-sidebar-price">
                        ${listing.pricePerNight} ₺ <span>/ gece</span>
                    </p>

                    <label class="sidebar-label">Giriş Tarihi</label>
                    <input type="date" id="startDate" class="form-input">

                    <label class="sidebar-label">Çıkış Tarihi</label>
                    <input type="date" id="endDate" class="form-input">

                    <label class="sidebar-label">Misafir Sayısı</label>
                    <input type="number" id="guests" value="1" min="1" max="${listing.maxGuests}" class="form-input">

                    <button class="submit-btn" onclick="makeBooking(${listing.id})">Rezervasyon Yap</button>
                    ${deleteBtnHtml}
                </div>
            </div>
        </div>
    `;

    // Arayüz oluştuktan sonra haritayı başlatıyoruz
    initMap(listing.city, listing.country);
}

// ─── YORUM SİSTEMİ ───

async function fetchReviews(listingId) {
    try {
        const res = await fetch(`http://localhost:5019/api/reviews/${listingId}`);
        if (res.ok) {
            const reviews = await res.json();
            renderReviews(reviews, listingId);
        } else {
            document.getElementById("reviewsSection").innerHTML =
                "<p style='color:var(--color-primary);'>Yorumlar yüklenirken bir hata oluştu.</p>";
        }
    } catch (error) {
        console.error("Yorumlar alınamadı:", error);
        document.getElementById("reviewsSection").innerHTML =
            "<p class='empty-state'>Sisteme ulaşılamadı.</p>";
    }
}

function renderReviews(reviews, listingId) {
    const section = document.getElementById("reviewsSection");
    if (!section) return;

    let html = `<h2>Değerlendirmeler (${reviews.length})</h2>`;

    // Giriş yapan kullanıcıya yorum formu göster
    const token = localStorage.getItem("token");
    if (token) {
        html += `
            <div class="review-form">
                <h3>Deneyiminizi Paylaşın</h3>
                <select id="reviewRating">
                    <option value="5">⭐⭐⭐⭐⭐ Mükemmel</option>
                    <option value="4">⭐⭐⭐⭐ Çok İyi</option>
                    <option value="3">⭐⭐⭐ İyi</option>
                    <option value="2">⭐⭐ Kötü</option>
                    <option value="1">⭐ Berbat</option>
                </select>
                <textarea id="reviewComment" rows="3" placeholder="Bu evde konaklamanız nasıldı?"></textarea>
                <button onclick="submitReview(${listingId})" class="btn-submit-review">Gönder</button>
            </div>
        `;
    }

    if (reviews.length === 0) {
        html += `<p class="empty-state">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>`;
    } else {
        reviews.forEach(r => {
            const userName    = r.userName    || r.UserName    || "Anonim";
            const comment     = r.comment     || r.Comment     || "";
            const rating      = r.rating      || r.Rating      || 5;
            const createdDate = r.createdDate || r.CreatedDate || new Date();

            const date        = new Date(createdDate).toLocaleDateString('tr-TR');
            const displayName = userName.includes('@') ? userName.split('@')[0] : userName;
            const initial     = displayName.charAt(0).toUpperCase();

            html += `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-avatar">${initial}</div>
                        <div>
                            <h4 class="review-author">${displayName}</h4>
                            <p class="review-date">${date}</p>
                        </div>
                    </div>
                    <p class="review-stars">${'⭐'.repeat(rating)}</p>
                    <p class="review-comment">${comment}</p>
                </div>
            `;
        });
    }

    section.innerHTML = html;
}

async function submitReview(listingId) {
    const token   = localStorage.getItem("token");
    const rating  = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value;

    if (!comment.trim()) {
        alert("Lütfen bir yorum metni giriniz.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:5019/api/reviews/${listingId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ Rating: parseInt(rating), Comment: comment })
        });

        if (res.ok) {
            alert("Değerlendirmeniz başarıyla eklendi!");
            fetchReviews(listingId);
        } else {
            const errorMessage = await res.text();
            alert(`İşlem Başarısız: ${errorMessage}`);
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}

// ─── REZERVASYON VE SİLME ───

async function makeBooking(listingId) {
    const token = localStorage.getItem("token");
    if (!token) return alert("Rezervasyon yapmak için giriş yapmalısınız.");

    const startDate = document.getElementById("startDate").value;
    const endDate   = document.getElementById("endDate").value;
    const guests    = document.getElementById("guests").value;

    if (!startDate || !endDate) return alert("Lütfen giriş ve çıkış tarihlerini seçiniz.");

    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (days <= 0) return alert("Çıkış tarihi giriş tarihinden önce olamaz!");

    try {
        const res = await fetch("http://localhost:5019/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                ListingId: listingId,
                StartDate: startDate,
                EndDate:   endDate,
                Guests:    parseInt(guests)
            })
        });

        if (res.ok) {
            alert("Tebrikler! Rezervasyonunuz onaylandı.");
            window.location.href = "my-trips.html";
        } else {
            const error = await res.text();
            alert(`İşlem Başarısız: ${error}`);
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}

async function deleteListing(id) {
    if (!confirm("Bu ilanı tamamen silmek istediğinize emin misiniz?")) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
            alert("İlan silindi.");
            window.location.href = "index.html";
        } else {
            alert("Yetki hatası: İlanı silme izniniz bulunmuyor.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}

// ─── HARİTA ───

async function initMap(city, country) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        // Ücretsiz Geocoding servisi ile şehri koordinata çeviriyoruz
        const query = encodeURIComponent(`${city}, ${country}`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;

            // Haritayı başlat
            const map = L.map('map').setView([lat, lon], 13);
            
            // Harita tasarım katmanı
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Kırmızı yer imi ekle
            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${city}</b><br>${country}`)
                .openPopup();
        } else {
            mapContainer.innerHTML = "<p style='padding: 20px; text-align: center; color: #717171;'>Konum haritada bulunamadı.</p>";
            mapContainer.style.backgroundColor = "#f7f7f7";
        }
    } catch (error) {
        console.error("Harita hatası:", error);
        mapContainer.innerHTML = "<p>Harita yüklenemedi.</p>";
    }
}