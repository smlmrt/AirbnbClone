namespace AirbnbClone.Core.Entities
{
    public class ListingImage : BaseEntity
    {
        public string ImageUrl { get; set; } = null!;
        public bool IsCover { get; set; } = false;
        
        public int ListingId { get; set; }
        public Listing? Listing { get; set; }
    }
}