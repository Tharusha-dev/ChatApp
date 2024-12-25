import {Server} from '@tus/server'
import {FileStore} from '@tus/file-store'
const host = '127.0.0.1'
const port = 1080

const server = new Server({
  path: '/files',
  datastore: new FileStore({directory: './files'}),
})
server.listen({host, port})
