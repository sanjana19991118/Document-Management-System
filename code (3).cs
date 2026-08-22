// Services/StorageService.cs
using Amazon.S3;
using Amazon.S3.Model;

namespace CloudDocs.API.Services;

public class StorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName = "your-app-upload-bucket";

    public StorageService(IAmazonS3 s3Client)
    {
        _s3Client = s3Client;
    }

    public string GeneratePresignedUploadUrl(string fileKey, string contentType)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = fileKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(15),
            ContentType = contentType
        };

        return _s3Client.GetPreSignedURL(request);
    }
}