import { Server } from "socket.io";

import { createServer } from 'node:http';
import express from 'express';
import jwt from "jsonwebtoken";
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
 
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


//login
app.post("/login", (req, res) => {
  //TODO : check if id in in admin list in db
  const token = jwt.sign({ id: req.body.id, type: "admin" }, "secret");
  console.log(token);
  res.json({ token });
});


// add to buffer
io.use((socket, next) => {
  if (true) {
    if (true) {
      //TODO : INSTEAD VALIDATE
      next();
    }
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", (socket) => {
  console.log("connected");
  //add to admin or normal rooms
  if (socket.handshake.query.type === "admin-connect-request" && socket.handshake.query.token) {

    let decodedToken = jwt.verify(socket.handshake.query.token, "secret");
    if (decodedToken.type === "admin") {
      
    console.log("admin connected");
      //TODO : VALIDATE
      socket.join("admin");
    } else {
      next(new Error("Authentication error"));
    }

  }

  if (socket.handshake.query.type === "web-connect-request") {
    console.log("web connected");
    //TODO : VALIDATE
    socket.join("web");
  }

  //send chat request to buffer
  socket.on("web-chat-request", (data) => {
    // data : {userToken : "token"}
    console.log("web chat request");
    socket.join(data.userToken);

    socket.to("buffer").emit("buffer-request", data);
  });

  //accept request from buffer
  socket.on("admin-buffer-accept", (data) => {
    // data : {userToken : "token", adminToken : "token"}
    console.log("admin buffer accept");
    // Admin joins the room
    socket.join(data.userToken);
  });

  //chat msg
  socket.on("chat-msg", (data) => {
    // data : {userToken : "token", adminToken : "token", msg : "msg"}
    console.log("chat msg");
    socket.to(data.userToken).emit("chat-msg", data);
  });
});

//send infoming request to buffer

// io.use((socket, next) => {
//   if (socket.handshake.query && socket.handshake.query.type) {
//     if (socket.handshake.query.type === "connect-request") {
//       console.log("connect request");
//       next();
//     }
//   } else {
//     next(new Error("Authentication error"));
//   }
// }).on("connection", (socket) => {
//   console.log("connect request"); 
//   socket.to("buffer").emit("buffer-request", socket.handshake.query.token);
// });

console.log("server running on port 8000");
server.listen(8000);

//listers

// admin page buffer
