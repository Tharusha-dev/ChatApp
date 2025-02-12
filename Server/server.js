import { Server } from "socket.io";
import { MongoClient, ObjectId } from "mongodb";
import { createServer } from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import geoip from "geoip-country";
import TelegramBot from "node-telegram-bot-api";
import * as tus from "tus-js-client";
// import 'dotenv/config'
import Whatsapp from "whatsapp-web.js";
const { Client, RemoteAuth } = Whatsapp;
import qrcode from "qrcode-terminal";
import { createTransport } from "nodemailer";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
const mongoClient = new MongoClient(mongoUri);

// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const db = mongoClient.db("chatapp-admin");

const bufferCollection = db.collection("buffer");
const workersCollection = db.collection("workers");
const chatsCollection = db.collection("chats");
const websitesCollection = db.collection("websites");

const tokenSecret = "secret";
const salt = 10;

let whatsappClient_1;
const whatsappClient_1_NUMBER = process.env.WHATSAPP_CLIENT_1_NUMBER;


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.raw({ type: "application/json" }));

const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const transporter = createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "tharusha.dev.test@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const mailOptionsMe = {
  from: "tharusha.dev.test@gmail.com",
  to: "tharushamjayasooriya@gmail.com",
  subject: "[URGENT] Chatzu Whatsapp client disconnected!",
  text: `Chatzu whatsapp client disconnected at ${new Date().toISOString()}! Log into app.chatzu.ai and re login.`,
};

const mailOptionsSam = {
  from: "tharusha.dev.test@gmail.com",
  to: "squaredeal14@gmail.com",
  subject: "[URGENT] Chatzu Whatsapp client disconnected!",
  text: `Chatzu whatsapp client disconnected at ${new Date().toISOString()}! Log into app.chatzu.ai and re login.`,
};

// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     console.error("Error sending email: ", error);
//   } else {
//     console.log("Email sent: ", info.response);
//   }
// });

mongoose.connect(mongoUri).then(() => {
  const store = new MongoStore({ mongoose: mongoose });
  whatsappClient_1 = new Client({
    // puppeteer: {
    //   headless: false,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // },

    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--no-zygote",
      ],
      executablePath: "/usr/bin/google-chrome-stable",
      timeout: 60000,
    },

    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000,
      clientId: whatsappClient_1_NUMBER,
    }),
  });

  whatsappClient_1.initialize();

  whatsappClient_1.on("qr", (qr) => {
    // Generate and scan this code with your phone
    console.log("QR RECEIVED", qr);
    qrcode.generate(qr, { small: true });
    io.to("worker").emit("qr", { qr, id: whatsappClient_1_NUMBER });
  });

  whatsappClient_1.on("ready", () => {
    console.log("Client is ready!");
  });

  whatsappClient_1.on("auth_failure", (error) => {
    console.log("Auth failure", error);
  });

  whatsappClient_1.on("authenticated", (reason) => {
    console.log("authenticated", reason);
    io.to("worker").emit("authenticated", { id: whatsappClient_1_NUMBER });
  });

  whatsappClient_1.on(`disconnected`, (reason) => {
    console.log(`Disconnected`, reason);
    // whatsappClient.destroy();
    transporter.sendMail(mailOptionsSam, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });
    transporter.sendMail(mailOptionsMe, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });
  });

  whatsappClient_1.on(
    "message",
    asyncHandler(async (msg) => {
      const msgText = msg?.body;
      const whatsappChatId = msg?.from;

      // console.log(msg)

      const number = msg?.from?.split("@")[0];
      if (msgText?.startsWith("/start")) {
        console.log("start");
        // console.log(msg);
        const contact = await msg.getContact();
        const name = contact.pushname;
        console.log("start");

        const mongoChatId = msgText.split(" ")?.[1];

        if (!mongoChatId) return;
        // telegramInitiate(msg.chat.username, telegramChatId, mongoChatId);

        const chat = await chatsCollection.findOne({
          _id: new ObjectId(mongoChatId),
        }).catch((e)=>{
          console.log(e)
          return null;
        });
        if (!chat) return;

       

        console.log("========================");
        console.log("/start chat monogoChatId", mongoChatId);
        console.log("/start chat whatsappChatId", whatsappChatId);
        console.log("========================");

        await chatsCollection
          .updateOne(
            { _id: new ObjectId(mongoChatId) },
            {
              $set: {
                whatsappChatId: whatsappChatId,
                webEmail: number,
                step: 0,
                // webName: name,
              },
            }
          )
          .catch((err) => {
            logger(`Database error while updating chat: ${err.message}`);
            console.log({ status: 500, message: "Database error occurred" });
          });
        // whatsappClient_1.sendMessage(whatsappChatId, website?.metadata?.msg_4);
        whatsappClient_1.sendMessage(whatsappChatId, "What is your name?");

        // telegramBot.sendMessage(whatsappChatId, "ya issue");
      } else {
        console.log("non /start whatsapp chat");

        // telegramInitiate(msg.chat.username, telegramChatId, mongoChatId);
        console.log(whatsappChatId);
        const chats = await chatsCollection
          .find({ whatsappChatId: whatsappChatId })
          .toArray()
          .catch((e) => {
            console.log(e);
            return [];
          });

        if (!chats) return;

        const chat = chats.reduce((latest, current) => {
          // If we find a chat with empty chat array, return it immediately
          if (current.chat.length === 0) {
            return current;
          }

          // If latest is empty chat array, keep looking
          if (latest.chat.length === 0) {
            return current;
          }

          // Compare timestamps of first messages
          const currentTimestamp = current.chat[0]?.timestamp || 0;
          const latestTimestamp = latest.chat[0]?.timestamp || 0;

          return currentTimestamp > latestTimestamp ? current : latest;
        }, chats[0] || null);

        if (chat) {
          // telegramBot.sendMessage(chatId, msgText);

          console.log("latest chat id =>", chat._id);

          if (chat.chat.length > 0) {
            console.log("chat-msg continue conversation");
            console.log("chat", chat);

            if (msg?.hasMedia) {
              const media = await msg.downloadMedia();
              console.log(media);
              const uplaodUrl = await uploadFielToServer(media);
              console.log(uplaodUrl);
              const fileMsg = `[file][link="${uplaodUrl}"][name="${media.filename}"][type="${media.mimetype}"][/file]`;

              await addMsgToChat(
                chat._id.toString(),
                { msg: fileMsg, timestamp: Date.now(), sender: "web" },
                "web"
              );

              io.to(chat.userToken).emit("chat-msg", {
                chatId: chat._id.toString(),
                userToken: chat.userToken,
                msg: { msg: fileMsg, timestamp: Date.now(), sender: "web" },
              });
            } else {
              await addMsgToChat(
                chat._id.toString(),
                { msg: msgText, timestamp: Date.now(), sender: "web" },
                "web"
              );

              io.to(chat.userToken).emit("chat-msg", {
                chatId: chat._id.toString(),
                userToken: chat.userToken,
                msg: { msg: msgText, timestamp: Date.now(), sender: "web" },
              });
            }
          } else {
            //whatsappAddToBuffer(msg, whatsappChatId, chat, msgText);
            if (chat?.step === 0) {
              //get name
              await chatsCollection.updateOne(
                { _id: chat._id },
                { $set: { step: 1, webName: msgText } }
              );
              whatsappClient_1.sendMessage(
                whatsappChatId,
                "What is your email?"
              );
              //send get email
            } else if (chat?.step === 1) {


          

              //get email
              const website = await websitesCollection.findOne({
                _id: new ObjectId(chat?.websiteId),
              });
              if (!website) return;

              await chatsCollection.updateOne(
                { _id: chat._id },
                { $set: { step: 2, userEmail: msgText } }
              );




              //send initial req
              whatsappClient_1.sendMessage(
                whatsappChatId,
                website?.metadata?.msg_4
              );
            } else if (chat?.step === 2) {
              //get initial req
              await chatsCollection.updateOne(
                { _id: chat._id },
                { $set: { step: 3 } }
              );
              whatsappAddToBuffer(msg, whatsappChatId, chat, msgText);

              //send initial req
            }
          }
        }
      }
    })
  );
});

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use((req, res, next) => {
  if (req.path === "/disconnect") {
    const origin = req.headers.origin;
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
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

app.get("/whatsapp-status", (req, res) => {
  const id = req.query.id;

  if (id === whatsappClient_1_NUMBER) {
    if (whatsappClient_1?.info?.wid) {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  } else {
    res.json({ authenticated: false });
  }
});
// Add this with your other collection declarations
const websiteMetadataCollection = db.collection("websiteMetadata");

// Add these new endpoints
app.get(
  "/website-metadata",
  asyncHandler(async (req, res) => {
    logger("Route: /website-metadata - Getting website metadata");

    const metadata = await websiteMetadataCollection
      .findOne({})
      .catch((err) => {
        logger(`Database error while finding metadata: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    res.json(metadata || { title: "", favicon: "" });
  })
);


//worker login
app.post(
  "/worker/login",
  asyncHandler(async (req, res) => {
    logger("Route: /worker/login - Incoming data: " + JSON.stringify(req.body));

    const { email, password } = req.body;
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }

    const worker = await workersCollection.findOne({ email }).catch((err) => {
      logger(`Database error while finding worker: ${err.message}`);
      throw { status: 500, message: "Database error occurred" };
    });

    if (!worker) {
      throw { status: 401, message: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt
      .compare(password, worker.password)
      .catch((err) => {
        logger(`Password comparison error: ${err.message}`);
        throw { status: 500, message: "Error validating credentials" };
      });

    if (!isPasswordValid) {
      throw { status: 401, message: "Invalid credentials" };
    }

    const token = jwt.sign(
      { id: worker._id, type: "worker", isAdmin: worker.isAdmin },
      tokenSecret
    );
    logger(`Login successful for worker: ${email}`);
    res.json({ token });
  })
);

//worker signup
app.post(
  "/worker/signup",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /worker/signup - Incoming data: " + JSON.stringify(req.body)
    );
    logger("signup");

    const { email, password, name, isAdmin } = req.body;

    console.log(email, password);

    bcrypt.hash(password, salt, async (err, hash) => {
      console.log(hash);

      let workerId = await addWorkerToDb({
        email,
        password: hash,
        name,
        isAdmin,
      });

      logger(
        "Route: /worker/signup - Outgoing data: " +
          JSON.stringify({ message: "Worker added" })
      );
      res.json(workerId);

      if (err) throw err;
    });
  })
);

//get current buffer
app.get(
  "/worker/current-buffer",
  asyncHandler(async (req, res) => {
    const workerToken = req.headers.auth;
    let decodedToken;

    try {
      decodedToken = jwt.verify(workerToken, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }

    const worker = await workersCollection
      .findOne({ _id: new ObjectId(decodedToken.id) })
      .catch((err) => {
        logger(`Database error while finding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    const workerWebsites = worker?.websites;

    const buffer = await bufferCollection
      .find({ websiteId: { $in: workerWebsites } })
      .toArray()
      .catch((err) => {
        logger(`Database error while finding buffer: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    res.json(buffer);
  })
);

app.post(
  "/web/join",
  asyncHandler(async (req, res) => {
    logger("Route: /web/join - Incoming data: " + JSON.stringify(req.body));
    const { initialMessage, name, email, websiteId, currentUrl, ip } =
      req.body;
    // const ip =
    //   req.ip ||
    //   req.connection.remoteAddress ||
    //   req.socket.remoteAddress ||
    //   req.headers["x-forwarded-for"]?.split(",")[0];

    // Get User-Agent
    const userAgent = req.headers["user-agent"];

    let userCountry = "userCountry";

    // const userCountry = geoip.lookup(ip).country;
    try {
      userCountry = geoip.lookup(ip).country;
    } catch (error) {
      console.log(error);
    }

    // Get other useful headers
    const metadata = {
      ip: ip,
      userAgent: userAgent,
      userCountry: userCountry,
      currentUrl: currentUrl,
    };
    logger("web join");

    //TODO : validation based on referes and other header to determine if it comes from allowed list + add website to JWT
    const uuid = uuidv4();

    const token = jwt.sign(
      { userToken: uuid, type: "web", website: "website" },
      tokenSecret
    );

    const chatResult = await chatsCollection
      .insertOne({
        userToken: token,
        type: "web",
        chat: [{ ...initialMessage, sender: "web" }],
        webName: name,
        webEmail: email,
        metadata: metadata,
        websiteId: new ObjectId(websiteId),
        disconnect: {
          time: 0,
          party: "",
        },
      })
      .catch((err) => {
        logger(`Database error while inserting chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    //add buffer to db

    logger(
      "Route: /web/join - Outgoing data: " +
        JSON.stringify({
          message: "join accepted",
          userToken: token,
          chatId: chatResult.insertedId,
        })
    );
    res.json({
      message: "join accepted",
      userToken: token,
      chatId: chatResult.insertedId,
    });
  })
);

app.post(
  "/telegram/join",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /telegram/join - Incoming data: " + JSON.stringify(req.body)
    );
    const { websiteId, currentUrl, ip } = req.body;
    // const ip =
    //   req.ip ||
    //   req.connection.remoteAddress ||
    //   req.socket.remoteAddress ||
    //   req.headers["x-forwarded-for"]?.split(",")[0];

    // Get User-Agent
    const userAgent = req.headers["user-agent"];

    let userCountry = "userCountry";

    // const userCountry = geoip.lookup(ip).country;
    try {
      userCountry = geoip.lookup(ip).country;
    } catch (error) {
      console.log(error);
    }

    // Get other useful headers
    const metadata = {
      ip: ip,
      userAgent: userAgent,
      userCountry: userCountry,
      currentUrl: currentUrl,
    };
    logger("telegram join");

    //TODO : validation based on referes and other header to determine if it comes from allowed list + add website to JWT
    const uuid = uuidv4();

    const token = jwt.sign(
      { userToken: uuid, type: "telegram", website: "website" },
      tokenSecret
    );

    const chatResult = await chatsCollection
      .insertOne({
        userToken: token,
        chat: [],
        type: "telegram",

        metadata: metadata,
        websiteId: new ObjectId(websiteId),
        disconnect: {
          time: 0,
          party: "",
        },
      })
      .catch((err) => {
        logger(`Database error while inserting chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    //add buffer to db

    logger(
      "Route: /telegram/join - Outgoing data: " +
        JSON.stringify({
          message: "join accepted",
          userToken: token,
          chatId: chatResult.insertedId,
        })
    );
    res.json({
      message: "join accepted",
      userToken: token,
      chatId: chatResult.insertedId,
    });
  })
);

app.post(
  "/whatsapp/join",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /whatsapp/join - Incoming data: " + JSON.stringify(req.body)
    );
    const { websiteId, currentUrl, ip } = req.body;
    // const ip =
    //   req.ip ||
    //   req.connection.remoteAddress ||
    //   req.socket.remoteAddress ||
    //   req.headers["x-forwarded-for"]?.split(",")[0];

    // Get User-Agent
    const userAgent = req.headers["user-agent"];

    let userCountry = "userCountry";

    // const userCountry = geoip.lookup(ip).country;
    try {
      userCountry = geoip.lookup(ip).country;
      // userCountry = "Sri Lanka";

    } catch (error) {
      console.log(error);
    }

    // Get other useful headers
    const metadata = {
      ip: ip,
      userAgent: userAgent,
      userCountry: userCountry,
      currentUrl: currentUrl,
    };
    logger("whatsapp join");

    //TODO : validation based on referes and other header to determine if it comes from allowed list + add website to JWT
    const uuid = uuidv4();

    const token = jwt.sign(
      { userToken: uuid, type: "whatsapp", website: "website" },
      tokenSecret
    );

    const chatResult = await chatsCollection
      .insertOne({
        userToken: token,
        chat: [],
        type: "whatsapp",

        metadata: metadata,
        websiteId: new ObjectId(websiteId),
        disconnect: {
          time: 0,
          party: "",
        },
      })
      .catch((err) => {
        logger(`Database error while inserting chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    //add buffer to db

    logger(
      "Route: /whatsapp/join - Outgoing data: " +
        JSON.stringify({
          message: "join accepted",
          userToken: token,
          chatId: chatResult.insertedId,
        })
    );
    res.json({
      message: "join accepted",
      userToken: token,
      chatId: chatResult.insertedId,
    });
  })
);

app.post(
  "/web/check-availability",
  asyncHandler(async (req, res) => {
    const { websiteId } = req.body;

    logger(
      "Route: /check-availability - Incoming data: " + JSON.stringify(req.body)
    );

    // Get the size of the buffer room
    const bufferRoomSize = io.sockets.adapter.rooms.get(websiteId)?.size || 0;

    // Check if there are any workers available (connected to buffer room)
    const isWorkerAvailable = bufferRoomSize > 0;

    logger(
      "Route: /check-availability - Outgoing data: " +
        JSON.stringify({ available: isWorkerAvailable })
    );
    res.json({ available: isWorkerAvailable });
  })
);

app.post(
  "/web/get-metadata",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /web/get-metadata - Incoming data: " + JSON.stringify(req.body)
    );
    const { websiteId } = req.body;
    const website = await websitesCollection
      .findOne({ _id: new ObjectId(websiteId) })
      .catch((err) => {
        logger(`Database error while finding website: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    res.json(website?.metadata);
  })
);




app.post(
  "/worker/chat-msg",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /worker/chat-msg - Incoming data: " + JSON.stringify(req.body)
    );
    // data : {userToken : "token", msg : "msg"}
    logger("chat msg received **********");

    console.log(req.body);

    const bufferRoomSize = io.sockets.adapter.rooms.get(req.body.userToken)?.size;

    // Check if there are any workers available (connected to buffer room)
    const isWorkerConnected = bufferRoomSize > 1
    if(!isWorkerConnected) return res.status(200).json({ reconnect: true });

    let decodedToken;
    try {
      decodedToken = jwt.verify(req.body.workerToken, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }
    console.log(decodedToken);
    let result = await addMsgToChat(
      req.body.chatId,
      req.body.msg,
      decodedToken?.type
    );

    let decodedUserToken;
    try {
      decodedUserToken = jwt.verify(req.body.userToken, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("========================");
    console.log("chat send to room", req.body.userToken);
    console.log("========================");

    console.log("new chat");

    if (decodedUserToken?.type === "telegram") {
      console.log("sending telegram");
      const chat = await chatsCollection.findOne({
        _id: new ObjectId(req.body.chatId),
      });
      const telegramChatId = chat.telegramChatId;

      // Check if the message is a file
      const fileMatch = req.body.msg.msg.match(
        /\[file\]\[link="([^"]+)"\]\[name="([^"]+)"\]\[type="([^"]+)"\]\[\/file\]/
      );

      if (fileMatch) {
        // Extract file information
        const [_, fileUrl, fileName, fileType] = fileMatch;

        // Send as document
        console.log("fileUrl", fileUrl);
        telegramBot.sendDocument(telegramChatId, fileUrl);
      } else {
        // Send as regular message
        telegramBot.sendMessage(telegramChatId, req.body.msg.msg);
      }
    } else if (decodedUserToken?.type === "whatsapp") {
      console.log("sending whatsapp");
      const chat = await chatsCollection.findOne({
        _id: new ObjectId(req.body.chatId),
      });
      const fileMatch = req.body.msg.msg.match(
        /\[file\]\[link="([^"]+)"\]\[name="([^"]+)"\]\[type="([^"]+)"\]\[\/file\]/
      );
      if (fileMatch) {
        console.log("fileMatch", fileMatch);
        const [_, fileUrl, fileName, fileType] = fileMatch;
        const file = await Whatsapp.MessageMedia.fromUrl(fileUrl, {
          unsafeMime: true,
        });
        console.log("file", file);
        whatsappClient_1.sendMessage(chat.whatsappChatId, file);
      } else {
        whatsappClient_1.sendMessage(chat.whatsappChatId, req.body.msg.msg);
      }
    } else {
      console.log("sending normal chat");

      io.to(req.body.userToken).emit("chat-msg", {
        chatId: req.body.chatId,
        userToken: req.body.userToken,
        msg: { ...req.body.msg, sender: decodedToken?.type },
      });
    }

    console.log({
      chatId: req.body.chatId,
      userToken: req.body.userToken,
      msg: { ...req.body.msg, sender: decodedToken?.type },
    });

    logger(
      "Route: /chat-msg - Outgoing data: " +
        JSON.stringify({ message: "chat msg sent" })
    );
    res.json({ message: "chat msg sent", reconnect: false });

    //..req.body, chatId: result?.insertedId, sender: decodedToken?.type
  })
);

app.post(
  "/chat-msg",
  asyncHandler(async (req, res) => {
    logger("Route: /chat-msg - Incoming data: " + JSON.stringify(req.body));
    // data : {userToken : "token", msg : "msg"}
    logger("chat msg received **********");

    console.log(req.body);

    let decodedToken;
    try {
      decodedToken = jwt.verify(req.body.userToken, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }
    console.log(decodedToken);
    let result = await addMsgToChat(
      req.body.chatId,
      req.body.msg,
      decodedToken?.type
    );

    const roomSize = io.sockets.adapter.rooms.get(req.body.userToken)?.size;
    
    console.log("roomSize", roomSize);

    io.to(req.body.userToken).emit("chat-msg", {
      chatId: req.body.chatId,
      userToken: req.body.userToken,
      msg: { ...req.body.msg, sender: decodedToken?.type },
    });
    // if (roomSize === 1) {
    //   io.to(req.body.userToken).emit("party-disconnected", {
    //     chatId: req.body.chatId,
    //     party: "worker",
    //   });
    // } else {
    //   io.to(req.body.userToken).emit("chat-msg", {
    //     chatId: req.body.chatId,
    //     userToken: req.body.userToken,
    //     msg: { ...req.body.msg, sender: decodedToken?.type },
    //   });
    // }
    console.log("========================");
    console.log("chat send to room", req.body.userToken);
    console.log("========================");

    console.log("new chat");

    console.log({
      chatId: req.body.chatId,
      userToken: req.body.userToken,
      msg: { ...req.body.msg, sender: decodedToken?.type },
    });

    logger(
      "Route: /chat-msg - Outgoing data: " +
        JSON.stringify({ message: "chat msg sent" })
    );
    res.json({ message: "chat msg sent" });

    //..req.body, chatId: result?.insertedId, sender: decodedToken?.type
  })
);

app.post(
  "/disconnect",
  asyncHandler(async (req, res) => {
    console.log("/disconnect");
    // Parse the raw body if it's a Buffer
    const body = req.body instanceof Buffer ? JSON.parse(req.body) : req.body;
    const { userToken, chatId, party } = body;
    console.log(body);
    const chat = await chatsCollection
      .findOne({ _id: new ObjectId(chatId) })
      .catch((err) => {
        logger(`Database error while finding chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    if (chat?.disconnect?.time > 0)
      return res.json({ message: "chat already disconnected" });
    await chatsCollection
      .updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { disconnect: { time: Date.now(), party } } }
      )
      .catch((err) => {
        logger(`Database error while updating chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    if (party === "web") {
      console.log("emiting web disconnected");
      io.to(userToken).emit("party-disconnected", {
        chatId: chatId,
        party: "web",
      });
    } else {
      console.log("emiting worker disconnected");
      io.to(userToken).emit("party-disconnected", {
        chatId: chatId,
        party: "worker",
      });
    }

    // io.to(userToken).emit("party-disconnected",{chatId: chatId, party: "web"} );
    console.log("disconnect");
    res.json({ message: "disconnect" });
  })
);

app.post(
  "/worker/get-chat",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /worker/get-chat - Incoming data: " + JSON.stringify(req.body)
    );

    if (!req.headers.auth)
      return res.status(401).json({ message: "Invalid token" });
    let decodedToken;
    try {
      decodedToken = jwt.verify(req.headers.auth, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }
    logger(decodedToken);

    if (decodedToken?.type !== "worker")
      return res.status(401).json({ message: "Invalid token" });

    const { chatId } = req.body;
    const chat = await chatsCollection
      .findOne({ _id: new ObjectId(chatId) })
      .catch((err) => {
        logger(`Database error while finding chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    // logger("Route: /worker/get-chat - Outgoing data: " + JSON.stringify(chat));
    res.json(chat);
  })
);

app.get(
  "/worker/get-chats",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /worker/get-chats - Incoming data: " + JSON.stringify(req.body)
    );
    if (!req.headers.auth)
      return res.status(401).json({ message: "Invalid token" });
    let decodedToken;
    try {
      decodedToken = jwt.verify(req.headers.auth, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }
    logger(decodedToken);

    if (decodedToken?.type !== "worker")
      return res.status(401).json({ message: "Invalid token" });

    const worker = await workersCollection.findOne({
      _id: new ObjectId(decodedToken.id),
    });

    // Convert string IDs to ObjectIds
    const chatObjectIds = worker?.chats?.map((chatId) => new ObjectId(chatId));
    const chats = await chatsCollection
      .find({ _id: { $in: chatObjectIds } })
      .toArray()
      .catch((err) => {
        logger(`Database error while finding chats: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    // Get unique websiteIds from all chats
    const uniqueWebsiteIds = [
      ...new Set(chats.map((chat) => chat.websiteId.toString())),
    ];

    // Fetch all required websites in one query
    const websites = await websitesCollection
      .find({ _id: { $in: uniqueWebsiteIds.map((id) => new ObjectId(id)) } })
      .project({ domain: 1 })
      .toArray()
      .catch((err) => {
        logger(`Database error while finding chats: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    // Create a map for quick website domain lookup
    const websiteDomainMap = Object.fromEntries(
      websites.map((website) => [website._id.toString(), website.domain])
    );

    // Add websiteDomain to each chat
    const chatsWithDomain = chats.map((chat) => ({
      ...chat,
      websiteDomain: websiteDomainMap[chat.websiteId.toString()],
    }));

    res.json(chatsWithDomain);
  })
);

app.get(
  "/worker/get-buffer",
  asyncHandler(async (req, res) => {
    logger(
      "Route: /worker/get-buffer - Incoming data: " + JSON.stringify(req.body)
    );

    if (!req.headers.auth)
      return res.status(401).json({ message: "Invalid token" });

    //get auth header jwt
    let decodedToken;
    try {
      decodedToken = jwt.verify(req.headers.auth, tokenSecret);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token" });
    }
    // logger(decodedToken);
    if (decodedToken?.type !== "worker")
      return res.status(401).json({ message: "Invalid token" });

    const buffer = await bufferCollection
      .find()
      .toArray()
      .catch((err) => {
        logger(`Database error while finding buffer: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    // logger(
    //   "Route: /worker/get-buffer - Outgoing data: " + JSON.stringify(buffer)
    // );
    res.json(buffer);
  })
);

app.get(
  "/worker/isAdmin",
  asyncHandler(async (req, res) => {
    const token = req.headers.auth;
    const decodedToken = jwt.verify(token, tokenSecret);

    console.log("iosAdmin +++++++++++++++++++++++++");
    console.log(decodedToken?.isAdmin);
    console.log("iosAdmin +++++++++++++++++++++++++");

    if (decodedToken?.isAdmin == undefined || decodedToken?.isAdmin == null) {
      res.json({ isAdmin: null, relogin: true });
    } else {
      res.json({ isAdmin: decodedToken?.isAdmin, relogin: false });
    }
  })
);

const adminAuthMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.headers.auth;
  if (!token) {
    return res
      .status(401)
      .json({ message: "No authentication token provided" });
  }

  try {
    const decodedToken = jwt.verify(token, tokenSecret);
    if (!decodedToken.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }
});

app.get(
  "/admin/get-workers",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const workers = await workersCollection
        .find()
        .toArray()
        .catch((err) => {
          logger(`Database error while finding workers: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      // Map through workers and populate website details
      const workersWithWebsites = await Promise.all(
        workers.map(async (worker) => {
          // Convert string IDs to ObjectIds if needed and get website details
          const websiteDetails = await websitesCollection
            .find({
              _id: { $in: worker.websites.map((id) => new ObjectId(id)) },
            })
            .project({ domain: 1, _id: 1 }) // Only get necessary fields
            .toArray()
            .catch((err) => {
              logger(`Database error while finding workers: ${err.message}`);
              throw { status: 500, message: "Database error occurred" };
            });

          return {
            _id: worker._id,
            name: worker.name,
            email: worker.email,
            password: "",
            websites: websiteDetails,
          };
        })
      );

      logger(
        "Route: /admin/get-workers - Outgoing data: " +
          JSON.stringify(workersWithWebsites)
      );
      res.json(workersWithWebsites);
    } catch (error) {
      logger("Error in /admin/get-workers: " + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

app.get(
  "/admin/get-websites",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const websites = await websitesCollection
        .find()
        .toArray()
        .catch((err) => {
          logger(`Database error while finding websites: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      // Map through websites and populate worker details
      const websitesWithWorkers = await Promise.all(
        websites.map(async (website) => {
          const workerDetails = await workersCollection
            .find({ _id: { $in: website.workers } })
            .project({ name: 1, email: 1, _id: 1 }) // Only get necessary fields
            .toArray()
            .catch((err) => {
              logger(`Database error while finding workers: ${err.message}`);
              throw { status: 500, message: "Database error occurred" };
            });

          return {
            ...website,
            workers: workerDetails.map((worker) => ({
              _id: worker._id,
              name: worker.name,
              email: worker.email,
              password: "",
            })),
          };
        })
      );

      logger(
        "Route: /admin/get-websites - Outgoing data: " +
          JSON.stringify(websitesWithWorkers)
      );
      res.json(websitesWithWorkers);
    } catch (error) {
      logger("Error in /admin/get-websites: " + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

app.post(
  "/admin/worker/edit",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/worker/edit - Incoming data: " + JSON.stringify(req.body)
    );
    const { workerId, field, value } = req.body;
    if (field === "password") {
      return res.status(401).json({ message: "Invalid field" });
    }
    const result = await workersCollection
      .updateOne({ _id: new ObjectId(workerId) }, { $set: { [field]: value } })
      .catch((err) => {
        logger(`Database error while updating worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    logger(
      "Route: /admin/worker/edit - Outgoing data: " + JSON.stringify(result)
    );
    res.json(result);
  })
);

app.post(
  "/admin/worker/delete",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/worker/delete - Incoming data: " + JSON.stringify(req.body)
    );
    const { workerId } = req.body;

    try {
      // First, get the worker to find their associated websites
      const worker = await workersCollection
        .findOne({ _id: new ObjectId(workerId) })
        .catch((err) => {
          logger(`Database error while finding worker: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      if (worker?.websites?.length > 0) {
        // Remove the worker ID from all associated websites
        await websitesCollection
          .updateMany(
            { _id: { $in: worker.websites } },
            { $pull: { workers: new ObjectId(workerId) } }
          )
          .catch((err) => {
            logger(`Database error while updating websites: ${err.message}`);
            throw { status: 500, message: "Database error occurred" };
          });
      }

      // Then delete the worker
      const result = await workersCollection
        .deleteOne({ _id: new ObjectId(workerId) })
        .catch((err) => {
          logger(`Database error while deleting worker: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      logger(
        "Route: /admin/worker/delete - Outgoing data: " + JSON.stringify(result)
      );
      res.json(result);
    } catch (error) {
      logger("Error in /admin/worker/delete: " + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

app.post(
  "/admin/websites/edit",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/websites/edit - Incoming data: " + JSON.stringify(req.body)
    );
    const { websiteId, field, value } = req.body;
    const result = await websitesCollection
      .updateOne({ _id: new ObjectId(websiteId) }, { $set: { [field]: value } })
      .catch((err) => {
        logger(`Database error while updating website: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    logger(
      "Route: /admin/websites/edit - Outgoing data: " + JSON.stringify(result)
    );
    res.json(result);
  })
);

app.post(
  "/admin/websites/add",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/websites/add - Incoming data: " + JSON.stringify(req.body)
    );
    const { domain, metadata, chat_icon } = req.body;

    // Check if website with same domain exists
    const existingWebsite = await websitesCollection.findOne({ domain });
    if (existingWebsite) {
      return res
        .status(400)
        .json({ message: "A website with that domain already exists" });
    }

    const result = await websitesCollection
      .insertOne({ domain, workers: [], metadata, chat_icon })
      .catch((err) => {
        logger(`Database error while adding website: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    logger(
      "Route: /admin/websites/add - Outgoing data: " +
        JSON.stringify(result.insertedId)
    );
    res.json(result.insertedId);
  })
);

app.post(
  "/admin/websites/add-worker",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/websites/add-worker - Incoming data: " +
        JSON.stringify(req.body)
    );
    const { websiteId, workerId } = req.body;
    const result = await addWorkerToWebsite(workerId, websiteId).catch(
      (err) => {
        logger(`Database error while adding worker to website: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      }
    );
    logger(
      "Route: /admin/websites/add-worker - Outgoing data: " +
        JSON.stringify(result)
    );
    res.json(result);
  })
);

app.post(
  "/admin/websites/remove-worker",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/websites/remove-worker - Incoming data: " +
        JSON.stringify(req.body)
    );
    const { websiteId, workerId } = req.body;
    const result = await removeWorkerFromWebsite(workerId, websiteId).catch(
      (err) => {
        logger(
          `Database error while removing worker from website: ${err.message}`
        );
        throw { status: 500, message: "Database error occurred" };
      }
    );
    logger(
      "Route: /admin/websites/remove-worker - Outgoing data: " +
        JSON.stringify(result)
    );
    res.json(result);
  })
);

app.post(
  "/admin/website-metadata",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/website-metadata - Updating metadata: " + JSON.stringify(req.body)
    );

    const { title, favicon } = req.body;

    // Basic validation
    if (!title && !favicon) {
      throw { status: 400, message: "Title or favicon is required" };
    }

    const result = await websiteMetadataCollection
      .updateOne(
        {}, // Update the single document
        { $set: { title, favicon } },
        { upsert: true }
      )
      .catch((err) => {
        logger(`Database error while updating metadata: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    const updatedMetadata = await websiteMetadataCollection.findOne({});
    res.json(updatedMetadata);
  })
);


app.post(
  "/admin/websites/delete",
  adminAuthMiddleware,
  asyncHandler(async (req, res) => {
    logger(
      "Route: /admin/websites/delete - Incoming data: " +
        JSON.stringify(req.body)
    );
    const { websiteId } = req.body;

    try {
      // First, get the website to find its associated workers
      const website = await websitesCollection
        .findOne({ _id: new ObjectId(websiteId) })
        .catch((err) => {
          logger(`Database error while finding website: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      if (website?.workers?.length > 0) {
        // Remove the website ID from all associated workers
        await workersCollection
          .updateMany(
            { _id: { $in: website.workers } },
            { $pull: { websites: new ObjectId(websiteId) } }
          )
          .catch((err) => {
            logger(`Database error while updating workers: ${err.message}`);
            throw { status: 500, message: "Database error occurred" };
          });
      }

      // Then delete the website
      const result = await websitesCollection
        .deleteOne({ _id: new ObjectId(websiteId) })
        .catch((err) => {
          logger(`Database error while deleting website: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      logger(
        "Route: /admin/websites/delete - Outgoing data: " +
          JSON.stringify(result)
      );
      res.json(result);
    } catch (error) {
      logger("Error in /admin/websites/delete: " + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);

app.get(
  "/debug/socket-rooms",
  asyncHandler(async (req, res) => {
    logger("Route: /debug/socket-rooms - Getting all socket rooms");

    const sockets = await io.fetchSockets();
    const socketRooms = sockets.map((socket) => {
      return {
        id: socket.id,
        rooms: Array.from(socket.rooms),
        query: socket.handshake.query,
        connected: socket.connected,
      };
    });

    logger(`Found ${socketRooms.length} connected sockets`);
    res.json({
      totalSockets: socketRooms.length,
      sockets: socketRooms,
    });
  })
);


app.get("/web/data", asyncHandler(async (req, res) => {
  const { websiteId } = req.query;
  const website = await websitesCollection.findOne({ _id: new ObjectId(websiteId) });
  res.json({ icon: website?.chat_icon, color: website?.metadata?.brand_color, metadata: website?.metadata });
}));

// add to buffer
io.use((socket, next) => {
  logger(
    "Socket middleware - Incoming connection attempt: " +
      JSON.stringify(socket.handshake.query)
  );
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
  if (
    socket.handshake.query.type === "admin-connect-request" &&
    socket.handshake.query.token
  ) {
    logger(
      "Socket: admin-connect-request - Incoming data: " +
        JSON.stringify(socket.handshake.query)
    );
    let decodedToken;
    try {
      decodedToken = jwt.verify(socket.handshake.query.token, tokenSecret);
    } catch (error) {
      console.log(error);
      return;
    }
    if (decodedToken.type === "admin") {
      // console.log(decodedToken);

      logger("admin connected");

      socket.join("admin");
      socket.join("buffer");
    } else {
      // next(new Error("Authentication error"));
    }
  }

  if (
    socket.handshake.query.type === "web-chat-request" &&
    socket.handshake.query.userToken &&
    socket.handshake.query.intialMessage &&
    socket.handshake.query.chatId &&
    socket.handshake.query.websiteId
  ) {
    logger(
      "Socket: web-chat-request - Incoming data: " +
        JSON.stringify(socket.handshake.query)
    );

    try {
      // Check if chat exists in either collection
      const existingChat = await chatsCollection.findOne({
        _id: new ObjectId(socket.handshake.query.chatId),
      }).catch((err) => {
        console.log(err);
        return null;
      });

      const existingBuffer = await bufferCollection.findOne({
        chatId: socket.handshake.query.chatId,
      }).catch((err) => {
        console.log(err);
        return null;
      });

      if (existingBuffer) {
        logger("Chat already exists in system");
        socket.emit("error", {
          message: "Chat already exists",
          code: "CHAT_EXISTS",
        });
        return;
      }

      // Continue with existing logic if chat doesn't exist
      const initialMessage = JSON.parse(socket.handshake.query.intialMessage);

      const chat = await chatsCollection
        .findOne({ _id: new ObjectId(socket.handshake.query.chatId) })
        .catch((err) => {
          logger(`Database error while finding chat: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      const website = await websitesCollection.findOne({_id: chat?.websiteId}).catch((err) => {
        console.log(err);
        return null;
      });

  

      //TODO : VALIDATE
      socket.join("web");
      socket.join(socket.handshake.query.userToken);
      socket.join(socket.handshake.query.websiteId);

      console.log("========================");
      console.log("web joined room", socket.handshake.query.userToken);
      console.log("========================");


      if(existingChat){
        return "done";
      }
      //webEmail
      const oldUser = await chatsCollection.findOne({
        webEmail:chat?.webEmail,
      }).catch((err) => {
        console.log(err);
        return null;
      });

      // if(oldUser){
      //   return "done";
      // }

      //add buffer to db
      const bufferResult = await addBufferToDb({
        type: "web",
        userToken: socket.handshake.query.userToken,
        initialMessage: initialMessage,
        chatId: socket.handshake.query.chatId,
        webName: socket.handshake.query.name,
        websiteId: socket.handshake.query.websiteId,
        websiteDomain: website?.domain,
        webEmail: chat?.webEmail,
        metadata: chat?.metadata,
        isOldUser: oldUser ? true : false,
      });

      logger("sending : buffer-request");
      io.to(socket.handshake.query.websiteId).emit("buffer-request", {
        type: "web",
        userToken: socket.handshake.query.userToken,
        initialMessage: initialMessage,
        chatId: socket.handshake.query.chatId,
        webName: socket.handshake.query.name,
        webEmail: chat?.webEmail,
        websiteDomain: website?.domain,
        metadata: chat?.metadata,
        isOldUser: oldUser ? true : false,
      });
      logger(
        "Socket: web-chat-request - Outgoing buffer-request: " +
          JSON.stringify({
            userToken: socket.handshake.query.userToken,
            initialMessage,
            chatId: socket.handshake.query.chatId,
          })
      );
      return "done";
    } catch (error) {
      logger(`Error in web-chat-request: ${error.message}`);
      socket.emit("error", {
        message: "Internal server error",
        code: "SERVER_ERROR",
      });
      return;
    }
  }

  if (
    socket.handshake.query.type === "worker-connect-request" &&
    socket.handshake.query.token
  ) {
    logger(
      "Socket: worker-connect-request - Incoming data: " +
        JSON.stringify(socket.handshake.query)
    );
    let decodedToken;
    try {
      decodedToken = jwt.verify(socket.handshake.query.token, tokenSecret);
    } catch (error) {
      console.log(error);
      return;
    }

    console.log("==================");
    console.log(decodedToken);
    console.log("==================");

    if (decodedToken.type === "worker") {
      logger("worker connected");

      // Get worker's websites from database
      const worker = await workersCollection
        .findOne({ _id: new ObjectId(decodedToken.id) })
        .catch((err) => {
          logger(`Database error while finding worker: ${err.message}`);
          throw { status: 500, message: "Database error occurred" };
        });

      // Join general rooms
      socket.join("worker");

      // console.log("worker joined room", socket.handshake.query.token);
      console.log(worker);
      // socket.join("buffer");

      // Join room for each website the worker is assigned to
      if (worker?.websites && worker?.websites?.length > 0) {
        worker.websites.forEach((websiteId) => {
          socket.join(websiteId.toString());
          socket.to(websiteId.toString()).emit("worker-connected");
          logger(`Worker joined website room: ${websiteId}`);
        });
      }
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
    let decodedToken;
    let decodedWorkerToken;
    try {
      decodedToken = jwt.verify(jsonData.webToken, tokenSecret);
      decodedWorkerToken = jwt.verify(jsonData.workerToken, tokenSecret);
    } catch (error) {
      console.log(error);
      return;
    }
    console.log("8888888888888888888888888");
    console.log(decodedWorkerToken)

    if (decodedToken.type === "web") {
      console.log("decondec web");

      const worker = await workersCollection.findOne({ _id : new ObjectId(decodedWorkerToken?.id) }).catch((err) => {
        logger(`Database error while finding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
  
      console.log(worker.name)

      io.to(jsonData.webToken).emit("worker-buffer-accept", {
        workerName: worker?.name || "Agent",
      });
    } else {
      console.log("decondec not web");
    }

    socket.join(jsonData.webToken);

    console.log("8888888888888888888888888");

    console.log("========================");
    console.log("worker joined room", jsonData.webToken);
    console.log("========================");

    await addChatToWorker(jsonData.workerToken, jsonData.chatId);
    await removeChatFromBuffer(jsonData.chatId);
    logger(
      "Socket: worker-buffer-accept - Processing complete for chat: " +
        jsonData.chatId
    );
  });

  socket.on("worker-reconnect", async (data) => {
    logger("Socket: worker-reconnect - Incoming data: " + data);
    // data : {workerToken : "token", webToken : "token"}
    // const jsonData = data
    // await addChatToWorker(jsonData.workerToken, jsonData.chatId);
    console.log("reconnecting to ", data.webToken)
    socket.join(data.webToken);
  });

  socket.on("web-reconnect", async (data) => {
    logger("Socket: web-reconnect - Incoming data: " + data);
    // data : {webToken : "token"}
    socket.join(data.webToken);
  });

  socket.on("disconnecting", (reason) => {
    logger("Socket: disconnect - Incoming data: " + JSON.stringify(reason));
    logger("disconnected");

    // Get all rooms this socket was in
    const rooms = Array.from(socket.rooms);

    // Determine the disconnecting party type
    const partyType =
      socket.handshake.query.type === "web-chat-request" ? "web" : "worker";
    // console.log(socket.handshake.query);
    // const decodedToken = jwt.verify(socket.handshake.query.token, tokenSecret);

    // const workerId = decodedToken.id;

    // console.log("decodedToken", decodedToken);
    // console.log("handshake", socket.handshake.query);

    // console.log("rooms", rooms);

    rooms.forEach((room) => {
      if (
        room !== socket.id ||
        room !== "admin" ||
        room !== "buffer" ||
        room !== "web" ||
        room !== "worker"
      ) {
        io.to(room).emit("party-disconnected", {
          party: partyType,
          reason: reason,
        });
      }
    });
  });

  socket.on("heartbeat", () => {
    // Optional: Log or handle heartbeat
    logger("Received heartbeat from client");
  });
});

telegramBot.on(
  "message",
  asyncHandler(async (msg) => {
    const msgText = msg?.text;
    const telegramChatId = msg.chat.id;
    console.log("msg", msg);
    console.log(msg);
    if (msgText?.startsWith("/start")) {
      console.log("start");
      const mongoChatId = msgText.split(" ")?.[1];

      if (!mongoChatId) return;
      // telegramInitiate(msg.chat.username, telegramChatId, mongoChatId);

      const chat = await chatsCollection.findOne({
        _id: new ObjectId(mongoChatId),
        }).catch((e)=>{
          console.log(e);
          return null;
        });
      if (!chat) return;
    
      console.log("========================");
      console.log("/start chat monogoChatId", mongoChatId);
      console.log("/start chat telegramChatId", telegramChatId);
      console.log("========================");

      await chatsCollection
        .updateOne(
          { _id: new ObjectId(mongoChatId) },
          {
            $set: {
              telegramChatId: telegramChatId,
              webEmail: msg.chat.username,
              step: 0,
              // webName: `${msg.chat.first_name} ${msg.chat.last_name}`,
            },
          }
        )
        .catch((err) => {
          logger(`Database error while updating chat: ${err.message}`);
          console.log({ status: 500, message: "Database error occurred" });
        });
      telegramBot.sendMessage(telegramChatId, "What is your name?");
    } else {
      console.log("non /start telegram chat");

      const chats = await chatsCollection
        .find({ telegramChatId: telegramChatId })
        .toArray();

      if (!chats) return;

      const chat = chats.reduce((latest, current) => {
        // If we find a chat with empty chat array, return it immediately
        if (current.chat.length === 0) {
          return current;
        }

        // If latest is empty chat array, keep looking
        if (latest.chat.length === 0) {
          return current;
        }

        // Compare timestamps of first messages
        const currentTimestamp = current.chat[0]?.timestamp || 0;
        const latestTimestamp = latest.chat[0]?.timestamp || 0;

        return currentTimestamp > latestTimestamp ? current : latest;
      }, chats[0] || null);

      if (chat) {
        // telegramBot.sendMessage(chatId, msgText);

        console.log("latest chat id =>", chat._id);

        if (chat.chat.length > 0) {
          console.log("chat-msg continue conversation");
          console.log("chat", chat);
          //file_unique_id
          if (msg?.photo) {
            const photos = msg?.photo;
            const biggestPhoto = photos[photos.length - 1];
            const downloadURL = await getDownloadFilePath(biggestPhoto.file_id);
            if (!downloadURL) return;
            console.log("downloadURL", downloadURL);
            const fileMsg = `[file][link="${downloadURL}"][name="${biggestPhoto.file_unique_id}"][type="image/png"][/file]`;
            io.to(chat.userToken).emit("chat-msg", {
              chatId: chat._id.toString(),
              userToken: chat.userToken,
              msg: { msg: fileMsg, timestamp: Date.now(), sender: "web" },
            });
            await addMsgToChat(
              chat._id.toString(),
              { msg: fileMsg, timestamp: Date.now(), sender: "web" },
              "web"
            );
          } else if (msg?.document) {
            // const photos = msg?.photo
            const document = msg?.document;
            const downloadURL = await getDownloadFilePath(document.file_id);
            if (!downloadURL) return;
            console.log("downloadURL", downloadURL);
            const fileMsg = `[file][link="${downloadURL}"][name="${document.file_name}"][type="${document.mime_type}"][/file]`;
            io.to(chat.userToken).emit("chat-msg", {
              chatId: chat._id.toString(),
              userToken: chat.userToken,
              msg: { msg: fileMsg, timestamp: Date.now(), sender: "web" },
            });
            await addMsgToChat(
              chat._id.toString(),
              { msg: fileMsg, timestamp: Date.now(), sender: "web" },
              "web"
            );
          } else {
            io.to(chat.userToken).emit("chat-msg", {
              chatId: chat._id.toString(),
              userToken: chat.userToken,
              msg: { msg: msgText, timestamp: Date.now(), sender: "web" },
            });

            await addMsgToChat(
              chat._id.toString(),
              { msg: msgText, timestamp: Date.now(), sender: "web" },
              "web"
            );
          }
        } else {

          if(chat?.step === 0){
            //get name
            await chatsCollection.updateOne({_id: chat._id}, {$set: {step: 1, webName: msgText}})
            telegramBot.sendMessage(telegramChatId, "What is your email?");
          }else if(chat?.step === 1){
            //get email
            const website = await websitesCollection.findOne({
              _id: new ObjectId(chat?.websiteId),
            });
      
            await chatsCollection.updateOne({_id: chat._id}, {$set: {step: 2, userEmail: msgText}})
            telegramBot.sendMessage(telegramChatId, website?.metadata?.msg_4);
          }else if(chat?.step === 2){
            //get initial req
          telegramAddToBuffer(msg, telegramChatId, chat, msgText);

          }
          console.log("telegramAddToBuffer", chat._id.toString());
        }
      }
    }
  })
);



console.log("server running on port 8000");
server.listen(8000);

async function addBufferToDb(data) {
  const result = await bufferCollection.insertOne(data).catch((err) => {
    logger(`Database error while adding buffer: ${err.message}`);
    throw { status: 500, message: "Database error occurred" };
  });
  console.log(result);
  return result;
}

async function getDownloadFilePath(fileId) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    // extract the file path
    const res2 = await res.json();
    const filePath = res2.result.file_path;

    // now that we've "file path" we can generate the download link
    const downloadURL = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    return downloadURL;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function addWorkerToDb(data) {
  try {
    if (!data.email || !data.password) {
      throw { status: 400, message: "Missing required worker data" };
    }

    const existingWorker = await workersCollection
      .findOne({ email: data.email })
      .catch((err) => {
        logger(`Database error while finding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    if (existingWorker) {
      throw { status: 409, message: "Worker with this email already exists" };
    }

    const result = await workersCollection
      .insertOne({
        ...data,
        chats: [],
        websites: [],
        createdAt: new Date(),
      })
      .catch((err) => {
        logger(`Database error while adding worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    logger(`New worker added with ID: ${result.insertedId}`);
    return result.insertedId;
  } catch (error) {
    logger(`Error in addWorkerToDb: ${error.message}`);
    throw error;
  }
}

async function addMsgToChat(chatId, msg, type) {
  console.log("addMsgToChat", chatId, msg, type);
  try {
    if (!ObjectId.isValid(chatId)) {
      throw { status: 400, message: "Invalid chat ID format" };
    }

    if (!msg || !type) {
      throw { status: 400, message: "Message and type are required" };
    }

    const result = await chatsCollection
      .updateOne(
        { _id: new ObjectId(chatId) },
        {
          $push: {
            chat: {
              ...msg,
              sender: type,
              timestamp: new Date(),
            },
          },
        }
      )
      .catch((err) => {
        logger(`Database error while adding message to chat: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });

    if (result.matchedCount === 0) {
      throw { status: 404, message: "Chat not found" };
    }

    logger(`Message added to chat ${chatId}`);
    return result;
  } catch (error) {
    logger(`Error in addMsgToChat: ${error.message}`);
    throw error;
  }
}

async function addChatToWorker(userToken, chatId) {
  try {
    const decodedToken = jwt.verify(userToken, tokenSecret);
    // Convert string ID to ObjectId
    const workerId = new ObjectId(decodedToken.id);

    const result = await workersCollection
      .updateOne({ _id: workerId }, { $push: { chats: chatId } })
      .catch((err) => {
        logger(`Database error while adding chat to worker: ${err.message}`);
        throw { status: 500, message: "Database error occurred" };
      });
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}

async function uploadFielToServer(messageMedia) {
  console.log("uploadFielToServer");
  return new Promise((resolve, reject) => {
    // Create a Buffer from the base64 data
    const buffer = Buffer.from(messageMedia.data, "base64");

    // Create a new tus upload
    const upload = new tus.Upload(buffer, {
      endpoint: process.env.TUS_ENDPOINT || "https://app.chatzu.ai/files/", // Configure your tus server endpoint
      metadata: {
        filename:
          messageMedia.filename ||
          `whatsapp-file-${Date.now()}.${messageMedia.mimetype.split("/")[1]}`,
        filetype: messageMedia.mimetype,
      },
      onError: function (error) {
        console.log("Failed to upload:", error);
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log("Upload progress:", percentage, "%");
      },
      onSuccess: function () {
        console.log("Upload completed successfully!");
        resolve(upload.url); // Return the URL where the file was uploaded
      },
    });

    // Start the upload
    upload.start();
  });
}

async function removeChatFromBuffer(chatId) {
  const result = await bufferCollection
    .deleteOne({ chatId: chatId })
    .catch((err) => {
      logger(`Database error while deleting chat from buffer: ${err.message}`);
      throw { status: 500, message: "Database error occurred" };
    });
  console.log(result);
  return result;
}

async function addWorkerToWebsite(workerId, websiteId) {
  const resultWebsite = await websitesCollection
    .updateOne(
      { _id: new ObjectId(websiteId) },
      { $push: { workers: new ObjectId(workerId) } }
    )
    .catch((err) => {
      logger(`Database error while adding worker to website: ${err.message}`);
      throw { status: 500, message: "Database error occurred" };
    });
  const resultWorker = await workersCollection
    .updateOne(
      { _id: new ObjectId(workerId) },
      { $push: { websites: new ObjectId(websiteId) } }
    )
    .catch((err) => {
      logger(`Database error while adding website to worker: ${err.message}`);
      throw { status: 500, message: "Database error occurred" };
    });
  console.log(resultWebsite, resultWorker);
  return resultWebsite;
}

async function removeWorkerFromWebsite(workerId, websiteId) {
  const resultWebsite = await websitesCollection
    .updateOne(
      { _id: new ObjectId(websiteId) },
      { $pull: { workers: new ObjectId(workerId) } }
    )
    .catch((err) => {
      logger(
        `Database error while removing worker from website: ${err.message}`
      );
      throw { status: 500, message: "Database error occurred" };
    });
  const resultWorker = await workersCollection
    .updateOne(
      { _id: new ObjectId(workerId) },
      { $pull: { websites: new ObjectId(websiteId) } }
    )
    .catch((err) => {
      logger(
        `Database error while removing website from worker: ${err.message}`
      );
      throw { status: 500, message: "Database error occurred" };
    });
  console.log(resultWebsite, resultWorker);
  return resultWebsite;
}

async function telegramAddToBuffer(msg, chatId, chatDoc, initialMessage) {
  const existingBuffer = await bufferCollection
    .findOne({
      chatId: chatDoc._id,
    })
    .catch((err) => {
      console.log(err);
      return null;
    });

  await chatsCollection
    .updateOne(
      { _id: chatDoc._id },
      {
        $push: {
          chat: { msg: initialMessage, sender: "web", timestamp: Date.now() },
        },
      }
    )
    .catch((err) => {
      console.log(err);
      return null;
    });

  console.log(existingBuffer);

  if (existingBuffer) {
    logger("Chat already exists in system");

    return;
  }

  console.log("chatDoc", chatDoc);

  // Continue with existing logic if chat doesn't exist
  // const initialMessage = JSON.parse(socket.handshake.query.intialMessage);


  const bufferRoomSize = io.sockets.adapter.rooms.get(chatDoc?.websiteId.toString())?.size || 0;

  // Check if there are any workers available (connected to buffer room)
  const isWorkerAvailable = bufferRoomSize > 0;

  if(!isWorkerAvailable){
    // whatsappClient_1.sendMessage(whatsappChatId, "All agents are currently busy, we will respond here within the next 1 - 6 hours.");
   
    telegramBot.sendMessage(chatId,"All agents are currently busy, we will respond here within the next 1 - 6 hours.");
   
    await chatsCollection.updateOne(
      { _id: chatDoc._id },
      { $set: { step: 4 } }
    );
 
  }else{
    telegramBot.sendMessage(chatId, "An agent will respond to your message shortly.");
  }

  const website = await websitesCollection.findOne({_id: chatDoc?.websiteId}).catch((err) => {
    console.log(err);
    return null;
  });  

  const oldUser = await chatsCollection.findOne({
    webEmail:msg?.chat?.username,
  }).catch((err) => {
    console.log(err);
    return null;
  });
  


  const bufferResult = await addBufferToDb({
    userToken: chatDoc?.userToken,
    type: "telegram",
    initialMessage: {
      msg: initialMessage,
      timestamp: Date.now(),
    },
    chatId: chatDoc?._id.toString(),
    webName: `${msg?.chat?.first_name}`,
    websiteId: chatDoc?.websiteId.toString(),
    webEmail: msg?.chat?.username,
    metadata: chatDoc?.metadata,
    websiteDomain: website?.domain,
    isOldUser: oldUser ? true : false,
  });

  //TODO : VALIDATE
  // socket.join("web");
  // socket.join(socket.handshake.query.userToken);
  // socket.join(socket.handshake.query.websiteId);

  console.log("========================");
  console.log("web joined room", chatDoc?.userToken);
  console.log("========================");

  //add buffer to db

  logger("sending : buffer-request");
  io.to(chatDoc?.websiteId.toString()).emit("buffer-request", {
    userToken: chatDoc?.userToken,
    type: "telegram",
    initialMessage: {
      msg: initialMessage,
      timestamp: Date.now(),
    },
    chatId: chatDoc?._id.toString(),
    webName: `${msg?.chat?.first_name}`,
    websiteId: chatDoc?.websiteId.toString(),
    webEmail: msg?.chat?.username,
    metadata: chatDoc?.metadata,
    websiteDomain: website?.domain,
    isOldUser: oldUser ? true : false,
  });
}

async function whatsappAddToBuffer(msg, whatsappChatId, chatDoc, initialMessage) {
  const existingBuffer = await bufferCollection
    .findOne({
      chatId: chatDoc._id,
    })
    .catch((err) => {
      console.log(err);
      return null;
    });

  await chatsCollection
    .updateOne(
      { _id: chatDoc._id },
      {
        $push: {
          chat: { msg: initialMessage, sender: "web", timestamp: Date.now() },
        },
      }
    )
    .catch((err) => {
      console.log(err);
      return null;
    });

  console.log(existingBuffer);

  if (existingBuffer) {
    logger("Chat already exists in system");

    return;
  }

  console.log("chatDoc", chatDoc);

  // Continue with existing logic if chat doesn't exist
  // const initialMessage = JSON.parse(socket.handshake.query.intialMessage);

  const bufferRoomSize = io.sockets.adapter.rooms.get(chatDoc?.websiteId.toString())?.size || 0;

  // Check if there are any workers available (connected to buffer room)
  const isWorkerAvailable = bufferRoomSize > 0;

  if(!isWorkerAvailable){
    whatsappClient_1.sendMessage(whatsappChatId, "All agents are currently busy, we will respond here within the next 1 - 6 hours.");
    await chatsCollection.updateOne(
      { _id: chatDoc._id },
      { $set: { step: 4 } }
    );
 
  }else {
    console.log("worker available");
    whatsappClient_1.sendMessage(whatsappChatId, "An agent will respond to your message shortly.");

  }


  const website = await websitesCollection.findOne({_id: chatDoc?.websiteId}).catch((err) => {
    console.log(err);
    return null;
  });  

  const oldUser = await chatsCollection.findOne({
    webEmail:msg?.from?.split("@")[0],
  }).catch((err) => {
    console.log(err);
    return null;
  });
  const bufferResult = await addBufferToDb({
    userToken: chatDoc?.userToken,
    type: "whatsapp",
    initialMessage: {
      msg: initialMessage,
      timestamp: Date.now(),
    },
    chatId: chatDoc?._id.toString(),
    webName: chatDoc?.webName,
    websiteId: chatDoc?.websiteId.toString(),
    webEmail: msg?.from?.split("@")[0],
    metadata: chatDoc?.metadata,
    websiteDomain: website?.domain,
    userEmail: chatDoc?.userEmail,
    isOldUser: oldUser ? true : false,
  });


  console.log("========================");
  console.log("web joined room", chatDoc?.userToken);
  console.log("========================");

  //add buffer to db

  logger("sending : buffer-request");
  io.to(chatDoc?.websiteId.toString()).emit("buffer-request", {
    userToken: chatDoc?.userToken,
    type: "whatsapp",
    initialMessage: {
      msg: initialMessage,
      timestamp: Date.now(),
    },
    chatId: chatDoc?._id.toString(),
    webName: chatDoc?.webName,
    websiteId: chatDoc?.websiteId.toString(),
    webEmail: msg?.from?.split("@")[0],
    metadata: chatDoc?.metadata,
    websiteDomain: website?.domain,
    userEmail: chatDoc?.userEmail,
    isOldUser: oldUser ? true : false,
  });
}

function logger(msg) {
  console.log(`[${new Date().toISOString()}] |  ${msg}`);
}

// Function to handle chat timeouts
async function handleChatTimeouts() {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000; // 30 minutes in milliseconds
  
  try {
    // First find chats that need updating
    const inactiveChats = await chatsCollection.find({
      'disconnect': { 
        $exists: true,
        $eq: { time: 0, party: "" }  // Matches exact disconnect object structure
      },
      'chat': { 
        $exists: true, 
        $ne: [] 
      }
    }).toArray();

    // Filter and update chats with old last messages
    for (const chat of inactiveChats) {
      const lastMessage = chat.chat[chat.chat.length - 1];
      if (lastMessage && lastMessage.timestamp < thirtyMinutesAgo) {
        await chatsCollection.updateOne(
          { _id: chat._id },
          {
            $set: {
              disconnect: {
                time: Date.now(),
                party: 'web'
              }
            }
          }
        );
        logger(`Updated inactive chat ${chat._id} as disconnected`);
      }
    }

    // Clean up old buffer entries
    const bufferResult = await bufferCollection.deleteMany({
      'initialMessage.timestamp': { $lt: thirtyMinutesAgo }
    });

    if (bufferResult.deletedCount > 0) {
      logger(`Cleaned up ${bufferResult.deletedCount} old buffer entries`);
    }
  } catch (error) {
    logger(`Error in handleChatTimeouts: ${error.message}`);
  }
}

// Run the cleanup every 10 minutes
setInterval(handleChatTimeouts, 10 * 60 * 1000);

// Run once on server start
handleChatTimeouts();
