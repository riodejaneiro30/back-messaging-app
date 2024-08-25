const jwt = require('jwt-then');

module.exports = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            throw "No token provided";
        }
        const token = req.headers.authorization.split(' ')[1];

        console.log("Token : {}", token);

        const payload = await jwt.verify(token, process.env.SECRET_KEY);
        console.log("Payload : {}", payload)

        req.payload = payload;
        
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message : "Unauthorized" });
    }
}