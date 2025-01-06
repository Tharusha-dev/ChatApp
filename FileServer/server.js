const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const express = require('express');

const host = '0.0.0.0';
const port = 1080;
const app = express();
const uploadApp = express();

const server = new Server({
  path: '/files',
  datastore: new FileStore({ directory: 'files' }),
});

// Middleware to log all incoming requests
uploadApp.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware or route handler
});

uploadApp.all('*', server.handle.bind(server));
app.use('/files', uploadApp);

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});

