using System.Collections.Generic;

namespace AirbnbClone.Core.Entities
{
    public class Experience : BaseEntity
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = null!;
        public decimal PricePerPerson { get; set; }
        public int DurationHours { get; set; }
        public int MaxGroupSize { get; set; }
        public string? ImageUrl { get; set; }
        
        public int HostId { get; set; }
        public User? Host { get; set; }
        
        public ICollection<ExperienceBooking> ExperienceBookings { get; set; } = new List<ExperienceBooking>();
    }
}