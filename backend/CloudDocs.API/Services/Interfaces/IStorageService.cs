namespace CloudDocs.API.Services.Interfaces;

public interface IStorageService
{
    string GeneratePresignedUploadUrl(string fileKey, string contentType);
}