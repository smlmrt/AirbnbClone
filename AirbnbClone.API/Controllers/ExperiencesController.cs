using AirbnbClone.API.DTOs;
using AirbnbClone.Core.Entities;
using AirbnbClone.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IO;


namespace AirbnbClone.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExperiencesController : ControllerBase
    {
        private readonly AppDbContext _context; 

        public ExperiencesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Experience>>> GetExperiences(){
            var experiences = await _context.Experiences.ToListAsync();
            return Ok(experiences);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Experience>> GetExperience(int id)
        {
            var experience = await _context.Experiences.FirstOrDefaultAsync(e => e.Id == id);

            if (experience == null)
                return NotFound("Etkinlik bulunamadı.");

            return Ok(experience);
        }

        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchExperiences([FromQuery] string? location, [FromQuery] decimal? maxPrice, [FromQuery] int? groupSize)
        {
            var query = _context.Experiences.AsQueryable();

            if (maxPrice.HasValue && maxPrice > 0)
            {
                query = query.Where(e => e.PricePerPerson <= maxPrice.Value);
            }

            if (groupSize.HasValue && groupSize > 0)
            {
                query = query.Where(e => e.MaxGroupSize >= groupSize.Value);
            }

            var results = await query.OrderByDescending(e => e.Id).ToListAsync();

            if (!string.IsNullOrEmpty(location))
            {
                results = results
                    .Where(e => e.Location.Contains(location, StringComparison.CurrentCultureIgnoreCase))
                    .ToList();
            }

            return Ok(results);
        }

        [Authorize]
        [HttpGet("my-experiences")]
        public async Task<IActionResult> GetMyExperiences()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            int hostId = int.Parse(userIdStr);

            var experiences = await _context.Experiences
                .Where(e => e.HostId == hostId)
                .ToListAsync();

            return Ok(experiences);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Experience>> CreateExperience([FromForm] CreateExperienceDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            string ImageUrl = "";
            if (dto.ImageFile != null)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                var uniqueFileName = Guid.NewGuid().ToString() + "_" + dto.ImageFile.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ImageFile.CopyToAsync(fileStream);
                }

                ImageUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
            }

            var newExperience = new Experience
            {
                Title = dto.Title,
                Description = dto.Description,
                Location = dto.Location,
                PricePerPerson = dto.PricePerPerson,
                DurationHours = dto.DurationHours,
                MaxGroupSize = dto.MaxGroupSize,
                ImageUrl = ImageUrl,
                HostId = int.Parse(userIdClaim),
                
                // BaseEntity'den gelen zorunlu alanları güvenceye alıyoruz
                CreatedDate = DateTime.UtcNow,
                IsDeleted = false 
            };

            _context.Experiences.Add(newExperience);
            await _context.SaveChangesAsync();

            return Ok(newExperience);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExperience(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var experience = await _context.Experiences.FindAsync(id);

            if (experience == null)
                return NotFound("Etkinlik bulunamadı.");

            if (experience.HostId.ToString() != userIdClaim)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Bu etkinliği silme yetkiniz yok." });

            _context.Experiences.Remove(experience);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Etkinlik başarıyla silindi." });
        }

    }

}