import { Container, Form, Collapse } from "react-bootstrap";
import { useState } from "react";
import { ClBox } from "./sm_color";
import { TtBox } from "./sm_ttt";
import { ChBox } from "./sm_chk";

const SmHome = (props) => {
  const [clopen, setClOpen] = useState("");

  const handle_g_type = () => {
    let val = document.getElementById("g_type").value;
    if (val === "false") {
      setClOpen("");
      return;
    }
    if (val === "0") {
      setClOpen(0);
    }
    if (val === "1") {
      setClOpen(1);
    }
    if (val === "2") {
      setClOpen(2);
    }
  };
  return (
    <Container className=" mt-3 p-3 shadow rounded">
      <Form.Select
        id="g_type"
        className="text-center mb-2 shadow"
        onChange={handle_g_type}
      >
        <option value={false} className="fw-bold ">
          Select A Game to Play{" "}
        </option>
        {["The Color Game", "Tic-Tac-Toe", "Checkers"].map((val, idx) => (
          <option value={idx} className="p-3" key={idx}>
            {val}
          </option>
        ))}
      </Form.Select>
      <Collapse in={clopen === 0 ? true : false}>
        <div>
          <ClBox notify={props.notify} start_game={props.start_game.color} />
        </div>
      </Collapse>
      <Collapse in={clopen === 1 ? true : false}>
        <div>
          <TtBox notify={props.notify} start_game={props.start_game.ttt} />
        </div>
      </Collapse>
      <Collapse in={clopen === 2 ? true : false}>
        <div>
          <ChBox notify={props.notify} start_game={props.start_game.chk} />
        </div>
      </Collapse>
    </Container>
  );
};

export { SmHome };
