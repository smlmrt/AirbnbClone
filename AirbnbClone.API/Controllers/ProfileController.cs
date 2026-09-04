using AirbnbClone.API.DTOs;
using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace AirbnbClone.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProfileController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _context.Users.FindAsync(int.Parse(userIdStr));
            if (user == null) return NotFound();

            return Ok(new { 
                FullName = $"{user.FirstName} {user.LastName}", 
                user.Email, 
                user.Bio, 
                user.ProfileImageUrl 
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _context.Users.FindAsync(int.Parse(userIdStr!));
            if (user == null) return NotFound();

            user.Bio = dto.Bio;

            if (dto.ImageFile != null)
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + dto.ImageFile.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ImageFile.CopyToAsync(fileStream);
                }

                var request = HttpContext.Request;
                user.ProfileImageUrl = $"{request.Scheme}://{request.Host}/uploads/{uniqueFileName}";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profil güncellendi.", imageUrl = user.ProfileImageUrl });
        }


        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _context.Users.FindAsync(int.Parse(userIdStr!));
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
            {
                return BadRequest("Mevcut Şifreniz yanlış.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şifreniz başarıyla değiştirildi." });
        }
    }
}