const worker = () => {
  let api_add;
  let stop = true;
  let stop_turn = true;

  const get_options = (b) => ({
    body: JSON.stringify(b),
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });

  const message_handler = (data, cmd) => {
    fetch(api_add, get_options(data))
      .then((resp) => {
        if (!resp.ok) {
          return {
            state: "error",
            errors: [
              {
                msg:
                  resp.status === 500
                    ? "Unable to reach server "
                    : resp.statusText,
              },
            ],
          };
        }
        return resp.json();
      })
      .then((resp) => {
        if (cmd === "turn" && !resp.turn && !resp.finished && stop_turn) {
          setTimeout(() => message_handler(data, cmd), 1500);
        } else if (
          cmd === "start" &&
          resp.second &&
          resp.join_state === "waiting" &&
          stop
        ) {
          setTimeout(() => message_handler(data, cmd), 3000);
        } else if (
          cmd === "request" &&
          data.action === "check" &&
          stop &&
          resp.state !== "error" &&
          !resp.deny &&
          !resp.game_id
        ) {
          setTimeout(() => message_handler(data, cmd), 3000);
        } else {
          if (!stop) {
            stop = true;
            if (resp.join_state === "waiting") {
              return;
            }
          }
          if (!stop_turn) {
            stop_turn = true;
            return;
          }
          postMessage({ command: cmd, data: resp });
        }
      });
  };

  onmessage = (message) => {
    if (message.data.command === "url") {
      api_add = message.data.url;
      return;
    }
    if (message.data.command === "stop") {
      stop = false;
      return;
    }
    if (message.data.command === "stop_turn") {
      stop_turn = false;
      return;
    }
    let data = message.data;
    message_handler(data, data.command);
  };
};

export default worker;
