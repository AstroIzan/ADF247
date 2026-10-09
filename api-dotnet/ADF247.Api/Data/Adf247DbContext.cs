using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Data;

public sealed class Adf247DbContext(DbContextOptions<Adf247DbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<AvailabilityWindow> AvailabilityWindows => Set<AvailabilityWindow>();
    public DbSet<Convocatoria> Convocatorias => Set<Convocatoria>();
    public DbSet<ConvoType> ConvoTypes => Set<ConvoType>();
    public DbSet<Respuesta> Respuestas => Set<Respuesta>();

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

        modelBuilder.Entity<AvailabilityWindow>(entity =>
        {
            entity.ToTable("AvailabilityWindow");
            entity.HasKey(window => window.Id);
            entity.Property(window => window.UserNCarnet).HasMaxLength(50);
            entity.Property(window => window.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(window => window.UpdatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAddOrUpdate();
            entity.HasOne(window => window.User)
                .WithMany()
                .HasForeignKey(window => window.UserNCarnet)
                .HasPrincipalKey(user => user.NCarnet);
        });

        modelBuilder.Entity<ConvoType>(entity =>
        {
            entity.ToTable("ConvoType");
            entity.HasKey(type => type.Id);
            entity.Property(type => type.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Convocatoria>(entity =>
        {
            entity.ToTable("Convocatoria");
            entity.HasKey(convocatoria => convocatoria.Id);
            entity.HasOne(convocatoria => convocatoria.ConvoType)
                .WithMany()
                .HasForeignKey(convocatoria => convocatoria.ConvoTypeId);
            entity.HasOne(convocatoria => convocatoria.Responsable)
                .WithMany()
                .HasForeignKey(convocatoria => convocatoria.ResponsableId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Respuesta>(entity =>
        {
            entity.ToTable("Respuesta");
            entity.HasKey(respuesta => respuesta.Id);
            entity.Property(respuesta => respuesta.UserNCarnet).HasMaxLength(50);
            entity.HasOne(respuesta => respuesta.Convocatoria)
                .WithMany()
                .HasForeignKey(respuesta => respuesta.ConvoId);
            entity.HasOne(respuesta => respuesta.User)
                .WithMany()
                .HasForeignKey(respuesta => respuesta.UserNCarnet)
                .HasPrincipalKey(user => user.NCarnet);
        });
    }
}
