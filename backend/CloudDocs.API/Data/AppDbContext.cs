using Microsoft.EntityFrameworkCore;
using CloudDocs.API.Models;

namespace CloudDocs.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Document> Documents => Set<Document>();
}