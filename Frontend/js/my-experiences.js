const EXPERIENCES_API_URL = "http://localhost:5019/api/experiences";

const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

document.addEventListener("DOMContentLoaded", fetchMyExperiences);

async function fetchMyExperiences() {
    const container = document.getElementById("experiencesContainer");
    try {
        const res = await fetch(`${EXPERIENCES_API_URL}/my-experiences`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Veriler alınamadı");

        const experiences = await res.json();

        if (experiences.length === 0) {
            container.innerHTML = "<p class='empty-state'>Henüz bir etkinliğiniz bulunmuyor.</p>";
            return;
        }

        container.innerHTML = experiences.map(exp => `
            <div class="item-card" id="exp-card-${exp.id}">
                <button class="item-card-delete-btn" title="Etkinliği sil" onclick="deleteExperience(${exp.id})">🗑️</button>
                <img src="${exp.imageUrl || 'https://via.placeholder.com/400x200?text=Gorsel+Yok'}" alt="${exp.title}">
                <div class="item-card-content">
                    <h3>${exp.title}</h3>
                    <p class="item-card-location">📍 ${exp.location}</p>
                    <p class="item-card-price">${exp.pricePerPerson} ₺ / kişi</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = "<p class='empty-state'>Yüklenirken hata oluştu.</p>";
    }
}

async function deleteExperience(id) {
    if (!confirm("Bu etkinliği tamamen silmek istediğinize emin misiniz?")) return;

    try {
        const res = await fetch(`${EXPERIENCES_API_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            document.getElementById(`exp-card-${id}`).remove();
        } else {
            alert("Yetki hatası: Bu etkinliği silme izniniz bulunmuyor.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}
