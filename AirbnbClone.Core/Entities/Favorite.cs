namespace AirbnbClone.Core.Entities
{
    public class Favorite
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ListingId { get; set; }
        public DateTime CreatedDate { get; set; }

        public User? User { get; set; }
        public Listing? Listing { get; set; }
    }
}