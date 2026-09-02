using AirbnbClone.API.DTOs;
using AirbnbClone.Core.Entities;
using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace AirbnbClone.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // ilana ait tüm yorumları getirir
        [HttpGet("{listingId}")]
        public async Task<IActionResult> GetReviews(int listingId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ListingId == listingId)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedDate,
                    Username = r.User != null ? r.User.Email : "Anonim Kullanıcı"
                })
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();

            return Ok(reviews);
        }

        // yalnızca konaklayan misafirler için yorum ekleme
        [Authorize]
        [HttpPost("{listingId}")]
        public async Task<IActionResult> AddReview(int listingId, [FromBody] CreateReviewDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int userId = int.Parse(userIdStr);

            // Güvenlik kontorlü 1: kullanıcı gerçekten rezervasyon yapmış mı?
            bool hasBooked = await _context.Bookings.AnyAsync(b => b.ListingId == listingId && b.UserId == userId);

            if (!hasBooked)
            {
                return BadRequest("Sadece bu evde konaklamış misafirler yorum yapabilir.");
            }

            // Güvenlik Kontrolü 2: Kullanıcı daha önce yorum yapmış mı?
            bool hasReviewed = await _context.Reviews.AnyAsync(r => r.ListingId == listingId && r.UserId == userId);

            if (hasReviewed)
            {
                return BadRequest("Bu ev için zaten bir değerlendirme yaptınız.");
            }

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest("Puan 1 ile 5 arasında olmalıdır.");
            }

            var review = new Review
            {
                ListingId = listingId,
                UserId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedDate = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Değerlendirmeniz başarıyla eklendi."});
        }
    }
}