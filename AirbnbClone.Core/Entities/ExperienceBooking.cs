using System;

namespace AirbnbClone.Core.Entities
{
    public class ExperienceBooking : BaseEntity 
    {
        public DateTime Date { get; set; }
        public int NumberOfPeople { get; set; }
        public decimal TotalPrice { get; set; }

        public int ExperienceId { get; set; }
        public Experience? Experience { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}