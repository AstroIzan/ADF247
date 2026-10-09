using ADF247.Api.Services;
using ADF247.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pla-alfa")]
public sealed class PlaAlfaController(PlaAlfaService plaAlfa, Adf247DbContext database) : ControllerBase
{
    [HttpGet("catalog")] public async Task<IActionResult> Catalog() => Ok(await plaAlfa.CatalogAsync());
    [HttpGet("municipalities")] public async Task<IActionResult> Status([FromQuery] string? refresh, [FromQuery] string? forceRefresh) => Ok(await plaAlfa.StatusAsync(IsTrue(refresh) || IsTrue(forceRefresh)));
    [HttpPut("municipalities")]
    public async Task<IActionResult> Update([FromBody] PlaAlfaRequest request)
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        if (string.IsNullOrWhiteSpace(carnet) || !await database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin)) return Forbid();
        return Ok(plaAlfa.Update(request.Municipalities, request.PrincipalMunicipality));
    }
    private static bool IsTrue(string? value) => value is not null && value.Trim().ToLowerInvariant() is "1" or "true" or "yes";
}
public sealed record PlaAlfaRequest(IReadOnlyList<string>? Municipalities, string? PrincipalMunicipality);
