var express = require("express");
var router = express.Router();

//require controller modules
var playerController = require("../controllers/playerController");
var checkersController = require("../controllers/checkersController");
var colorController = require("../controllers/colorController");
var tictactoeController = require("../controllers/tictactoeController");

/* GET react page. */
router.get("/*", playerController.player_index_get);

//api player routes
router.post("/profile/api", playerController.player_api);

//api color routes
router.post("/color/api", colorController.color_api);

//api tictactoe routes
router.post("/tictactoe/api", tictactoeController.tictactoe_api);

//api checkers routes
router.post("/checkers/api", checkersController.checkers_api);

module.exports = router;
