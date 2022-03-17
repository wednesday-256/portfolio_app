const Game = require("../models/game");
const async = require("async");
const { body, validationResult } = require("express-validator");
const TGame = require("../extensions/ttt_game");
const { Worker } = require("worker_threads");
const api = require("../extensions/ttt_api");
const Request = require("../models/request");

//worker for handling engine computations
const t_worker = new Worker("./extensions/worker.js");
t_worker.on("message", (msg) => {
  switch (msg.status) {
    case "success":
      Game.findById(msg.game_id).exec((err, the_game) => {
        if (err) {
          return console.log("Database: Invalid Game ID" + err);
        }
        if (the_game == null) {
          return console.log("No game: Invalid Game ID");
        }
        let game = JSON.parse(the_game.game_state);
        const t_game = new TGame(game);
        t_game.present_turn = 2;
        t_game.make_move(msg.resp.position);
        let win_response = t_game.check_winner();
        win_response ? (the_game.finished = true) : null;
        the_game.game_state = JSON.stringify(t_game);
        the_game.turn = 1;
        win_response == 2 ? (the_game.winner = "Erik") : null;
        win_response == "draw" ? (the_game.winner = "Nobody") : null;
        the_game.save((err) => {
          if (err) {
            return console.log("Error: Could not save " + err);
          }
        });
      });
  }
});

exports.tictactoe_api = [
  body("command").isLength({ min: 1 }).withMessage("Invalid Command"),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.send({ state: "error", errors: errors.array() });
      return;
    }

    if (req.body.command === "start") {
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) => api.handle_start(err, result, req, res));
    } else if (
      req.body.command === "create" ||
      req.body.command === "restart"
    ) {
      api.create_handler(req, res, t_worker);
    } else if (req.body.command === "list") {
      api.list_handler(req, res);
    } else if (req.body.command === "join") {
      api.join_handler(req, res);
    } else if (req.body.command === "choice") {
      if (req.body.choice === "") {
        return res.send({
          state: "error",
          errors: [{ msg: "Invalid Choice! Please try again." }],
        });
      }
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) =>
          api.handle_choice(err, result, req, res, t_worker)
        );
    } else if (req.body.command === "turn") {
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) => api.handle_turn(err, result, req, res));
    } else if (req.body.command === "state") {
      Game.findById(req.body.game_id).exec((err, result) =>
        api.handle_state(err, result, res)
      );
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
        (err, results) => api.handle_request(err, results, req, res)
      );
    } else if (req.body.command === "list_reqs") {
      if (!req.user) {
        res.send({
          state: "error",
          errors: [{ msg: "Please login/SignUp first." }],
        });
        return;
      }
      Request.find({ game_type: "tictactoe" })
        .populate("sender")
        .populate("receiver")
        .sort({ date_created: -1 })
        .limit(100)
        .exec((err, result) => api.handle_list_reqs(err, result, req, res));
    } else if (req.body.command === "create_req") {
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) => api.handle_create_req(err, result, req, res));
    }
  },
];
