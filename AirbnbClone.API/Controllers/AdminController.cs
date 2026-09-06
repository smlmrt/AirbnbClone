using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirbnbClone.API.Controllers
{
    // Sadece Role = "Admin" olan kullanıcılar buraya istek atabilir
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new { 
                    u.Id, 
                    Fullname = u.FirstName + " " + u.LastName,
                    u.Email, 
                    u.Role 
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("Kullanıcı bulunamadı.");

            // admin kendini silemez
            if (user.Role == "Admin") return BadRequest("Admin hesapları bu panelden silinemez.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Kullanıcı başarıyla silindi."});
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalListings = await _context.Listings.CountAsync();
            
            return Ok(new { Users = totalUsers, Listings = totalListings });
        }

        // Tüm İlanları Getir (Admin için)
        [HttpGet("listings")]
        public async Task<IActionResult> GetListings()
        {
            var listings = await _context.Listings
                .Select(l => new { 
                    l.Id, 
                    l.Title, 
                    l.City, 
                    l.PricePerNight, 
                    l.HostId})
                .ToListAsync();
            
            return Ok(listings);
        }

        // İlanı Sil 
        [HttpDelete("listings/{id}")]
        public async Task<IActionResult> DeleteListing(int id)
        {
            var listing = await _context.Listings.FindAsync(id);
            if (listing == null) return NotFound("İlan bulunamadı.");

            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync();

            return Ok( new { message = "İlan başarıyla silindi." });
        }
    }
}