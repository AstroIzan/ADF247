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
    public DbSet<CampaignForm> CampaignForms => Set<CampaignForm>();
    public DbSet<UserHoursSummary> UserHoursSummaries => Set<UserHoursSummary>();
    public DbSet<DeviceRegistration> DeviceRegistrations => Set<DeviceRegistration>();
    public DbSet<MessagingConfiguration> MessagingConfigurations => Set<MessagingConfiguration>();
    public DbSet<MessagingNotification> MessagingNotifications => Set<MessagingNotification>();
    public DbSet<NotificationDelivery> NotificationDeliveries => Set<NotificationDelivery>();
    public DbSet<RunbookExecution> RunbookExecutions => Set<RunbookExecution>();

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

        modelBuilder.Entity<CampaignForm>(entity =>
        {
            entity.ToTable("FormulariCampanya");
            entity.HasKey(form => form.Id);
            entity.Property(form => form.ServiceMoment).HasMaxLength(50);
            entity.Property(form => form.VoluntarisJson).IsRequired();
            entity.Property(form => form.VehiclesJson).IsRequired();
            entity.HasOne(form => form.Convocatoria).WithMany().HasForeignKey(form => form.ConvocatoriaId);
            entity.Property(form => form.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(form => form.UpdatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAddOrUpdate();
        });

        modelBuilder.Entity<UserHoursSummary>(entity =>
        {
            entity.ToTable("UserHoursSummary");
            entity.HasKey(summary => summary.Id);
            entity.HasIndex(summary => summary.UserId).IsUnique();
            entity.Property(summary => summary.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(summary => summary.UpdatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAddOrUpdate();
        });

        modelBuilder.Entity<DeviceRegistration>(entity =>
        {
            entity.ToTable("DeviceRegistration", "Messaging");
            entity.HasKey(registration => registration.Id);
            entity.HasIndex(registration => registration.Token).IsUnique();
            entity.Property(registration => registration.NCarnet).HasMaxLength(50);
            entity.Property(registration => registration.Platform).HasMaxLength(30);
            entity.Property(registration => registration.RegisteredAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(registration => registration.LastSeenAt).HasDefaultValueSql("sysutcdatetime()");
            entity.HasOne(registration => registration.User).WithMany().HasForeignKey(registration => registration.UserId);
        });

        modelBuilder.Entity<MessagingConfiguration>(entity =>
        {
            entity.ToTable("Configuration", "Messaging");
            entity.HasKey(configuration => configuration.Id);
            entity.HasIndex(configuration => configuration.Key).IsUnique();
            entity.Property(configuration => configuration.Key).HasMaxLength(100);
            entity.Property(configuration => configuration.Name).HasMaxLength(200);
            entity.Property(configuration => configuration.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(configuration => configuration.UpdatedAt).HasDefaultValueSql("sysutcdatetime()");
        });

        modelBuilder.Entity<MessagingNotification>(entity =>
        {
            entity.ToTable("Notification", "Messaging");
            entity.HasKey(notification => notification.Id);
            entity.Property(notification => notification.Trigger).HasMaxLength(50);
            entity.Property(notification => notification.Status).HasMaxLength(30);
            entity.HasOne(notification => notification.Configuration).WithMany().HasForeignKey(notification => notification.ConfigurationId);
            entity.HasOne(notification => notification.Convocatoria).WithMany().HasForeignKey(notification => notification.ConvocatoriaId);
            entity.HasOne(notification => notification.Actor).WithMany().HasForeignKey(notification => notification.ActorUserId);
        });

        modelBuilder.Entity<NotificationDelivery>(entity =>
        {
            entity.ToTable("NotificationDelivery", "Messaging");
            entity.HasKey(delivery => delivery.Id);
            entity.HasIndex(delivery => new { delivery.NotificationId, delivery.DeviceRegistrationId }).IsUnique();
            entity.Property(delivery => delivery.NCarnet).HasMaxLength(50);
            entity.Property(delivery => delivery.Status).HasMaxLength(30);
            entity.HasOne(delivery => delivery.Notification).WithMany().HasForeignKey(delivery => delivery.NotificationId);
            entity.HasOne(delivery => delivery.DeviceRegistration).WithMany().HasForeignKey(delivery => delivery.DeviceRegistrationId);
            entity.HasOne(delivery => delivery.User).WithMany().HasForeignKey(delivery => delivery.UserId);
        });

        modelBuilder.Entity<RunbookExecution>(entity =>
        {
            entity.ToTable("RunbookExecution", "Messaging");
            entity.HasKey(execution => execution.Id);
            entity.Property(execution => execution.RunbookKey).HasMaxLength(100);
            entity.Property(execution => execution.Trigger).HasMaxLength(30);
            entity.Property(execution => execution.Status).HasMaxLength(30);
        });
    }
}
