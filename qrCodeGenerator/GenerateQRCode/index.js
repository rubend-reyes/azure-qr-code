Code Review & Suggested Improvements
While the code functions as intended, there are three significant areas for improvement regarding safety, efficiency, and correct web behavior.

1. Filename / Blob Name Sanitization (Critical)
Using the input URL as the filename is highly risky. URLs contain characters like slashes (/), question marks (?), and ampersands (&).

A slash (/) in a blob name will create "virtual directories" in Azure Storage. For example, google.com/search?q=test.png will create a folder called google.com and a file named search?q=test.png.

Fix: Hash the URL (e.g., using MD5 or SHA-256) or use a UUID for the blob name.

2. Unnecessary Base64 Conversion (Efficiency)
The code generates a Base64 string, runs a RegEx to parse it, and converts it back to a binary Buffer. The qrcode library has a built-in method to output a Buffer directly, skipping all this overhead.

Fix: Replace QRCode.toDataURL() with QRCode.toBuffer().

3. Missing Content-Type on Upload (Web Behavior)
Because the file is uploaded as a raw Buffer without specifying a Content-Type, Azure Storage defaults to application/octet-stream. When users click the resulting URL, their browser will force a file download rather than displaying the image inline.

Fix: Add blobHTTPHeaders to the upload options.
