const ttt_create_handler = (data, navigate) => {
  navigate("/tictactoe/" + data.game_id);
};
const start_handler = (
  data,
  score,
  context,
  msg,
  join,
  board,
  turn,
  finished,
  waiting,
  post,
  engine,
  win_pos
) => {
  if (data.join_state === "engine") {
    engine(true);
  }
  if (data.join_state === "waiting" && data.is_player1) {
    post({ command: "start", game_id: data.game_id, second: true });
    let box_interval = setInterval(() => {
      let check = document.querySelector(".tw_box");
      if (check === null) {
        post({ command: "stop" });
        clearInterval(box_interval);
      }
    }, 4000);
  }
  if (!data.is_player1 && !data.finished && data.join_state === "waiting") {
    post({ command: "join", key: data.join_code });
    return;
  } else {
    if (data.join_state === "waiting") {
      waiting([data.join_code, data.is_player1 ? false : true]);
      post({ command: "turn", game_id: data.game_id });
    } else {
      waiting(false);
    }
    ["waiting", "joined"].includes(data.join_state) ? join(true) : join(false);
    data.join_state === "engine" ? engine(true) : engine(false);
  }
  board(data.board);
  score([data.player1_score, data.player2_score]);
  if (data.finished) {
    win_pos(data.win_pos);
    finished({
      win_pos: data.win_pos,
    });
    context(data.winner === "Nobody" ? "warning" : "success");
    msg(`${data.winner} won this game.`);
    return;
  } else if (data.turn) {
    context("info");
    msg("Your move");
  } else if (data.join_state === "joined") {
    context("warning");
    msg("Waiting for opponent");
  }
  if (
    !data.turn &&
    (data.join_state === "joined" || data.join_state === "engine")
  ) {
    post({ command: "turn", game_id: data.game_id });
  }
  turn(data.turn);
};

const choice_handler = (
  data,
  context,
  msg,
  board,
  turn,
  finished,
  score,
  post,
  win_pos
) => {
  score([data.player1_score, data.player2_score]);
  turn(data.turn);
  context("info");
  msg(`Player${data.turn === 1 ? 2 : 1}'s Turn.'`);
  finished(data.finished);
  if (data.finished) {
    win_pos([1, 2].includes(data.win_player) ? data.win_pos : false);
    let ctx = data.winner === "Nobody" ? "warning" : "success";
    context(ctx);
    msg(`${data.winner} won this game.`);
  }
  if (
    (data.join_state === "engine" || data.join_state === "joined") &&
    !data.finished
  ) {
    context("warning");
    msg("Waiting for opponent.");
    post({ command: "turn", game_id: data.game_id });
  }
  board(data.board);
};

const join_handler = (data) => {
  let url = "/tictactoe/" + data.game_id;
  window.location = window.location.origin + url;
};

const restart_handler = (data) => {
  let url = "/tictactoe/" + data.game_id;
  window.location = window.location.origin + url;
};

const turn_handler = (
  data,
  finished,
  context,
  msg,
  board,
  turn,
  score,
  win_pos
) => {
  board(data.board);
  turn(data.turn);
  if (data.finished) {
    finished(true);
    win_pos(data.win_pos);
    context("success");
    msg(`${data.winner} won this game.`);
    score(data.score);
  } else {
    context("info");
    turn(true);
    msg("Your move.");
  }
};

const list_handler = (data, show, type, games) => {
  type("tictactoe");
  games(data.games ? data.games : []);
  show(true);
};

const request_handler = (data, notify, sent) => {
  if (data.msg) {
    notify({
      type: "success",
      header: "Requests",
      body: data.msg,
    });
  }
  if (data.game_id) {
    window.location = `/tictactoe/${data.game_id}`;
    return;
  }
  if (data.deny) {
    notify({
      type: "warning",
      header: "Request",
      body: "Request denied!",
    });
    sent(false);
  }
};

const create_req_handler = (data, notify, sent, post, game_id) => {
  notify({
    type: "success",
    header: "Request",
    body: data.msg,
  });
  sent(true);
  post({
    command: "request",
    action: "check",
    req_id: data.req_id,
    game_id: game_id,
  });
  let c_time = setInterval(() => {
    let box = document.querySelector(".t_box");
    if (box === null) {
      post({ command: "stop" });
      clearInterval(c_time);
    }
  }, 5000);
};

const list_req_handler = (data, rlist, notify) => {
  rlist(Object.assign({}, data.msg));
  if (data.msg.received.length > 0) {
    notify({
      type: "info",
      header: "Request",
      body: "Received a rematch request.",
    });
  }
};

export {
  start_handler,
  ttt_create_handler,
  choice_handler,
  restart_handler,
  join_handler,
  turn_handler,
  list_handler,
  request_handler,
  create_req_handler,
  list_req_handler,
};
