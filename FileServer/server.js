const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const path = require('path');

// Create a new file store instance
const fileStore = new FileStore({
    directory: path.resolve(__dirname, 'files') // Store files in ./files directory
});

// Create and configure the server
const server = new Server({
    path: '/files',
    datastore: fileStore,
    
    // Optional: Configure maximum file size (in bytes)
    // maxSize: 1024 * 1024 * 1024, // 1GB
    // namingFunction: (req) => {
    //     // Ensure we have a valid upload ID
    //     if (!req.uploadId) {
    //         req.uploadId = Math.random().toString(36).substring(2, 15);
    //     }

    //     const originalName = req.headers['upload-metadata']?.split(' ')
    //         .find(pair => pair.startsWith('filename'))
    //         ?.split(',')[1];
        
    //     if (originalName) {
    //         const decodedName = Buffer.from(originalName, 'base64').toString();
    //         const ext = path.extname(decodedName);
    //         return `${req.uploadId}${ext}`;
    //     }
    //     return req.uploadId;
    // }
});

// Event handlers for logging
server.on('upload-created', ({ upload }) => {
    console.log('Upload created:', upload.id);
});

server.on('upload-finished', ({ upload }) => {
    console.log('Upload finished:', upload.id);
    console.log('File size:', upload.size);
    console.log('File path:', upload.storage.path);
});

// Start the server
const host = '0.0.0.0';
const port = 1080;

server.listen({ host, port }, () => {
    console.log(`[+] Tus Server listening on http://${host}:${port}`);
});
