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

        const user = await User.findOne({ _id: socket.userId });
        socket.name = user.name;
        
        next();
    } catch (error) {
    }
});

let onlineUsers = [];

io.on("connection", (socket) => {
    console.log("User connected : ", socket.userId);

    const userExists = onlineUsers.some(user => user.userId === socket.userId);

    if (!userExists) {
        onlineUsers.push({
            userId: socket.userId,
            name: socket.name
        });
    }

    io.emit("updateOnlineUsers", onlineUsers);
    console.log("onlineUsers", onlineUsers);

    socket.on("getOnlineUsers", () => {
        socket.emit("updateOnlineUsers", onlineUsers);
    });

    socket.on("importantMessage", (data) => {
        const { message } = data;

        console.log("Important Message : ", message);
        // Broadcast to all connected chatrooms
        io.emit("receiveImportantMessage", { message });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected : ", socket.userId);

        onlineUsers = onlineUsers.filter(user => user.userId !== socket.userId);

        io.emit("updateOnlineUsers", onlineUsers);
        console.log("onlineUsers", onlineUsers);
    });

    socket.on("joinChatroom", ({chatroomId}) => {
        socket.join(chatroomId);
        console.log("User joined chatroom : ", chatroomId);
    });

    socket.on("leaveChatroom", ({chatroomId}) => {
        socket.leave(chatroomId);
        console.log("User left chatroom : ", chatroomId);
    });

    socket.on("chatroomMessage", async ({chatroomId, message, formattedTime}) => {
        if (message.trim().length > 0) {
            const user = await User.findOne({ _id: socket.userId });
            const messageNew = new Message(
                {
                    chatroom: chatroomId,
                    user: socket.userId,
                    message: message
                }
            )

            console.log("Chatroom Message : ", message);

            io.to(chatroomId).emit("receiveMessage", {
                message: message,
                name: user.name,
                sender: socket.userId,
                formattedTime: formattedTime
            });

            await messageNew.save();
        }
    });
})