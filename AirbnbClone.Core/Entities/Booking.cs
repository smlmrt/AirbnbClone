using System;

namespace AirbnbClone.Core.Entities
{
    public class Booking : BaseEntity
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int NumberOfGuests { get; set; }
        public decimal TotalPrice { get; set; }

        public string Statıs { get; set; } = "Pending";

        public bool IsPaid { get; set; } = false;
        
        public int ListingId { get; set; }
        public Listing? Listing { get; set; } = null!;

        public int UserId { get; set; }
        public User? User { get; set; } = null!;
    }
}