var Player = require("../models/player");
const auth = require("../extensions/auth");
const { body, validationResult } = require("express-validator");
const api = require("../extensions/player_api");

exports.player_index_get = (req, res, next) => {
  let context = {
    title: "Snow Globe",
  };
  res.render("index", context);
};

exports.player_api = [
  body("command").isLength({ min: 1 }).withMessage("Invalid Action."),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.send({ state: "error", errors: errors.array() });
      return;
    }
    switch (req.body.command) {
      case "auth":
        api.register_handler(req, res);
        break;
      case "delete_user":
        api.delete_handler(req, res);
        break;
      case "update":
        api.update_handler(req, res);
        break;
      case "recover":
        api.recovery_handler(req, res);
        break;
      case "login":
        api.login_handler(req, res);
        break;
      case "logout":
        api.logout_handler(req, res);
        break;
      case "check":
        api.check_handler(req, res);
        break;
    }
  },
];
