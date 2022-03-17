const worker = () => {
  let api_add;

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
        postMessage({ command: cmd, data: resp });
      });
  };

  onmessage = (message) => {
    if (message.data.command === "url") {
      api_add = message.data.url;
      message_handler({ command: "check" }, "check");
      return;
    }
    let data = message.data;
    message_handler(data, data.command);
  };
};

export default worker;
