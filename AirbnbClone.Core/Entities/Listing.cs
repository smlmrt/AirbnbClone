using System.Collections.Generic;

namespace AirbnbClone.Core.Entities
{
    public class Listing : BaseEntity
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string City { get; set; } = null!;
        public string FullAddress { get; set; } = null!;
        public string PropertyType { get; set; }  = null!; // Daire, Villa, Bungalov

        public int MaxGuests { get; set; }
        public int Bedrooms { get; set; }
        public int Beds { get; set; }
        public int Bathrooms { get; set; }

        // Fiyat ve Medya
        public decimal PricePerNight { get; set; }
        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public int HostId { get; set; }
        public User? Host { get; set; } = null!;

        public ICollection<Booking>? Bookings { get; set; } = new List<Booking>();
    }
}