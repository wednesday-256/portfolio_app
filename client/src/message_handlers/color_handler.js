const clr_create_handler = (data, navigate) => {
  navigate("/color/" + data.game_id);
};

const start_handler = (
  data,
  score,
  context,
  msg,
  join,
  colors,
  turn,
  finished,
  waiting,
  post
) => {
  if (data.join_state === "waiting" && data.is_player1) {
    post({ command: "start", game_id: data.game_id, second: true });
    let box_interval = setInterval(() => {
      let check = document.querySelector(".cl_w_box");
      if (check === null) {
        post({ command: "stop" });
        clearInterval(box_interval);
      }
    }, 5000);
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
    data.join_state !== "oneplayer" ? join(true) : join(false);
  }
  colors(data.colors);

  if (data.finished) {
    finished({
      index: data.index,
      winner: data.winner,
    });
    context(data.score > 6 ? "success" : data.score > 3 ? "warning" : "danger");
    msg(
      `${data.winner} ${data.score > 3 ? "won this game" : "lost this game."}.`
    );
    score(data.score);
    return;
  }
  if (data.turn) {
    context("info");
    msg("Choose a color .");
  } else if (!data.turn && data.join_state === "joined" && !data.is_player1) {
    post({ command: "turn", game_id: data.game_id });
  }
  turn(data.turn);
};

const choice_handler = (
  data,
  context,
  msg,
  colors,
  turn,
  finished,
  score,
  post
) => {
  let res = [];
  data.colors.forEach((val, idx) => {
    if (data.attempted.includes(idx)) {
      res.push("");
      return;
    }
    res.push(val);
  });

  colors(res);
  if (data.response) {
    colors(data.colors);
    finished({
      index: data.index,
      winner: data.winner,
    });
    context(data.score > 6 ? "success" : data.score > 3 ? "warning" : "danger");
    msg(data.score > 3 ? "You won this game." : "Better luck next time.");
    turn(false);
    score(data.score + (data.join_state === "joined" ? 0 : 1));
    return;
  } else {
    context("danger");
    msg("Oops! Wrong color, Try another.");
  }

  if (data.join_state === "joined" && !data.response) {
    //turn_handler here
    context("warning");
    setTimeout(() => msg("Waiting for opponent."), 1000);
    post({ command: "turn", game_id: data.game_id });
  }

  return;
};

const restart_handler = (data) => {
  let url = "/color/" + data.game_id;
  window.location = window.location.origin + url;
};

const join_handler = (data) => {
  let url = "/color/" + data.game_id;
  window.location = window.location.origin + url;
};

const turn_handler = (data, finished, context, msg, colors, turn, score) => {
  let res = [];
  data.colors.forEach((val, idx) => {
    if (data.attempted.includes(idx)) {
      res.push("");
      return;
    }
    res.push(val);
  });

  colors(res);
  if (data.finished) {
    colors(data.colors);
    finished({ index: data.index });
    context("danger");
    msg("Better luck next time.");
    turn(false);
    score(0);
    return;
  } else {
    context("info");
    turn(true);
    msg("Choose a color.");
  }
};

const list_handler = (data, show, type, games) => {
  type("color");
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
    window.location = `/color/${data.game_id}`;
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
    let box = document.querySelector(".cl_box");
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
  clr_create_handler,
  start_handler,
  choice_handler,
  restart_handler,
  join_handler,
  turn_handler,
  list_handler,
  request_handler,
  create_req_handler,
  list_req_handler,
};
