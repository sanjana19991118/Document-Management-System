using Amazon.S3;
using Amazon.S3.Model;
using CloudDocs.API.Services.Interfaces;

namespace CloudDocs.API.Services;

public class StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public StorageService(IAmazonS3 s3Client, IConfiguration config)
    {
        _s3Client = s3Client;
        _bucketName = config["AWS:S3:BucketName"] 
            ?? throw new ArgumentNullException("AWS:S3:BucketName configuration missing.");
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