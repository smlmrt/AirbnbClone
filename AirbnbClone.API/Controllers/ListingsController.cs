using AirbnbClone.Core.Entities;
using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using AirbnbClone.API.DTOs;

namespace AirbnbClone.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ListingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ListingsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Tüm İlanları Getir (GET)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Listing>>> GetListings()
        {
            var listings = await _context.Listings
                .Include(l => l.Images)
                .Where(l => l.IsActive)
                .ToListAsync();
            
            return Ok(listings);
        }

        // 2. ID'ye Göre Tek Bir İlan Getir (GET)
        [HttpGet("{id}")]
        public async Task<ActionResult<Listing>> GetListing(int id)
        {
            var listing = await _context.Listings
                .Include(l => l.Images)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (listing == null)
            {
                return NotFound("İlan bulunamadı.");
            }

            return Ok(listing);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Listing>> CreateListing([FromForm] CreateListingDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var listingImages = new List<ListingImage>();
            string primaryImageUrl = "";

            // Çoklu dosya kontrolü ve yükleme döngüsü
            if (dto.ImageFiles != null && dto.ImageFiles.Count > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);
                
                bool isFirst = true;
                foreach (var file in dto.ImageFiles)
                {
                    var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                    
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(fileStream);
                    }
                    
                    var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
                    
                    listingImages.Add(new ListingImage 
                    { 
                        ImageUrl = fileUrl,
                        IsCover = isFirst 
                    });

                    // Eski arayüzün bozulmaması için ilk görseli ana URL olarak saklıyoruz
                    if (isFirst) primaryImageUrl = fileUrl;
                    
                    isFirst = false;
                }
            }

            var newListing = new Listing
            {
                Title = dto.Title,
                City = dto.City,
                Country = dto.Country,
                PropertyType = dto.PropertyType,
                PricePerNight = dto.PricePerNight,
                HostId = int.Parse(userIdClaim),
                IsActive = true,
                Description = dto.Description,
                FullAddress = dto.FullAddress,
                MaxGuests = dto.MaxGuests,
                Bedrooms = dto.Bedrooms,
                Beds = dto.Beds,
                Bathrooms = dto.Bathrooms,
                ImageUrl = primaryImageUrl, 
                Images = listingImages 
            };

            _context.Listings.Add(newListing);
            await _context.SaveChangesAsync();

            return Ok(newListing);
        }


        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteListing(int id)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var listing = await _context.Listings.FindAsync(id);

            if (listing == null) 
                return NotFound("İlan bulunamadı.");
                
            // Sadece ilanı ekleyen kişi silebilir
            if (listing.HostId.ToString() != userIdClaim) 
                return Forbid("Bu ilanı silme yetkiniz yok.");

            // İlanı veritabanından kaldır
            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync();

            return Ok(new { message = "İlan başarıyla silindi." });
        }

        [Authorize]
        [HttpGet("my-listings")]
        public async Task<IActionResult> GetMyListings()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int hostId = int.Parse(userIdStr);

            var listings = await _context.Listings
                .Where(l => l.HostId == hostId)
                .ToListAsync();
            
            return Ok(listings);
        }

        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchListings([FromQuery] string? city, [FromQuery] decimal? maxPrice, [FromQuery] int? guests)
        {
            var query = _context.Listings.AsQueryable();

            if (maxPrice.HasValue && maxPrice > 0)
            {
                query = query.Where(l => l.PricePerNight <= maxPrice.Value);
            }

            if (guests.HasValue && guests > 0)
            {
                query = query.Where(l => l.MaxGuests >= guests.Value || l.MaxGuests == 0);
            }

            var results = await query.OrderByDescending(l => l.Id).ToListAsync();

            if (!string.IsNullOrEmpty(city))
            {
                results = results
                    .Where(l => l.City.Contains(city, StringComparison.CurrentCultureIgnoreCase))
                    .ToList();
            }

            return Ok(results);
        }
    }
}