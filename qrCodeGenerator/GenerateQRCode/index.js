const QRCode = require('qrcode');
const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('crypto'); // Built-in Node.js library for hashing

const connectionString = process.env.STORAGE_CONNECTION_STRING;

module.exports = async function (context, req) {
    context.log('Generating QR code');

    const url = (req.query.url || (req.body && req.body.url));
    if (!url) {
        context.res = {
            status: 400,
            body: "Please pass a url on the query string or in the request body"
        };
        return;
    }

    try {
        // 1. Generate QR Code directly to a Buffer (much faster, no RegEx needed)
        const buffer = await QRCode.toBuffer(url);

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('qr-codes');
        await containerClient.createIfNotExists({ access: 'blob' });

        // 2. Hash the URL to create a safe, filesystem-friendly blob name
        const hash = crypto.createHash('md5').update(url).digest('hex');
        const blobName = `${hash}.png`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // 3. Upload with correct Content-Type so browsers display the image
        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: 'image/png' }
        });

        context.res = {
            status: 200,
            body: { qr_code_url: blockBlobClient.url },
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        context.log.error('QR Code Generation Error:', error);
        context.res = {
            status: 500,
            body: `Error: ${error.message}`
        };
    }
};
