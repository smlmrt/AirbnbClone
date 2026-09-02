namespace AirbnbClone.Core.Entities
{
    public class Review
    {
        public int Id { get; set; }
        public int ListingId { get; set; }
        public int UserId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        
        public Listing? Listing { get; set; }
        public User? User { get; set; }
    }
}