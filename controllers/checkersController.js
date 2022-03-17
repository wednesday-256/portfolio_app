const Game = require("../models/game");
const async = require("async");
const { body, validationResult } = require("express-validator");
const CGame = require("../extensions/chk_game");
const { Worker } = require("worker_threads");
const Request = require("../models/request");
const api = require("../extensions/chk_api");

//worker for handling engine computations
const c_worker = new Worker("./extensions/worker.js");
c_worker.on("message", (msg) => {
  switch (msg.status) {
    case "success":
      Game.findById(msg.game_id)
        .populate("player1")
        .exec((err, the_game) => {
          if (err) {
            return console.log("Databae Error: Invalid Transaction " + err);
          }
          if (the_game == null) {
            return console.log("Error: Game Not found.");
          }
          let game = JSON.parse(the_game.game_state);
          the_game.moves.push(game);
          const c_game = new CGame(game);
          c_game.present_turn = 2;
          let move_response = c_game.move_piece(
            msg.resp.piece,
            msg.resp.position
          );
          switch (move_response[0]) {
            case 1:
              the_game.game_state = JSON.stringify(c_game);
              the_game.save((err) => {
                if (err) {
                  return console.log("Error: could not save. " + err);
                }
                c_worker.postMessage({
                  command: "c_move",
                  board: c_game,
                  game_id: the_game._id.toString(),
                });
              });
              break;
            case 0:
              if (c_game.winner > 0) {
                the_game.finished = true;
                the_game.winner = c_game.winner;
              }
              the_game.turn = 1;
              the_game.game_state = JSON.stringify(c_game);
              the_game.save((err) => {
                if (err) {
                  return console.log("Error: could not save. " + err);
                }
              });
          }
        });
  }
});

exports.checkers_api = [
  body("command").isLength({ min: 1 }).withMessage("Invalid Commad."),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.send({ state: "error", errors: errors.array() });
      return;
    }

    if (req.body.command == "start") {
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) => {
          api.handle_start(err, result, req, res);
        });
    } else if (
      req.body.command === "create" ||
      req.body.command === "restart"
    ) {
      api.create_handler(req, res);
    } else if (req.body.command === "list") {
      api.list_handler(req, res);
    } else if (req.body.command === "join") {
      api.join_handler(req, res);
    } else if (req.body.command == "turn") {
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) => api.handle_turn(err, result, req, res));
    } else if (req.body.command == "move") {
      if (req.body.positon == "" || req.body.piece == "") {
        return res.send({
          state: "error",
          errors: [
            { msg: "Invalid Piece/Position." },
            { msg: "Please try again or start a new game." },
          ],
        });
      }
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) =>
          api.handle_move(err, result, req, res, c_worker)
        );
    } else if (req.body.command == "request") {
      if (!req.body.req_id) {
        return res.send({
          state: "error",
          errors: [{ msg: "Invalid request Id." }],
        });
      }
      async.parallel(
        {
          request: (callback) => {
            Request.findById(req.body.req_id)
              .populate("sender")
              .populate("receiver")
              .exec(callback);
          },
          the_game: (callback) => {
            Game.findById(req.body.game_id)
              .populate("player1")
              .populate("player2")
              .exec(callback);
          },
        },
        (err, result) => api.handle_request(err, result, req, res)
      );
    } else if (req.body.command == "list_reqs") {
      if (!req.user) {
        res.send({
          state: "error",
          errors: [{ msg: "Please login/SignUp first." }],
        });
        return;
      }
      Request.find({ game_type: "checkers" })
        .populate("sender")
        .populate("receiver")
        .sort({ date_created: -1 })
        .limit(100)
        .exec((err, result) => api.handle_list_reqs(err, result, req, res));
    } else if (req.body.command == "create_req") {
      Game.findById(req.body.game_id)
        .populate("player1")
        .populate("player2")
        .exec((err, result) => api.handle_create_req(err, result, req, res));
    }
  },
];
