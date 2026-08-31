using AirbnbClone.API.DTOs;
using AirbnbClone.Core.Entities;
using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AirbnbClone.API.Controllers
{
    [Authorize] // Sadece sisteme giriş yapmış kullanıcılar rezervasyon yapabilir.
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int guestId = int.Parse(userIdStr);
            var listing = await _context.Listings.FindAsync(dto.ListingId);

            if (listing == null) return NotFound("İlan bulunamadı.");

            if (listing.HostId == guestId) return BadRequest("Kendi evinize rezervasyon yapamazsınız.");
            if (dto.StartDate >= dto.EndDate) return BadRequest("Çıkış tarihi, giriş tarihinden sonra olmalıdır.");

            // Tarih çakışması algoritması
            bool isBooked = await _context.Bookings.AnyAsync(b => 
                b.ListingId == dto.ListingId &&
                b.StartDate < dto.EndDate &&
                b.EndDate > dto.StartDate);
            
            if (isBooked) return BadRequest("Bu tarihler arasında ev maalesef dolu.");

            int totalNights = (dto.EndDate - dto.StartDate).Days;
            decimal totalPrice = listing.PricePerNight * totalNights;

            var booking = new Booking
            {
                ListingId = dto.ListingId,
                UserId = guestId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalPrice = totalPrice,
                CreatedDate = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Rezervasyon başarıyla onaylandı!", bookingId = booking.Id });
        }

        // Seyahatlarim sayfası için kullanıcının kendi rezervasyonlarını getiren uç nokta
        [HttpGet("my-trips")]
        public async Task<IActionResult> GetMyTrips()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            
            int guestId = int.Parse(userIdStr);
            
            var trips = await _context.Bookings
                .Include(b => b.Listing) 
                .Where(b => b.UserId == guestId)
                .Select(b => new {
                    b.Id,
                    b.StartDate,
                    b.EndDate,
                    b.TotalPrice,
                    // Eğer Listing silinmişse veya null gelirse kodun çökmesini engelliyoruz
                    ListingTitle = b.Listing != null ? b.Listing.Title : "İlan Bulunamadı",
                    City = b.Listing != null ? b.Listing.City : "Bilinmeyen Konum",
                    ImageUrl = b.Listing != null ? b.Listing.ImageUrl : ""
                })
                .ToListAsync();
                
            return Ok(trips);
        }

    }
}