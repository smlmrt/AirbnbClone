namespace AirbnbClone.API.DTOs
{
    public class CreateBookingDto
    {
        public int ListingId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Guests { get; set; }
    }
}