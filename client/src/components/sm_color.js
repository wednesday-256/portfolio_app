import { InputGroup, Button, Form, Spinner } from "react-bootstrap";
import { useState } from "react";

const ClBox = (props) => {
  const [btn_state, setBtnState] = useState([false, false, false, false]);

  const update_btn_state = (idx, chk) => {
    let arr = [];
    let n_val = chk ? false : true;
    btn_state.forEach((val, ind) => {
      idx === ind ? arr.push(n_val) : arr.push(val);
    });
    return arr;
  };

  const single_handler = () => {
    setBtnState(update_btn_state(0));
    props.start_game({
      command: "create",
      option: "oneplayer",
    });

    let btnTimeout = setTimeout(() => {
      let chk = document.getElementById("clbox");
      if (chk === null) {
        clearTimeout(btnTimeout);
        return;
      }
      setBtnState(update_btn_state(0, true));
    }, 8000);
  };

  const list_handler = () => {
    props.start_game({ command: "list" });
  };

  const multi_handler = () => {
    setBtnState(update_btn_state(1));
    props.start_game({
      command: "create",
      option: "friend",
    });

    let btnTimeout = setTimeout(() => {
      let chk = document.getElementById("clbox");
      if (chk === null) {
        clearTimeout(btnTimeout);
        return;
      }
      setBtnState(update_btn_state(1, true));
    }, 8000);
  };
  const join_game = () => {
    let code = document.querySelectorAll(".cl-code");
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
        header: "Color Join Code.",
      });
      return;
    }
    props.start_game({
      command: "join",
      key: code,
    });
  };
  return (
    <div id="clbox" className="d-flex flex-column justify-content-between">
      <Button
        variant="dark"
        disabled={btn_state[0]}
        className="my-1"
        onClick={() => single_handler()}
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
            <i className="bi bi-person-fill me-2"></i> Single Player.
          </>
        )}
      </Button>

      <Button
        disabled={btn_state[1]}
        variant="dark"
        className="my-1"
        onClick={() => multi_handler()}
      >
        {btn_state[1] ? (
          <>
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
            />{" "}
            Loading...
          </>
        ) : (
          <>
            <i className="bi bi-people-fill me-2"></i> Play With A Friend.
          </>
        )}
      </Button>
      <Button
        variant="success"
        className="my-1 bg-gradient"
        disabled={btn_state[2]}
        onClick={() => list_handler()}
      >
        {btn_state[2] ? (
          <>
            <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
            />{" "}
            Loading...
          </>
        ) : (
          <>
            <i className="bi bi-list-task me-2"></i> Game List.
          </>
        )}
      </Button>
      <InputGroup className="my-2">
        <InputGroup.Text>
          <i className="bi bi-key-fill text-success"></i>
        </InputGroup.Text>
        <Form.Control
          type="text"
          className="cl-code"
          placeholder="Enter Join Code"
          onKeyPress={(e) => (e.key === "Enter" ? join_game() : null)}
        />
        <Button
          onClick={() => join_game()}
          disabled={btn_state[3]}
          variant="success"
          className="bg-gradient"
        >
          {btn_state[2] ? (
            <>
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />{" "}
              Loading...
            </>
          ) : (
            <>
              <i className="bi bi-link me-2"></i>
              Join
            </>
          )}
        </Button>
      </InputGroup>
    </div>
  );
};

export { ClBox };
