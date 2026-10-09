using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Data;

public sealed class Adf247DbContext(DbContextOptions<Adf247DbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("User");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.NCarnet).IsUnique();
            entity.Property(user => user.NCarnet).HasMaxLength(50);
            entity.Property(user => user.Name).IsRequired();
            entity.Property(user => user.Password).IsRequired();
            entity.HasMany(user => user.Roles)
                .WithOne(role => role.User)
                .HasForeignKey(role => role.NCarnet)
                .HasPrincipalKey(user => user.NCarnet);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Role");
            entity.HasKey(role => role.Id);
            entity.Property(role => role.NCarnet).HasMaxLength(50);
        });
    }
}
