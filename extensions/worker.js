const { parentPort } = require("worker_threads");
const TEngine = require("./tttEngine.js");
const CEngine = require("./chkEngine.js");

parentPort.on("message", (msg) => {
  switch (msg.command) {
    case "t_move":
      t_move_handler(msg);
      break;
    case "c_move":
      c_move_handler(msg);
      break;
  }
});

const c_move_handler = async (msg) => {
  const c_engine = new CEngine();
  c_engine
    .call_cmove(msg.board, 2)
    .then((resp) => {
      //console.log(resp)
      parentPort.postMessage({
        resp: resp,
        status: "success",
        game_id: msg.game_id,
      });
    })
    .catch((e) =>
      parentPort.postMessage({ status: "error", msg: e.toString() })
    );
};

const t_move_handler = async (msg) => {
  const t_engine = new TEngine();
  t_engine
    .call_tmove(msg.board)
    .then((resp) => {
      parentPort.postMessage({
        resp: resp,
        status: "success",
        game_id: msg.game_id,
      });
    })
    .catch((e) =>
      parentPort.postMessage({ status: "error", msg: e.toString() })
    );
};
