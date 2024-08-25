const mongoose = require("mongoose");
const User = mongoose.model("User");
const sha256 = require("js-sha256");
const jwt = require("jwt-then");

const register = async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw "User already exists";
    }

    const emailRegex = /@gmail.com|@yahoo.com|@hotmail.com|@outlook.com|@live.com/;

    if (!emailRegex.test(email)) {
        throw "Invalid email address";
    }

    if (password.length < 6) {
        throw "Password must be at least 6 characters long";
    }

    const user = new User({ name, email, password : sha256(password + process.env.SALT) });
    await user.save();


    res.status(200).json({ message: "User ["+ name +"] registered successfully" });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password: sha256(password + process.env.SALT) });
    if (!user) {
        throw "Email and password did not match";
    }

    const token = await jwt.sign({ _id: user._id }, process.env.SECRET_KEY);

    res.status(200).json({ message: "Login successful", token: token });
};

module.exports = {
    register, login
};


