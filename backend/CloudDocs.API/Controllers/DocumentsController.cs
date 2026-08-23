using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudDocs.API.Data;
using CloudDocs.API.Models;
using CloudDocs.API.Services.Interfaces;

namespace CloudDocs.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;

    public DocumentsController(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    [HttpPost("presigned-url")]
    public IActionResult GetUploadUrl([FromBody] UploadRequest request)
    {
        var s3Key = $"uploads/{Guid.NewGuid()}-{request.FileName}";
        var uploadUrl = _storage.GeneratePresignedUploadUrl(s3Key, request.ContentType);

        return Ok(new { uploadUrl, s3Key });
    }

    [HttpPost]
    public async Task<IActionResult> SaveMetadata([FromBody] Document doc)
    {
        _db.Documents.Add(doc);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = doc.Id }, doc);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _db.Documents.OrderByDescending(d => d.UploadedAt).ToListAsync();
        return Ok(docs);
    }
}

public record UploadRequest(string FileName, string ContentType);