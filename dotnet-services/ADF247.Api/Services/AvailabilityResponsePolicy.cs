using ADF247.Api.Models;

namespace ADF247.Api.Services;

public static class AvailabilityResponsePolicy
{
    private const double MinimumCoverageRatio = .75;

    public static AutomaticAvailabilityResponse? Evaluate(
        DateTime start,
        DateTime end,
        IEnumerable<AvailabilityWindow> windows)
    {
        if (end <= start)
            return null;

        var available = windows
            .Where(window => window.AvailabilityType == "available")
            .Select(window => Clip(window.FromDateTime, window.ToDateTime, start, end))
            .Where(interval => interval is not null)
            .Select(interval => interval!.Value)
            .ToArray();
        var unavailable = windows
            .Where(window => window.AvailabilityType == "unavailable")
            .Select(window => Clip(window.FromDateTime, window.ToDateTime, start, end))
            .Where(interval => interval is not null)
            .Select(interval => interval!.Value)
            .ToArray();

        if (available.Length == 0)
        {
            return unavailable.Length == 0
                ? null
                : new AutomaticAvailabilityResponse(false, false, false, null, "unavailable-window-match");
        }

        var coveredIntervals = Subtract(Merge(available), Merge(unavailable));
        var coveredMinutes = coveredIntervals.Sum(interval => (interval.End - interval.Start).TotalMinutes);
        var totalMinutes = (end - start).TotalMinutes;
        if (coveredMinutes / totalMinutes < MinimumCoverageRatio)
            return new AutomaticAvailabilityResponse(false, false, false, null, "available-window-under-75-percent");

        var fullSchedule = coveredMinutes >= totalMinutes;
        var firstAvailability = coveredIntervals.Min(interval => interval.Start);
        var lastAvailability = coveredIntervals.Max(interval => interval.End);
        var customText = fullSchedule
            ? null
            : $"Disponible a partir de {firstAvailability:HH:mm} fins a {lastAvailability:HH:mm}.";

        return new AutomaticAvailabilityResponse(
            true,
            !fullSchedule,
            fullSchedule,
            customText,
            fullSchedule ? "available-window-full-coverage" : "available-window-partial-coverage");
    }

    private static (DateTime Start, DateTime End)? Clip(DateTime from, DateTime to, DateTime start, DateTime end)
    {
        var intervalStart = from > start ? from : start;
        var intervalEnd = to < end ? to : end;
        return intervalEnd > intervalStart ? (intervalStart, intervalEnd) : null;
    }

    private static IReadOnlyList<(DateTime Start, DateTime End)> Merge(IEnumerable<(DateTime Start, DateTime End)> intervals)
    {
        var merged = new List<(DateTime Start, DateTime End)>();
        foreach (var interval in intervals.OrderBy(interval => interval.Start).ThenBy(interval => interval.End))
        {
            if (merged.Count == 0 || interval.Start > merged[^1].End)
            {
                merged.Add(interval);
                continue;
            }

            merged[^1] = (merged[^1].Start, interval.End > merged[^1].End ? interval.End : merged[^1].End);
        }

        return merged;
    }

    private static IReadOnlyList<(DateTime Start, DateTime End)> Subtract(
        IReadOnlyList<(DateTime Start, DateTime End)> sources,
        IReadOnlyList<(DateTime Start, DateTime End)> exclusions)
    {
        var remaining = new List<(DateTime Start, DateTime End)>();
        foreach (var source in sources)
        {
            var fragments = new List<(DateTime Start, DateTime End)> { source };
            foreach (var exclusion in exclusions)
            {
                fragments = fragments.SelectMany(fragment =>
                {
                    if (exclusion.End <= fragment.Start || exclusion.Start >= fragment.End)
                        return [fragment];

                    var result = new List<(DateTime Start, DateTime End)>();
                    if (exclusion.Start > fragment.Start) result.Add((fragment.Start, exclusion.Start));
                    if (exclusion.End < fragment.End) result.Add((exclusion.End, fragment.End));
                    return result;
                }).ToList();
            }

            remaining.AddRange(fragments);
        }

        return remaining;
    }
}

public sealed record AutomaticAvailabilityResponse(
    bool Response,
    bool IsCustom,
    bool FullSchedule,
    string? CustomText,
    string Reason);
