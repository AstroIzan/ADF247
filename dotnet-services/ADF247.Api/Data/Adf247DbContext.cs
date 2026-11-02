using ADF247.Api.Models;
using ADF247.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Data;

public sealed class Adf247DbContext(DbContextOptions<Adf247DbContext> options, CurrentAdf currentAdf) : DbContext(options)
{
    private int? CurrentAdfId => currentAdf.AdfId;
    public DbSet<Adf> Adfs => Set<Adf>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<AvailabilityWindow> AvailabilityWindows => Set<AvailabilityWindow>();
    public DbSet<Convocatoria> Convocatorias => Set<Convocatoria>();
    public DbSet<ConvoType> ConvoTypes => Set<ConvoType>();
    public DbSet<Respuesta> Respuestas => Set<Respuesta>();
    public DbSet<CampaignForm> CampaignForms => Set<CampaignForm>();
    public DbSet<Intervencio> Intervencions => Set<Intervencio>();
    public DbSet<TypeIncendi> TypeIncendis => Set<TypeIncendi>();
    public DbSet<UserHoursSummary> UserHoursSummaries => Set<UserHoursSummary>();
    public DbSet<SystemConfiguration> SystemConfigurations => Set<SystemConfiguration>();
    public DbSet<PlaAlfaMunicipalitySelection> PlaAlfaMunicipalitySelections => Set<PlaAlfaMunicipalitySelection>();
    public DbSet<DeviceRegistration> DeviceRegistrations => Set<DeviceRegistration>();
    public DbSet<MessagingConfiguration> MessagingConfigurations => Set<MessagingConfiguration>();
    public DbSet<MessagingNotification> MessagingNotifications => Set<MessagingNotification>();
    public DbSet<NotificationDelivery> NotificationDeliveries => Set<NotificationDelivery>();
    public DbSet<TaskDefinition> TaskDefinitions => Set<TaskDefinition>();
    public DbSet<TaskExecution> TaskExecutions => Set<TaskExecution>();
    public DbSet<TaskExecutionDetail> TaskExecutionDetails => Set<TaskExecutionDetail>();
    public DbSet<ManualBatchRunRequest> ManualBatchRunRequests => Set<ManualBatchRunRequest>();

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        await StampAdfAsync(cancellationToken);
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private async Task StampAdfAsync(CancellationToken cancellationToken)
    {
        var entries = ChangeTracker.Entries().Where(entry => entry.State == EntityState.Added).ToList();
        if (entries.Count == 0) return;

        foreach (var entry in entries)
        {
            switch (entry.Entity)
            {
                case Convocatoria { AdfId: 0 } convocatoria:
                    convocatoria.AdfId = CurrentAdfId ?? throw new InvalidOperationException("No se ha podido determinar la ADF de la convocatoria.");
                    break;
                case Intervencio { AdfId: 0 } intervencio:
                    intervencio.AdfId = CurrentAdfId ?? throw new InvalidOperationException("No se ha podido determinar la ADF de la intervención.");
                    break;
                case PlaAlfaMunicipalitySelection { AdfId: 0 } selection:
                    selection.AdfId = CurrentAdfId ?? throw new InvalidOperationException("No se ha podido determinar la ADF del Pla Alfa.");
                    break;
                case User { AdfId: 0, Adf: null } user:
                    user.AdfId = CurrentAdfId
                        ?? await Adfs.OrderBy(adf => adf.Number).Select(adf => adf.Id).FirstOrDefaultAsync(cancellationToken);
                    if (user.AdfId == 0) throw new InvalidOperationException("No existe ninguna ADF configurada.");
                    break;
            }
        }

        var pending = entries.Select(entry => entry.Entity).OfType<Respuesta>().Where(respuesta => respuesta.AdfId == 0).ToList();
        if (pending.Count == 0) return;

        var convoIds = pending.Select(respuesta => respuesta.ConvoId).Distinct().ToList();
        var adfByConvo = await Convocatorias.IgnoreQueryFilters()
            .Where(convocatoria => convoIds.Contains(convocatoria.Id))
            .ToDictionaryAsync(convocatoria => convocatoria.Id, convocatoria => convocatoria.AdfId, cancellationToken);
        foreach (var respuesta in pending)
        {
            respuesta.AdfId = adfByConvo.TryGetValue(respuesta.ConvoId, out var adfId)
                ? adfId
                : CurrentAdfId ?? throw new InvalidOperationException("No se ha podido determinar la ADF de la respuesta.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Adf>(entity =>
        {
            entity.ToTable("ADF");
            entity.HasKey(adf => adf.Id);
            entity.HasIndex(adf => adf.Number).IsUnique();
            entity.Property(adf => adf.Name).HasMaxLength(200).IsRequired();
            entity.Property(adf => adf.MunicipalitiesJson).HasColumnName("municipalities").IsRequired();
            entity.Property(adf => adf.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(adf => adf.UpdatedAt).ValueGeneratedNever();
        });
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("User");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.NCarnet).IsUnique();
            entity.HasOne(user => user.Adf).WithMany().HasForeignKey(user => user.AdfId).OnDelete(DeleteBehavior.NoAction);
            entity.HasQueryFilter(user => CurrentAdfId == null || user.AdfId == CurrentAdfId);
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
            entity.HasQueryFilter(window => CurrentAdfId == null || window.User!.AdfId == CurrentAdfId);
            entity.Property(window => window.CreatedAt).ValueGeneratedNever();
            entity.Property(window => window.UpdatedAt).ValueGeneratedNever();
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
            entity.HasQueryFilter(convocatoria => CurrentAdfId == null || convocatoria.AdfId == CurrentAdfId);
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
            entity.HasQueryFilter(respuesta => CurrentAdfId == null || respuesta.AdfId == CurrentAdfId);
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
            entity.Property(form => form.UpdatedAt).ValueGeneratedNever();
        });

        modelBuilder.Entity<TypeIncendi>(entity =>
        {
            entity.ToTable("TypeIncendis");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Name).HasMaxLength(150).IsRequired();
        });

        modelBuilder.Entity<Intervencio>(entity =>
        {
            entity.ToTable("Intervencions");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Date).HasColumnType("date");
            entity.Property(item => item.NoticeTime).HasColumnType("time(0)");
            entity.Property(item => item.StartTime).HasColumnType("time(0)");
            entity.Property(item => item.EndTime).HasColumnType("time(0)");
            entity.Property(item => item.Surface).HasPrecision(12, 2);
            entity.Property(item => item.ResponsableName).HasMaxLength(200);
            entity.Property(item => item.ResponsableAdf).HasMaxLength(200);
            entity.Property(item => item.MapsUrl).HasMaxLength(500);
            entity.Property(item => item.Municipality).HasMaxLength(200);
            entity.Property(item => item.Sector).HasMaxLength(200);
            entity.Property(item => item.Comarca).HasMaxLength(200);
            entity.Property(item => item.CreatedByNCarnet).HasMaxLength(50);
            entity.HasOne(item => item.Convocatoria).WithMany().HasForeignKey(item => item.ConvocatoriaId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(item => item.Responsable).WithMany().HasForeignKey(item => item.ResponsableUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(item => item.TypeIncendi).WithMany().HasForeignKey(item => item.TypeIncendiId).OnDelete(DeleteBehavior.NoAction);
            entity.HasQueryFilter(item => CurrentAdfId == null || item.AdfId == CurrentAdfId);
            entity.Property(item => item.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(item => item.UpdatedAt).ValueGeneratedNever();
        });

        modelBuilder.Entity<UserHoursSummary>(entity =>
        {
            entity.ToTable("UserHoursSummary");
            entity.HasKey(summary => summary.Id);
            entity.HasIndex(summary => summary.UserId).IsUnique();
            entity.Property(summary => summary.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(summary => summary.UpdatedAt).ValueGeneratedNever();
        });

        modelBuilder.Entity<SystemConfiguration>(entity =>
        {
            entity.ToTable("SystemConfiguration");
            entity.HasKey(configuration => configuration.Id);
            entity.Property(configuration => configuration.WeeklyConvoTypeIdsJson).IsRequired();
            entity.Property(configuration => configuration.CampaignHoursConvoTypeIdsJson).IsRequired();
            entity.Property(configuration => configuration.WeeklyConvocatoriaSchedulesJson).IsRequired();
            entity.Property(configuration => configuration.AvailabilityManagerNCarnetsJson).IsRequired();
            entity.Property(configuration => configuration.VehicleCatalogJson).IsRequired();
            entity.Property(configuration => configuration.UnansweredPenaltyHours).HasPrecision(5, 2);
            entity.Property(configuration => configuration.NoShowPenaltyHours).HasPrecision(5, 2);
            entity.Property(configuration => configuration.UpdatedAt).ValueGeneratedNever();
        });

        modelBuilder.Entity<PlaAlfaMunicipalitySelection>(entity =>
        {
            entity.ToTable("MunicipalitySelection", "PlaAlfa");
            entity.HasKey(selection => new { selection.AdfId, selection.Municipality });
            entity.HasQueryFilter(selection => CurrentAdfId == null || selection.AdfId == CurrentAdfId);
            entity.Property(selection => selection.Municipality).HasMaxLength(200);
            entity.Property(selection => selection.UpdatedAt).HasDefaultValueSql("sysutcdatetime()");
        });

        modelBuilder.Entity<DeviceRegistration>(entity =>
        {
            entity.ToTable("DeviceRegistration", "Messaging");
            entity.HasKey(registration => registration.Id);
            entity.HasIndex(registration => registration.Token).IsUnique();
            entity.Property(registration => registration.NCarnet).HasMaxLength(50);
            entity.Property(registration => registration.Token).HasMaxLength(450);
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

        modelBuilder.Entity<TaskDefinition>(entity =>
        {
            entity.ToTable("TaskDefinition", "Taskling");
            entity.HasKey(definition => definition.TaskDefinitionId);
            entity.HasIndex(definition => definition.Name).IsUnique();
            entity.Property(definition => definition.Name).HasMaxLength(200);
            entity.Property(definition => definition.CreatedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<TaskExecution>(entity =>
        {
            entity.ToTable("TaskExecution", "Taskling");
            entity.HasKey(execution => execution.TaskExecutionId);
            entity.HasIndex(execution => new { execution.TaskDefinitionId, execution.StartedAt });
            entity.Property(execution => execution.FinalStatus).HasMaxLength(30);
            entity.Property(execution => execution.StartedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.Property(execution => execution.LastKeepAlive).HasDefaultValueSql("sysutcdatetime()");
            entity.HasOne(execution => execution.TaskDefinition)
                .WithMany(definition => definition.Executions)
                .HasForeignKey(execution => execution.TaskDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TaskExecutionDetail>(entity =>
        {
            entity.ToTable("TaskExecutionDetail", "Taskling");
            entity.HasKey(detail => detail.TaskExecutionDetailId);
            entity.HasIndex(detail => new { detail.TaskExecutionId, detail.OccurredAt });
            entity.Property(detail => detail.OccurredAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
            entity.HasOne(detail => detail.TaskExecution)
                .WithMany(execution => execution.Details)
                .HasForeignKey(detail => detail.TaskExecutionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ManualBatchRunRequest>(entity =>
        {
            entity.ToTable("ManualRunRequest", "Taskling");
            entity.HasKey(request => request.Id);
            entity.Property(request => request.RequestedByNCarnet).HasMaxLength(50);
            entity.Property(request => request.Runbook).HasMaxLength(50).HasDefaultValue("all");
            entity.Property(request => request.RequestedAt).HasDefaultValueSql("sysutcdatetime()").ValueGeneratedOnAdd();
        });
    }
}
