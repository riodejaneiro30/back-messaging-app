const router = require("express").Router();
const { catchErrors } = require("../handler/errorHandler");
const chatroomController = require("../controller/chatroomController");
const auth = require("../middleware/auth");

router.get("/", auth, catchErrors(chatroomController.getAllChatrooms));
router.get("/:id", auth, catchErrors(chatroomController.getChatroom));
router.post("/", auth, catchErrors(chatroomController.create));

module.exports = router;