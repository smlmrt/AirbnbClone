const API_URL = "http://localhost:5019/api/listings"; 

document.addEventListener("DOMContentLoaded", () => {
    // Tarayıcıdaki URL'den "?id=X" kısmını alıyoruz
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (listingId) {
        fetchListingDetail(listingId);
    } else {
        document.getElementById("detailContainer").innerHTML = "<p>Geçersiz ilan numarası.</p>";
    }
});

// ID ile C# API'sinden evi çeken fonksiyon
async function fetchListingDetail(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Detaylar alınamadı");
        
        const listing = await response.json();
        renderDetail(listing);
    } catch (error) {
        console.error("Hata:", error);
        document.getElementById("detailContainer").innerHTML = "<p>İlan bulunamadı veya bir hata oluştu.</p>";
    }
}

// Gelen veriyi sayfaya Airbnb tarzı çizen fonksiyon
function renderDetail(listing) {
    const container = document.getElementById("detailContainer");
    const imageUrl = listing.imageUrl || 'https://via.placeholder.com/1200x500?text=Gorsel+Yok';
    
    // Kimlik kontrolü: Kullanıcı kendi ilanına bakıyorsa Sil butonunu göster
    const token = localStorage.getItem("token");
    let isOwner = false;
    
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedToken = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
            
            const currentUserId = decodedToken.nameid || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            
            if (currentUserId && currentUserId == listing.hostId) {
                isOwner = true;
            }
        } catch (e) {
            console.error("Token çözülürken hata:", e);
        }
    }

    const deleteBtnHtml = isOwner 
        ? `<button onclick="deleteListing(${listing.id})" class="submit-btn" style="width: 100%; background-color: #222; margin-top: 15px;">İlanı Sil</button>` 
        : '';
    
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

                    <button class="submit-btn" style="width: 100%;" onclick="makeBooking(${listing.id}, ${listing.pricePerNight})">Rezervasyon Yap</button>
                    
                    <!-- İlan sahibine özel buton -->
                    ${deleteBtnHtml}
                </div>
            </div>
        </div>
    `;
}

async function makeBooking(listingId, pricePerNight) {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const guests = document.getElementById("guests").value;

    if (!startDate || !endDate) {
        alert("Lütfen giriş ve çıkış tarihlerini seçiniz.");
        return;
    }

    // Basit bir gün hesabı ile toplam fiyatı buluyoruz
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = (end - start) / (1000 * 60 * 60 * 24);
    
    if (days <= 0) {
        alert("Çıkış tarihi giriş tarihinden önce olamaz!");
        return;
    }

    const bookingData = {
        listingId: listingId,
        userId: 1, // Şimdilik yine test kullanıcımız (ID:1) üzerinden kiralıyoruz
        startDate: startDate,
        endDate: endDate,
        numberOfGuests: parseInt(guests),
        totalPrice: days * pricePerNight
    };

    try {
        const response = await fetch("http://localhost:5019/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
        });

        if (response.ok) {
            alert(`Tebrikler! ${days} gece için toplam ${bookingData.totalPrice} ₺ tutarında rezervasyonunuz onaylandı.`);
            window.location.href = "index.html"; // Başarılı olunca ana sayfaya dön
        } else {
            alert("Rezervasyon yapılamadı. Tarihleri kontrol ediniz.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}


// İlanı Silme Fonksiyonu
async function deleteListing(id) {
    if (!confirm("Bu ilanı tamamen silmek istediğinize emin misiniz?")) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("İlan başarıyla silindi.");
            window.location.href = "index.html"; // Silindikten sonra ana sayfaya dön
        } else {
            alert("İlan silinirken bir yetki hatası oluştu.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}