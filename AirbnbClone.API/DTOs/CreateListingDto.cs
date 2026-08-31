using Microsoft.AspNetCore.Http;

namespace AirbnbClone.API.DTOs
{
    public class CreateListingDto
    {
        public string Title { get; set; } = null!;
        public string City { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string PropertyType { get; set; } = null!;
        public decimal PricePerNight { get; set; }
        
        // Yeni Eklenen Detaylar
        public string Description { get; set; } = null!;
        public string FullAddress { get; set; } = null!;
        public int MaxGuests { get; set; }
        public int Bedrooms { get; set; }
        public int Beds { get; set; }
        public int Bathrooms { get; set; }
        
        public IFormFile? ImageFile { get; set; }
    }
}