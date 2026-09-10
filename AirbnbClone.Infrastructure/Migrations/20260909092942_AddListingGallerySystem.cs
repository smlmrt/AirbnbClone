using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AirbnbClone.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddListingGallerySystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "ListingImages",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ListingImages",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "ListingImages");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ListingImages");
        }
    }
}
