require('dotenv').config();

const mongoose = require("mongoose");

const uri = process.env.ATLAS_URI

mongoose.connect(uri, {}).then(() => console.log("MongoDB connection established"))
.catch ((err) => console.log("MongoDB connection failed: ", err.message));

require('./model/Chatroom');
require('./model/User');
require('./model/Message');

const Message = mongoose.model("Message");
const User = mongoose.model("User");

const app = require("./app");

const server = app.listen(8000, () => {
    console.log("Server running on port 8000");
});

const io = require("socket.io")(server, {
    allowEIO3: true,
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
});
const jwt = require("jwt-then");

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.query.token;
        const payload = await jwt.verify(token, process.env.SECRET_KEY);
        socket.userId = payload._id;
        
        next();
    } catch (error) {
    }
});

io.on("connection", (socket) => {
    console.log("User connected : ", socket.userId);

    socket.on("disconnect", () => {
        console.log("User disconnected : ", socket.userId);
    });

    socket.on("joinChatroom", ({chatroomId}) => {
        socket.join(chatroomId);
        console.log("User joined chatroom : ", chatroomId);
    });

    socket.on("leaveChatroom", ({chatroomId}) => {
        socket.leave(chatroomId);
        console.log("User left chatroom : ", chatroomId);
    });

    socket.on("chatroomMessage", async ({chatroomId, message}) => {
        if (message.trim().length > 0) {
            const user = await User.findOne({ _id: socket.userId });
            const messageNew = new Message(
                {
                    chatroom: chatroomId,
                    user: socket.userId,
                    message: message
                }
            )

            io.to(chatroomId).emit("receiveMessage", {
                message: message,
                name: user.name,
                sender: socket.userId,
            });

            await messageNew.save();
        }
    });
})