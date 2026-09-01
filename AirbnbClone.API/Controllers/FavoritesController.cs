using AirbnbClone.Core.Entities;
using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace AirbnbClone.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _context;
        
        public FavoritesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("{listingId}")]
        public async Task<IActionResult> ToggleFavorite(int listingId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int userId = int.Parse(userIdStr);
            var existingFav = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);
            
            if (existingFav != null)
            {
                _context.Favorites.Remove(existingFav);
                await _context.SaveChangesAsync();
                return Ok(new { isFavorite = false, message = "Favorilerden çıkarıldı."});
            }

            _context.Favorites.Add(new Favorite { UserId = userId, ListingId = listingId, CreatedDate = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = true, message = "Favorilere eklendi."});
        }

        [HttpGet]
        public async Task<IActionResult> GetMyFavorites()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int userId = int.Parse(userIdStr);
            var favorites = await _context.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.Listing)
                .Select(f => f.Listing)
                .ToListAsync();
            
            return Ok(favorites);
        }

    }
}