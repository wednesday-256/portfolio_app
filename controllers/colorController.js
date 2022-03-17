const Game = require("../models/game");
const async = require("async");
const Player = require("../models/player");
const { body, validationResult } = require("express-validator");
const Request = require("../models/request");
const api = require("../extensions/color_api");

exports.color_api = [
  body("command").isLength({ min: 1 }).withMessage("Invalid command"),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.send({ state: "error", errors: errors.array() });
    } else {
      if (req.body.command === "start") {
        Game.findById(req.body.game_id)
          .populate("player1")
          .populate("player2")
          .exec((err, result) => api.handle_start(err, result, req, res));
      } else if (req.body.command === "choice") {
        if (req.body.game_id === "") {
          return res.send({
            state: "error",
            errors: [{ msg: "Invalid Game Id." }],
          });
        }
        if (req.body.choice === "") {
          return res.send({
            state: "error",
            errors: [{ msg: "Invalid Option." }],
          });
        }
        Game.findById(req.body.game_id)
          .populate("player1")
          .populate("player2")
          .exec((err, result) => api.handle_choice(err, result, req, res));
      } else if (req.body.command === "restart") {
        if (req.user === "") {
          return res.send({
            state: "error",
            errors: [{ msg: "Session Expired. Please login." }],
          });
        }

        Player.findOne({ cookie: req.user }).exec((err, result) =>
          api.handle_restart(err, result, req, res)
        );
      } else if (req.body.command === "turn") {
        Game.findById(req.body.game_id)
          .populate("player1")
          .populate("player2")
          .exec((err, result) => api.handle_turn(err, result, req, res));
      } else if (req.body.command === "list") {
        api.list_handler(req, res);
      } else if (req.body.command === "create") {
        api.create_handler(req, res);
      } else if (req.body.command === "join") {
        api.join_handler(req, res);
      } else if (req.body.command === "request") {
        if (!req.body.req_id) {
          return res.send({
            state: "error",
            errors: [{ msg: "Invalid request Id." }],
          });
        }
        async.parallel(
          {
            request: (callback) =>
              Request.findById(req.body.req_id)
                .populate("sender")
                .populate("receiver")
                .exec(callback),
            the_game: (callback) =>
              Game.findById(req.body.game_id)
                .populate("player1")
                .populate("player2")
                .exec(callback),
          },
          (err, result) => api.handle_request(err, result, req, res)
        );
      } else if (req.body.command === "list_reqs") {
        if (!req.user) {
          res.send({
            state: "error",
            errors: [{ msg: "Please login/SignUp first." }],
          });
          return;
        }
        Request.find({ game_type: "color" })
          .populate("sender")
          .populate("receiver")
          .sort({ date_created: -1 })
          .limit(100)
          .exec((err, result) => api.handle_list_reqs(err, result, req, res));
      } else if (req.body.command === "create_req") {
        Game.findOne({ _id: req.body.game_id })
          .populate("player1")
          .populate("player2")
          .exec((err, result) => api.handle_create_req(err, result, req, res));
      }
    }
  },
];
