const EXPERIENCES_API_URL = "http://localhost:5019/api/experiences";

document.addEventListener("DOMContentLoaded", () => {
    fetchExperiences();
    // Bu sayfaya özel "Etkinlik Ekle" butonu — kullanıcı bilgisi ve diğer
    // navbar öğeleri navbar.js tarafından yönetilir.
    if (localStorage.getItem("token")) {
        document.getElementById("addExperienceBtn").style.display = "inline-block";
    }
});

// Etkinlikleri Listeleme
async function fetchExperiences() {
    try {
        const response = await fetch(EXPERIENCES_API_URL);
        if (!response.ok) throw new Error("Veriler alınamadı");
        const experiences = await response.json();
        
        const grid = document.getElementById("experiencesGrid");
        grid.innerHTML = "";

        if (experiences.length === 0) {
            grid.innerHTML = "<p class='empty-state'>Henüz etkinlik yok. İlk etkinliği sen oluştur!</p>";
            return;
        }

        experiences.forEach(exp => {
            const card = document.createElement("div");
            card.className = "listing-card";
            card.innerHTML = `
                <img src="${exp.imageUrl || 'https://via.placeholder.com/300x210?text=Gorsel+Yok'}" alt="${exp.title}">
                <div class="listing-card-body">
                    <div class="listing-card-top">
                        <span>${exp.title}</span>
                        <span>⏱ ${exp.durationHours} Saat</span>
                    </div>
                    <p class="listing-card-meta">
                        <span>📍 ${exp.location}</span>
                        <span>👥 Maks. ${exp.maxGroupSize} Kişi</span>
                    </p>
                    <p class="listing-card-price"><strong>${exp.pricePerPerson} ₺</strong> <span>/ kişi</span></p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        document.getElementById("experiencesGrid").innerHTML = "<p class='empty-state'>Yüklenirken hata oluştu.</p>";
    }
}

// Modal Kontrolleri
const modal = document.getElementById("addExperienceModal");
const addBtn = document.getElementById("addExperienceBtn");
const closeBtn = document.querySelector(".close-btn");

if (addBtn) addBtn.onclick = () => modal.style.display = "block";
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; }

// Form Gönderimi (POST)
document.getElementById("addExperienceForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("Title", document.getElementById("expTitle").value);
    formData.append("Description", document.getElementById("expDescription").value);
    formData.append("Location", document.getElementById("expLocation").value);
    formData.append("PricePerPerson", document.getElementById("expPrice").value);
    formData.append("DurationHours", document.getElementById("expDuration").value);
    formData.append("MaxGroupSize", document.getElementById("expMaxGroup").value);
    
    const fileInput = document.getElementById("expImage");
    if (fileInput.files.length > 0) {
        formData.append("ImageFile", fileInput.files[0]);
    }

    try {
        const response = await fetch(EXPERIENCES_API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            modal.style.display = "none";
            document.getElementById("addExperienceForm").reset();
            fetchExperiences();
        } else {
            const errorText = await response.text();
            console.error("Backend Hatası:", errorText);
            alert("İşlem Başarısız:\n" + errorText);
        }
    } catch (error) {
        console.error("Hata:", error);
    }
});