const mongoose = require("mongoose");
const Chatroom = mongoose.model("Chatroom");
const sha256 = require("js-sha256");
const jwt = require("jwt-then");

const create = async (req, res) => {
    const { name } = req.body;

    const nameRegex = /^[A-za-z\s]+$/;

    if (!nameRegex.test(name)) {
        throw "Chatroom only contain alphabets";
    }

    const chatroomExists = await Chatroom.findOne({ name });
    if (chatroomExists) {
        throw "Chatroom already exists";
    }

    const chatroom = new Chatroom({
        name
    });
    await chatroom.save();
    
    res.status(200).json({
        message: "Chatroom ["+ name +"] created successfully",
    });
};

const getAllChatrooms = async (req, res) => {
    const chatrooms = await Chatroom.find({});
    res.status(200).json(chatrooms);
}

const getChatroom = async (req, res) => {
    const { id } = req.params;
    const chatroom = await Chatroom.findById(id);
    res.status(200).json(chatroom);
}

module.exports = {
    create, getAllChatrooms, getChatroom,
};