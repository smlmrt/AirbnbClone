using System;
using System.Collections.Generic;

namespace AirbnbClone.Core.Entities
{
    public class User : BaseEntity
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;

        public string PasswordHash { get; set; } = null!;

        public string? PhoneNumber { get; set; }
        public string? ProfileImageUrl { get; set; }

        public DateTime DateOfBirth { get; set; }

        public string? Bio { get; set; }

        public string Role { get; set; } = "Guest";
        public bool IsEmailVerified { get; set; } = false;

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Listing> Listings { get; set; } = new List<Listing>();
        public ICollection<Experience> Experiences { get; set; } = new List<Experience>();
        public ICollection<ExperienceBooking> ExperienceBookings { get; set; } = new List<ExperienceBooking>();
    }
}