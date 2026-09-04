namespace AirbnbClone.API.DTOs
{
    public class UpdateProfileDto
    {
        public string? Bio { get; set; }
        public IFormFile? ImageFile { get; set; }
    }

    public class ChangePasswordDto
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}