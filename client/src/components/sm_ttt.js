import { InputGroup, Button, Form, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";

const TtBox = (props) => {
  const [btn_state, setBtnState] = useState([false, false, false, false]);

  useEffect(() => {
    if (btn_state[2]) {
      props.start_game({
        command: "create",
        option: "oneplayer",
      });
    } else if (btn_state[1]) {
      props.start_game({
        command: "create",
        option: "friend",
      });
    } else if (btn_state[0]) {
      props.start_game({
        command: "create",
        option: "computer",
      });
    }
  }, [btn_state]);

  const single_handler = () => {
    setBtnState([btn_state[0], btn_state[1], true]);

    let btnT = setTimeout(() => {
      let chk = document.getElementById("tttbox");
      if (chk === null) {
        clearTimeout(btnT);
        return;
      }
      setBtnState([btn_state[0], btn_state[1], false]);
    }, 7000);
  };

  const list_handler = () => {
    props.start_game({ command: "list" });
  };

  const multi_handler = () => {
    setBtnState([btn_state[0], true, btn_state[2]]);

    let btnT = setTimeout(() => {
      let chk = document.getElementById("tttbox");
      if (chk === null) {
        clearTimeout(btnT);
        return;
      }
      setBtnState([btn_state[0], false, btn_state[2]]);
    }, 7000);
  };

  const join_game = () => {
    let code = document.querySelectorAll("#tt_code");
    let use;
    if (code[0].value === "") {
      use = 1;
    } else {
      use = 0;
    }
    code = code[use].value.trim();
    if (code === "" || code.length < 6) {
      props.notify({
        body: [
          "Invalid Join code!",
          "Please note the Join code is case sensitive.",
        ],
        type: "warning",
        header: "TicTacToe Join Code.",
      });
      return;
    }
    props.start_game({
      command: "join",
      key: code,
    });
  };
  const erik_handler = () => {
    setBtnState([true, btn_state[1], btn_state[2]]);

    let btnT = setTimeout(() => {
      let chk = document.getElementById("tttbox");
      if (chk === null) {
        clearTimeout(btnT);
        return;
      }
      setBtnState([false, btn_state[1], btn_state[2]]);
    }, 7000);
  };
  return (
    <div id="tttbox" className="d-flex flex-column justify-content-between">
      <Button
        variant="outline-success"
        className="my-1"
        onClick={() => erik_handler()}
        disabled={btn_state[0]}
      >
        {btn_state[0] ? (
          <>
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />{" "}
            Loading...
          </>
        ) : (
          <>
            <i className="bi bi-robot me-2"></i> Play With Erik.
          </>
        )}
      </Button>

      <Button variant="dark" className="my-1" onClick={() => multi_handler()}>
        {btn_state[1] ? (
          <>
            {" "}
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Loading...
          </>
        ) : (
          <>
            <i className="bi bi-router-fill me-2"></i> Play With A Friend
            (Internet).
          </>
        )}
      </Button>

      <Button variant="dark" className="my-1" onClick={() => single_handler()}>
        {btn_state[2] ? (
          <>
            {" "}
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Loading...
          </>
        ) : (
          <>
            <i className="bi bi-people-fill me-2"></i> Play with A Friend (In
            Person).
          </>
        )}
      </Button>

      <Button
        variant="success"
        className="my-1 bg-gradient "
        onClick={() => list_handler()}
      >
        <i className="bi bi-list-task me-2"></i> Game List.
      </Button>

      <InputGroup className="my-2">
        <InputGroup.Text>
          <i className="bi bi-key-fill text-success"></i>
        </InputGroup.Text>
        <Form.Control
          id="tt_code"
          type="text"
          placeholder="Enter Join Code"
          onKeyPress={(e) => (e.key === "Enter" ? join_game() : null)}
        />
        <Button
          onClick={() => join_game()}
          variant="success"
          className="bg-gradient"
        >
          <i className="bi bi-link me-2"></i>
          Join
        </Button>
      </InputGroup>
    </div>
  );
};

export { TtBox };
