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

        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalListings = await _context.Listings.CountAsync();
            
            return Ok(new { Users = totalUsers, Listings = totalListings });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.Role })
                .ToListAsync();
            return Ok(users);
        }

        // Tüm İlanları Getir (Admin için)
        [HttpGet("listings")]
        public async Task<IActionResult> GetAllListing()
        {
            var listings = await _context.Listings
                .Select(l => new { l.Id, l.Title, l.City, l.PricePerNight, l.HostId})
                .ToListAsync();
            
            return Ok(listings);
        }

        // İlanı Zorla Sil (Admin Yetkisiyle)
        [HttpDelete("listings/{id}")]
        public async Task<IActionResult> ForceDeleteListing(int id)
        {
            var listing = await _context.Listings.FindAsync(id);
            if (listing == null) return NotFound("İlan bulunamadı.");

            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync();

            return Ok( new { message = "İlan sistemden kalıcı olarak silindi." });
        }
    }
}