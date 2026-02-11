// src/services/s3Service.js
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/aws');

class S3Service {
  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(key, fileBuffer, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    try {
      await s3Client.send(command);
      return {
        bucket: this.bucket,
        key: key,
        url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Generate pre-signed URL for file download
   */
  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Generate S3 key for well file
   */
  generateKey(wellId, filename) {
    return `wells/${wellId}/${filename}`;
  }
}

module.exports = new S3Service();