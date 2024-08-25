const router = require("express").Router();
const { catchErrors } = require("../handler/errorHandler");
const userController = require("../controller/userController");

router.post("/register", catchErrors(userController.register));
router.post("/login", catchErrors(userController.login));

module.exports = router;