import { Server } from "socket.io";
import {MongoClient, ObjectId} from "mongodb";
import { createServer } from 'node:http';
import express from 'express';
import jwt from "jsonwebtoken";
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from "bcrypt";
const mongoUri = 'mongodb://localhost:27017'
const mongoClient = new MongoClient(mongoUri);
const db = mongoClient.db('chatapp-admin');

const bufferCollection = db.collection('buffer');
const workersCollection = db.collection('workers');
const chatsCollection = db.collection('chats');


const tokenSecret = "secret";
const salt = 10

// const doc = { name: "Neapolitan pizza", shape: "round" };
// const result = await bufferCollection.insertOne(doc);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.raw({ type: 'application/json' }));
 
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use((req, res, next) => {
  if (req.path === '/disconnect') {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next();
});


//test
app.post("/test", (req, res) => {
  //TODO : check if id in in admin list in db
  const token = jwt.sign({ id: req.body.id, type: "admin" }, tokenSecret);
  // console.log(token);
  res.json({ token });
});

//worker login
app.post("/worker/login", async (req, res) => {
  logger("Route: /worker/login - Incoming data: " + JSON.stringify(req.body));
  //TODO : check if id in in admin list in db
  const {email, password} = req.body;

  const worker = await workersCollection.findOne({email});

  if(!worker) return res.status(401).json({message: "Invalid credentials"});

  const isPasswordValid = await bcrypt.compare(password, worker.password);

  if(!isPasswordValid) return res.status(401).json({message: "Invalid credentials"});

  const token = jwt.sign({ id: worker._id, type: "worker" }, tokenSecret);

  logger(token);
  // console.log(token);
  logger("Route: /worker/login - Outgoing data: " + JSON.stringify({ token }));
  res.json({ token });

});

//worker signup
app.post("/worker/signup", async (req, res) => {
  logger("Route: /worker/signup - Incoming data: " + JSON.stringify(req.body));
  logger("signup");

  const {email, password} = req.body;

  console.log(email, password);

  bcrypt.hash(password, salt,async (err, hash) => {
    console.log(hash);

    await addWorkerToDb({email, password: hash});

    logger("Route: /worker/signup - Outgoing data: " + JSON.stringify({message: "Worker added"}));
    res.json({message: "Worker added"});

    if(err) throw err;
  });


 
});

//get current buffer
app.get("/worker/current-buffer", async (req, res) => {
  const buffer = await bufferCollection.find().toArray();
  res.json(buffer);
});


app.post("/web/join", async (req, res) => {
  logger("Route: /web/join - Incoming data: " + JSON.stringify(req.body));
  const {userToken, initialMessage, name } = req.body;

  logger("web join");

  //TODO : validation based on referes and other header to determine if it comes from allowed list + add website to JWT
  const uuid = uuidv4();

  const token = jwt.sign({ userToken: uuid, type: "web", website: "website" }, tokenSecret);


  const chatResult = await chatsCollection.insertOne({
    userToken : token,
    chat: [{...initialMessage, sender: "web"}],
    webName: name,
    disconnect : {
      time : 0,
      party : ""
    }
    

  });





  //add buffer to db




  logger("Route: /web/join - Outgoing data: " + JSON.stringify({message: "join accepted", userToken: token, chatId: chatResult.insertedId}));
  res.json({message: "join accepted", userToken: token, chatId: chatResult.insertedId});
});


app.post("/worker/chat-msg", async (req, res) => {
  logger("Route: /worker/chat-msg - Incoming data: " + JSON.stringify(req.body));
  // data : {userToken : "token", msg : "msg"}
  logger("chat msg received **********");

  console.log(req.body);  


  const decodedToken = jwt.verify(req.body.workerToken, tokenSecret);
  console.log(decodedToken);
  let result = await addMsgToChat(req.body.chatId, req.body.msg, decodedToken?.type);

  const roomSize = io.sockets.adapter.rooms.get(req.body.userToken)?.size;

  if(roomSize === 1){
    io.to(req.body.userToken).emit("party-disconnected",{chatId: req.body.chatId, party: "web"} );

  }else {
    io.to(req.body.userToken).emit("chat-msg",{ chatId: req.body.chatId, userToken: req.body.userToken, msg : {...req.body.msg, sender: decodedToken?.type}} );

  }




  console.log("========================")
  console.log("chat send to room", req.body.userToken);
  console.log("========================")

  console.log("new chat");

  console.log({ chatId: req.body.chatId, userToken: req.body.userToken, msg : {...req.body.msg, sender: decodedToken?.type}} );

  logger("Route: /chat-msg - Outgoing data: " + JSON.stringify({message: "chat msg sent"}));
  res.json({message: "chat msg sent"});

  //..req.body, chatId: result?.insertedId, sender: decodedToken?.type
});



app.post("/chat-msg", async (req, res) => {
  logger("Route: /chat-msg - Incoming data: " + JSON.stringify(req.body));
  // data : {userToken : "token", msg : "msg"}
  logger("chat msg received **********");

  console.log(req.body);  


  const decodedToken = jwt.verify(req.body.userToken, tokenSecret);
  console.log(decodedToken);
  let result = await addMsgToChat(req.body.chatId, req.body.msg, decodedToken?.type);

  const roomSize = io.sockets.adapter.rooms.get(req.body.userToken)?.size;

  if(roomSize === 1){
    io.to(req.body.userToken).emit("party-disconnected",{chatId: req.body.chatId, party: "worker"} );
  }else {
  io.to(req.body.userToken).emit("chat-msg",{ chatId: req.body.chatId, userToken: req.body.userToken, msg : {...req.body.msg, sender: decodedToken?.type}} );

  }
  console.log("========================")
  console.log("chat send to room", req.body.userToken);
  console.log("========================")

  console.log("new chat");

  console.log({ chatId: req.body.chatId, userToken: req.body.userToken, msg : {...req.body.msg, sender: decodedToken?.type}} );

  logger("Route: /chat-msg - Outgoing data: " + JSON.stringify({message: "chat msg sent"}));
  res.json({message: "chat msg sent"});

  //..req.body, chatId: result?.insertedId, sender: decodedToken?.type
});

app.post("/disconnect", async (req, res) => { 
  console.log("/disconnect");
  // Parse the raw body if it's a Buffer
  const body = req.body instanceof Buffer ? JSON.parse(req.body) : req.body;
  const {userToken, chatId, party} = body;
  console.log(body);
  const chat = await chatsCollection.findOne({_id: new ObjectId(chatId)});
  if(chat?.disconnect?.time > 0) return res.json({message: "chat already disconnected"});
  await chatsCollection.updateOne({_id: new ObjectId(chatId)}, {$set: {disconnect: {time: Date.now(), party}}});
  
  if(party === "web"){
    io.to(userToken).emit("party-disconnected",{chatId: chatId, party: "web"} );
  }else{
    io.to(userToken).emit("party-disconnected",{chatId: chatId, party: "worker"} );
  }

  io.to(userToken).emit("party-disconnected",{chatId: chatId, party: "web"} );
  console.log("disconnect");
  res.json({message: "disconnect"});
});


app.post("/worker/get-chat", async (req, res) => {
  logger("Route: /worker/get-chat - Incoming data: " + JSON.stringify(req.body));
  //TODO : validate worker token
  console.log("/worker/get-chat");

  const {chatId} = req.body;
  const chat = await chatsCollection.findOne({_id: new ObjectId(chatId)});
  logger("Route: /worker/get-chat - Outgoing data: " + JSON.stringify(chat));
  res.json(chat);
});

app.get("/worker/get-chats", async (req, res) => {
  logger("Route: /worker/get-chats - Incoming data: " + JSON.stringify(req.body));
  if(!req.headers.auth) return res.status(401).json({message: "Invalid token"});
  const decodedToken = jwt.verify(req.headers.auth, tokenSecret);
  logger(decodedToken);

  if(decodedToken?.type !== "worker") return res.status(401).json({message: "Invalid token"});

  const worker = await workersCollection.findOne({_id: new ObjectId(decodedToken.id)});
  
  // Convert string IDs to ObjectIds
  const chatObjectIds = worker.chats.map(chatId => new ObjectId(chatId));
  const chats = await chatsCollection.find({_id: {$in: chatObjectIds}}).toArray();



  logger("Route: /worker/get-chats - Outgoing data: " + JSON.stringify(chats));
  res.json(chats);
});

app.get("/worker/get-buffer", async (req, res) => {
  logger("Route: /worker/get-buffer - Incoming data: " + JSON.stringify(req.body));

  if(!req.headers.auth) return res.status(401).json({message: "Invalid token"});

  //get auth header jwt
  const decodedToken = jwt.verify(req.headers.Auth, tokenSecret);
  logger(decodedToken);
  if(decodedToken?.type !== "worker") return res.status(401).json({message: "Invalid token"});
  
  const buffer = await bufferCollection.find().toArray();
  logger("Route: /worker/get-buffer - Outgoing data: " + JSON.stringify(buffer));
  res.json(buffer);
});


// add to buffer
io.use((socket, next) => {
  logger("Socket middleware - Incoming connection attempt: " + JSON.stringify(socket.handshake.query));
  if (true) {
    if (true) {
      //TODO : INSTEAD VALIDATE
      next();
    }
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", async (socket) => {
  logger("connected");
  //add to admin or normal rooms
  if (socket.handshake.query.type === "admin-connect-request" && socket.handshake.query.token) {
    logger("Socket: admin-connect-request - Incoming data: " + JSON.stringify(socket.handshake.query));
    let decodedToken = jwt.verify(socket.handshake.query.token, tokenSecret);
    if (decodedToken.type === "admin") {
      // console.log(decodedToken);
      
    logger("admin connected");
   
      socket.join("admin");
      socket.join("buffer");
    } else {
      // next(new Error("Authentication error"));
    }

  }

  if (socket.handshake.query.type === "web-chat-request" && socket.handshake.query.userToken && socket.handshake.query.intialMessage && socket.handshake.query.chatId) {
    logger("Socket: web-chat-request - Incoming data: " + JSON.stringify(socket.handshake.query));
    logger("web chat request");

    // Parse the initialMessage since it comes as a string from query params
    const initialMessage = JSON.parse(socket.handshake.query.intialMessage);

    const decodedToken = jwt.verify(socket.handshake.query.userToken, tokenSecret);

    // const chatResult = await chatsCollection.insertOne({
    //   userToken: socket.handshake.query.userToken,
    //   chat: [{...initialMessage, sender: decodedToken?.type}],
      

    // });

    const bufferResult = await addBufferToDb({
      userToken: socket.handshake.query.userToken, 
      intialMessage: initialMessage,
      chatId: socket.handshake.query.chatId,
      webName: socket.handshake.query.name
    });



    //TODO : VALIDATE
    socket.join("web");
    socket.join(socket.handshake.query.userToken);

    console.log("========================")
    console.log("web joined room", socket.handshake.query.userToken);
    console.log("========================")


    //add buffer to db


    logger("sending : buffer-request");
    io.to("buffer").emit("buffer-request", {userToken: socket.handshake.query.userToken, initialMessage: initialMessage, chatId: socket.handshake.query.chatId, webName: socket.handshake.query.name});
    logger("Socket: web-chat-request - Outgoing buffer-request: " + JSON.stringify({
      userToken: socket.handshake.query.userToken, 
      initialMessage, 
      chatId: socket.handshake.query.chatId
    }));
    return "done";

  }

  if (socket.handshake.query.type === "worker-connect-request" && socket.handshake.query.token) {
    logger("Socket: worker-connect-request - Incoming data: " + JSON.stringify(socket.handshake.query));
    let decodedToken = jwt.verify(socket.handshake.query.token, tokenSecret);
    if (decodedToken.type === "worker") {
      // console.log(decodedToken);
      
    logger("worker connected");
   
      socket.join("worker");
      socket.join("buffer");
    } else {
      // next(new Error("Authentication error"));
    }
  }


  //accept request from buffer
  socket.on("worker-buffer-accept", async (data) => {
    logger("Socket: worker-buffer-accept - Incoming data: " + data);
    // data : {workerToken : "token", webToken : "token"}
    const jsonData = JSON.parse(data);

    logger("worker buffer accept");
    logger(data);
    // Admin joins the room
    socket.join(jsonData.webToken);

    console.log("========================")
    console.log("worker joined room", jsonData.webToken);
    console.log("========================")


    await addChatToWorker(jsonData.workerToken, jsonData.chatId);
    await removeChatFromBuffer(jsonData.chatId);
    logger("Socket: worker-buffer-accept - Processing complete for chat: " + jsonData.chatId);
  });

  socket.on("disconnecting", (reason) => {
    logger("Socket: disconnect - Incoming data: " + JSON.stringify(reason));
    logger("disconnected");

    
    // Get all rooms this socket was in
    const rooms = Array.from(socket.rooms);
    
    // Determine the disconnecting party type
    const partyType = socket.handshake.query.type === "web-chat-request" ? "web" : "worker";
    console.log(socket.handshake.query);
    const decodedToken = jwt.verify(socket.handshake.query.token, tokenSecret);

    console.log("decodedToken", decodedToken);
    console.log("handshake", socket.handshake.query);


    
    
    console.log("rooms", rooms);

    rooms.forEach(room => {
      if (room !== socket.id || room !== "admin" || room !== "buffer"|| room !== "web" || room !== "worker") {  
        io.to(room).emit("party-disconnected", {
          party: partyType,
          reason: reason
        });
      }
    });
  });

});


console.log("server running on port 8000");
server.listen(8000);



async function addBufferToDb(data){
  const result = await bufferCollection.insertOne(data);
  console.log(result);
  return result;
}



async function addWorkerToDb(data){
  const result = await workersCollection.insertOne({...data, chats: []});
  return result;
}


async function addMsgToChat(chatId, msg, type){
  const result = await chatsCollection.updateOne({_id: new ObjectId(chatId)}, {$push: {chat: {...msg, sender: type}}});
  console.log(result);
  return result;
}


async function addChatToWorker(userToken, chatId){
  const decodedToken = jwt.verify(userToken, tokenSecret);
  // Convert string ID to ObjectId
  const workerId = new ObjectId(decodedToken.id);
  
  const result = await workersCollection.updateOne(
    { _id: workerId }, 
    { $push: { chats: chatId }}
  );
  console.log(result);
}

async function removeChatFromBuffer(chatId){
  const result = await bufferCollection.deleteOne({chatId: chatId});
  console.log(result);
  return result;
}

function logger(msg){
  console.log(`[${new Date().toISOString()}] |  ${msg}`);
}


