using Microsoft.AspNetCore.Http;

namespace AirbnbClone.API.DTOs
{
    public class CreateExperienceDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = null!;
        public decimal PricePerPerson { get; set; }
        public int DurationHours { get; set; } 
        public int MaxGroupSize { get; set; } 
        public IFormFile? ImageFile { get; set; } 
    }
}