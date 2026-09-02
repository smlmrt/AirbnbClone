const API_URL = "http://localhost:5019/api/listings"; 

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (listingId) {
        fetchListingDetail(listingId);
    } else {
        document.getElementById("detailContainer").innerHTML = "<p>Geçersiz ilan numarası.</p>";
    }
});

async function fetchListingDetail(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Detaylar alınamadı");
        
        const listing = await response.json();
        renderDetail(listing);
        fetchReviews(id); // Detaylar yüklenince yorumları da çek
    } catch (error) {
        console.error("Hata:", error);
        document.getElementById("detailContainer").innerHTML = "<p>İlan bulunamadı veya bir hata oluştu.</p>";
    }
}

function renderDetail(listing) {
    const container = document.getElementById("detailContainer");
    const imageUrl = listing.imageUrl || 'https://via.placeholder.com/1200x500?text=Gorsel+Yok';
    const token = localStorage.getItem("token");
    let isOwner = false;
    
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedToken = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
            const currentUserId = decodedToken.nameid || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            if (currentUserId && currentUserId == listing.hostId) isOwner = true;
        } catch (e) { console.error("Token çözülürken hata:", e); }
    }

    const deleteBtnHtml = isOwner ? `<button onclick="deleteListing(${listing.id})" class="submit-btn" style="width: 100%; background-color: #222; margin-top: 15px;">İlanı Sil</button>` : '';
    
    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto;">
            <h1 style="font-size: 32px; margin-bottom: 10px;">${listing.title}</h1>
            <p style="color: #717171; font-size: 16px; font-weight: 500; margin-bottom: 20px;">
                <u>${listing.city}, ${listing.country}</u>
            </p>
            <img src="${imageUrl}" style="width: 100%; height: 500px; object-fit: cover; border-radius: 12px; margin-bottom: 40px;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 40px;">
                <div style="flex: 2;">
                    <h2 style="font-size: 22px; margin-bottom: 10px;">Ev Tipi: ${listing.propertyType}</h2>
                    <p style="color: #222; font-size: 16px;">Maksimum ${listing.maxGuests} Misafir · ${listing.bedrooms || 1} Yatak Odası · ${listing.beds || 1} Yatak · ${listing.bathrooms || 1} Banyo</p>
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ebebeb;">
                    <p style="color: #717171; line-height: 1.6;">${listing.description || 'Bu harika evde unutulmaz bir konaklama deneyimi yaşayın.'}</p>
                    
                    <!-- YORUMLAR BÖLÜMÜ -->
                    <div id="reviewsSection" style="margin-top: 50px; border-top: 1px solid #ebebeb; padding-top: 30px;">
                        Yorumlar yükleniyor...
                    </div>
                </div>
                
                <div style="flex: 1; border: 1px solid #ebebeb; border-radius: 12px; padding: 24px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); position: sticky; top: 100px;">
                    <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">${listing.pricePerNight} ₺ <span style="font-size: 16px; font-weight: normal; color: #717171;">/ gece</span></p>
                    <div style="margin-bottom: 20px;">
                        <label style="font-size: 14px; font-weight: bold;">Giriş Tarihi</label>
                        <input type="date" id="startDate" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px;">
                        <label style="font-size: 14px; font-weight: bold;">Çıkış Tarihi</label>
                        <input type="date" id="endDate" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px;">
                        <label style="font-size: 14px; font-weight: bold;">Misafir Sayısı</label>
                        <input type="number" id="guests" value="1" min="1" max="${listing.maxGuests}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
                    </div>
                    <button class="submit-btn" style="width: 100%;" onclick="makeBooking(${listing.id})">Rezervasyon Yap</button>
                    ${deleteBtnHtml}
                </div>
            </div>
        </div>
    `;
}

// --- YORUM SİSTEMİ FONKSİYONLARI ---

async function fetchReviews(listingId) {
    try {
        const res = await fetch(`http://localhost:5019/api/reviews/${listingId}`);
        if (res.ok) {
            const reviews = await res.json();
            renderReviews(reviews, listingId);
        } else {
            // Eğer C# tarafında hata varsa ekrana bas
            document.getElementById("reviewsSection").innerHTML = "<p style='color:#ff5a5f;'>Yorumlar yüklenirken bir API hatası oluştu.</p>";
        }
    } catch (error) { 
        console.error("Yorumlar alınamadı:", error); 
        document.getElementById("reviewsSection").innerHTML = "<p>Sisteme ulaşılamadı.</p>";
    }
}

function renderReviews(reviews, listingId) {
    const section = document.getElementById("reviewsSection");
    if (!section) return;

    let html = `<h2 style="font-size: 22px; margin-bottom: 20px;">Değerlendirmeler (${reviews.length})</h2>`;

    const token = localStorage.getItem("token");
    if (token) {
        html += `
            <div style="background: #f7f7f7; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                <h3 style="margin-bottom: 10px; font-size: 16px;">Deneyiminizi Paylaşın</h3>
                <select id="reviewRating" style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ccc;">
                    <option value="5">⭐⭐⭐⭐⭐ Mükemmel</option>
                    <option value="4">⭐⭐⭐⭐ Çok İyi</option>
                    <option value="3">⭐⭐⭐ İyi</option>
                    <option value="2">⭐⭐ Kötü</option>
                    <option value="1">⭐ Berbat</option>
                </select>
                <textarea id="reviewComment" placeholder="Bu evde konaklamanız nasıldı?" rows="3" style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ccc;"></textarea>
                <button onclick="submitReview(${listingId})" class="submit-btn" style="background-color: #222; width: auto; padding: 8px 16px;">Gönder</button>
            </div>
        `;
    }

    if (reviews.length === 0) {
        html += `<p style="color: #717171;">Henüz yorum yapılmamış.</p>`;
    } else {
        reviews.forEach(r => {
            // Güvenlik Kalkanı: API verilerinin null veya farklı formatta (CamelCase vs PascalCase) gelme ihtimalini tolere ediyoruz.
            const userName = r.userName || r.UserName || "Anonim";
            const comment = r.comment || r.Comment || "";
            const rating = r.rating || r.Rating || 5;
            const createdDate = r.createdDate || r.CreatedDate || new Date();
            
            const date = new Date(createdDate).toLocaleDateString('tr-TR');
            const displayName = userName.includes('@') ? userName.split('@')[0] : userName;
            const initial = displayName.charAt(0).toUpperCase();

            html += `
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #ebebeb;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #222; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
                            ${initial}
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px;">${displayName}</h4>
                            <p style="font-size: 12px; color: #717171; margin: 0;">${date}</p>
                        </div>
                    </div>
                    <p style="margin-bottom: 5px; font-size: 14px;">${'⭐'.repeat(rating)}</p>
                    <p style="color: #222; font-size: 15px;">${comment}</p>
                </div>
            `;
        });
    }
    section.innerHTML = html;
}

async function submitReview(listingId) {
    const token = localStorage.getItem("token");
    const rating = document.getElementById("reviewRating").value;
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
            fetchReviews(listingId); // Yorum eklendikten sonra listeyi yenile
        } else {
            const errorMessage = await res.text();
            alert(`İşlem Başarısız: ${errorMessage}`);
        }
    } catch (error) { console.error("Hata:", error); }
}

// --- REZERVASYON VE SİLME İŞLEMLERİ ---

async function makeBooking(listingId) {
    const token = localStorage.getItem("token");
    if (!token) return alert("Rezervasyon yapmak için giriş yapmalısınız.");

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const guests = document.getElementById("guests").value;

    if (!startDate || !endDate) return alert("Lütfen giriş ve çıkış tarihlerini seçiniz.");

    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (days <= 0) return alert("Çıkış tarihi giriş tarihinden önce olamaz!");

    try {
        const res = await fetch("http://localhost:5019/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ ListingId: listingId, StartDate: startDate, EndDate: endDate, Guests: parseInt(guests) })
        });

        if (res.ok) {
            alert("Tebrikler! Rezervasyonunuz onaylandı.");
            window.location.href = "my-trips.html"; 
        } else {
            const error = await res.text();
            alert(`İşlem Başarısız: ${error}`);
        }
    } catch (error) { console.error("Hata:", error); }
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
        } else alert("Yetki hatası oluştu.");
    } catch (error) { console.error("Hata:", error); }
}