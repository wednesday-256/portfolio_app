import { useParams, useOutletContext } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Container,
  Collapse,
  Button,
  Modal,
  Popover,
  OverlayTrigger,
  Overlay,
  Tooltip,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import {
  start_handler,
  choice_handler,
  restart_handler,
  turn_handler,
  request_handler,
  create_req_handler,
  list_req_handler,
} from "../message_handlers/color_handler";
import { RequestList } from "../components/modals/requests";

const ColorGame = () => {
  const [score, setScore] = useState(false);
  const [context, setContext] = useState("info");
  const [msg, setMsg] = useState("Weclome to The Color Game.");
  const [msgShow, setMsgShow] = useState(false);
  const [isJoin, setIsJoin] = useState(false);
  const [i_show, setIShow] = useState(false);
  const [colors, setColors] = useState(false);
  const [turn, setTurn] = useState(false);
  const [is_finished, setFinished] = useState(false);
  const [is_waiting, setWaiting] = useState(false);
  const [choice, setChoice] = useState(false);
  const [tipShow, setTipShow] = useState([false, false]);
  const [nBtn, setNBtn] = useState(false);
  const [rShow, setRShow] = useState(false);
  const [req_list, setReqList] = useState(false);
  const [sent, setSent] = useState(false);
  const target1 = useRef(null);
  const target2 = useRef(null);
  const params = useParams();
  const [notify, workers] = useOutletContext();

  const copy_text = (text, val) => {
    navigator.clipboard.writeText(text);
    val === 1 ? setTipShow([true, tipShow[1]]) : setTipShow([tipShow[0], true]);
  };

  let cl_add = window.location.origin + "/color/api";

  const new_handler = () => {
    let option = "";
    if (isJoin) {
      option = "friend";
    } else {
      option = "oneplayer";
    }
    setNBtn(true);
    workers.color.postMessage({ command: "restart", option: option });
  };

  const request_action = (action, req_id) => {
    workers.color.postMessage({
      command: "request",
      action: action,
      req_id: req_id,
      game_id: params.game_id,
    });
  };

  const send_request = () => {
    if (sent) {
      notify({
        type: "warning",
        header: "Requests",
        body: "Request already sent",
      });
      return;
    }
    workers.color.postMessage({
      command: "create_req",
      game_id: params.game_id,
    });
  };

  const show_requests = () => {
    workers.color.postMessage({
      command: "list_reqs",
    });
    setRShow(true);
  };

  const controls_box = (
    <div className="d-flex  py-3 flex-column  rounded shadow justify-content-around">
      <Button
        variant="dark"
        size="sm"
        disabled={nBtn}
        className="bg-gradient w-75  mx-auto mb-2"
        onClick={() => new_handler()}
      >
        {
          <>
            {nBtn ? (
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
                <i className="bi bi-plus-square-fill me-1"></i> New Game
              </>
            )}
          </>
        }
      </Button>
      {isJoin ? (
        <>
          <Button
            variant="dark"
            size="sm"
            className="bg-gradient w-75  mx-auto mb-2"
            onClick={() => send_request()}
          >
            <i className="bi bi-send-plus-fill me-1"></i> Request Rematch
          </Button>
          <Button
            variant="dark"
            size="sm"
            className="bg-gradient w-75  mx-auto mb-2"
            onClick={() => show_requests()}
          >
            <i className="bi bi-mailbox2 me-1"></i> Show Requests
          </Button>
        </>
      ) : (
        ""
      )}
      <Button
        variant="success"
        size="sm"
        className="bg-gradient w-75 mx-auto mb-2"
        onClick={() => workers.color.postMessage({ command: "list" })}
      >
        <i className="bi bi-list-ul me-1"></i> Game List
      </Button>
      <Button
        variant="outline-success"
        size="sm"
        className="bg-gradient w-75 mx-auto mb-2"
        onClick={() => setIShow(true)}
      >
        <i className="bi bi-info-square-fill me-1"></i> How to Play
      </Button>
    </div>
  );

  const color_update = (idx) => {
    if (!(colors instanceof Array)) {
      return;
    }
    let clr = "";
    let n_colors = [];
    colors.forEach((val, ind) => {
      n_colors.push(idx === ind ? clr : val);
    });
    setColors(n_colors);
  };

  const menu_popover = () => (
    <Popover
      id="menu_popover"
      className="position-absolute top-50 ms-3 translate-middle-x translate-middle-y  d-md-none w-100"
    >
      <Popover.Header as="h3">Menu</Popover.Header>
      <Popover.Body>{controls_box}</Popover.Body>
    </Popover>
  );

  useEffect(() => {
    if (choice === "" || choice === false) {
      return;
    }
    workers.color.postMessage({
      command: "choice",
      game_id: params.game_id,
      choice: choice,
    });
    setChoice(false);
  }, [choice]);

  useEffect(() => {
    if (is_finished) {
      color_update(is_finished.index);
      if (isJoin) {
        let r_time = setInterval(() => {
          let box = document.querySelector(".cl_box");
          if (box === null) {
            clearInterval(r_time);
            return;
          }
          workers.color.postMessage({
            command: "list_reqs",
          });
        }, 4000);
      }
    }
  }, [is_finished, choice]);

  useEffect(() => {
    workers.color.addEventListener("message", (msg) => {
      msg = msg.data;
      switch (msg.command) {
        case "start":
          start_handler(
            msg.data,
            setScore,
            setContext,
            setMsg,
            setIsJoin,
            setColors,
            setTurn,
            setFinished,
            setWaiting,
            (msg) => workers.color.postMessage(msg)
          );
          break;

        case "choice":
          choice_handler(
            msg.data,
            setContext,
            setMsg,
            setColors,
            setTurn,
            setFinished,
            setScore,
            (msg) => workers.color.postMessage(msg)
          );
          break;

        case "restart":
          restart_handler(msg.data);
          break;

        case "turn":
          turn_handler(
            msg.data,
            setFinished,
            setContext,
            setMsg,
            setColors,
            setTurn,
            setScore
          );
          break;

        case "request":
          request_handler(msg.data, notify, setSent);
          break;

        case "create_req":
          create_req_handler(
            msg.data,
            notify,
            setSent,
            (msg) => workers.color.postMessage(msg),
            params.game_id
          );
          break;

        case "list_reqs":
          list_req_handler(msg.data, setReqList, notify);
          break;
      }
    });
    workers.color.postMessage({ url: cl_add, command: "url" });

    setTimeout(
      () =>
        workers.color.postMessage({
          command: "start",
          game_id: params.game_id,
        }),
      1000
    );
    setTimeout(() => setMsgShow(true), 200);
  }, []);

  useEffect(() => {
    if (is_waiting && is_waiting[1]) {
      workers.color.postMessage({ command: "join", key: is_waiting });
    }
  }, [is_waiting]);

  useEffect(() => {
    let turn_time = setInterval(() => {
      let box = document.querySelector(".cl_box");
      if (box === null && !turn) {
        workers.color.postMessage({ command: "stop_turn" });
        clearInterval(turn_time);
      }
    }, 5000);
  }, [turn]);

  const select_handler = (val) => {
    if (is_finished) {
      notify({
        type: "warning",
        header: "Game Over.",
        body: "Start a new game instead.",
      });
      return;
    }
    if (!turn) {
      notify({ type: "warning", header: "Game Turn", body: "Not your turn." });
      return;
    }
    if (colors[val] === "") {
      notify({
        type: "warning",
        header: "Game choice",
        body: "Already chosen try another",
      });
      return;
    }
    color_update(val);
    setChoice(val);
    if (isJoin) {
      setTurn(false);
    }
  };

  let cl_box = [];
  let cnt = 0;
  for (let i = 0; i < 3; i++) {
    let arr = [];
    for (let j = 0; j < 3; j++) {
      arr.push(cnt);
      cnt++;
    }
    cl_box.push(arr);
  }
  let mark = <i className="bi bi-bookmark-x-fill fs-4 text-danger"></i>;
  let mark2 = <i className="bi bi-bookmark-x-fill fs-4 text-success"></i>;
  const populate = () => (
    <>
      {cl_box.map((arr, idx) => (
        <Row className="p-2" key={idx}>
          {arr.map((val, ind) => (
            <Col
              key={ind + "inner"}
              onClick={() => select_handler(val)}
              style={{
                opacity: 0.9,
                backgroundColor:
                  colors[val] !== "" ? "rgb(" + colors[val] + ")" : "",
              }}
              className="p-2  cl_box text-center fs-1 m-3 rounded-pill shadow hv-100"
            >
              {colors[val] === ""
                ? is_finished || score > 6
                  ? mark2
                  : mark
                : ""}
            </Col>
          ))}
        </Row>
      ))}
    </>
  );

  return (
    <Container
      fluid="md"
      className=" mt-3 pt-2 d-flex flex-row justify-content-between w-100"
    >
      <div className="d-none d-md-flex flex-column w-50 me-4">
        <div className="my-3 shadow  text-center">
          <p className="my-auto py-2">
            <i
              className={
                "bi bi-award-fill  me-2 " +
                (score > 6
                  ? "text-success"
                  : score > 3
                  ? "text-warning"
                  : "text-danger")
              }
            ></i>
            Score: {score}
          </p>
        </div>
        {controls_box}
      </div>
      <div className="d-flex  flex-column mb-3 w-100 mx-auto ms-md-4 justify-content-center">
        <div className="d-flex d-md-none mb-2 ms-3 text-center me-auto justify-content-start">
          <p className="my-auto py-2">
            <i
              className={
                "bi bi-award-fill  me-2 " +
                (score > 6
                  ? "text-success"
                  : score > 3
                  ? "text-warning"
                  : "text-danger")
              }
            ></i>
            Score: {score}
          </p>
        </div>
        <Container
          className={
            "text-center p-2 shadow rounded bg-opacity-10 bg-" + context
          }
        >
          <Collapse in={msgShow} timeout={1000}>
            <p className="h6   fst-italic">
              <i className={"bi me-2 bi-info-circle-fill text-" + context}></i>
              {msg}
            </p>
          </Collapse>
        </Container>
        <Container
          fluid="md"
          id="cl_board"
          className="mt-2 px-auto mx-auto w-100 h-100"
        >
          {populate()}
        </Container>
      </div>
      <Modal
        show={i_show}
        size="sm"
        onHide={() => setIShow(false)}
        centered={true}
      >
        <Modal.Header>
          <Modal.Title>How to Play.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="p-3 fs-6">
            Total of 9 options given, with one chosen color. Guess the right
            color, with the
            <em className="bg-info bg-opacity-10 p-2 fw-bold ">
              least number of attempts
            </em>
            to win.
          </p>
          <p className="p-3 fs-6">
            <em className="bg-info bg-opacity-10 p-2  fw-bold ">
              With every wrong guess, the maximum score that can be attained
              reduces by 1
            </em>
            . You can make guesses by clicking on the desired color box.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setIShow(false)}>
            <i className="bi bi-x-lg me-1"></i>Close
          </Button>
        </Modal.Footer>
      </Modal>
      {is_waiting ? (
        <Modal
          show={is_waiting ? true : false}
          size="md"
          centered={true}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header>
            <Modal.Title className="text-center ">
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
                className="ms-2 text-info"
              />{" "}
              Waiting For A Player.
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div
              className="p-3 d-flex cl_w_box flex-column fs-6"
              onClick={() =>
                copy_text(
                  window.location.origin + "/color/" + params.game_id,
                  1
                )
              }
            >
              <b>Join Link</b>
              <Overlay
                target={target1.current}
                show={tipShow[0]}
                placement="top"
                rootClose={true}
                rootCloseEvent="click"
                onHide={() => setTipShow([false, tipShow[1]])}
              >
                {(props) => (
                  <Tooltip id="copied-overlay-1" {...props}>
                    <i className="bi bi-info-circle-fill text-success me-2"></i>
                    Copied!
                  </Tooltip>
                )}
              </Overlay>
              <i className="bi bi-clipboard-plus-fill text-info me-2"></i>
              <div
                ref={target1}
                title="click to copy"
                className="bg-info bg-opacity-10 p-2 text-break fw-bold "
              >
                {window.location.origin + "/color/" + params.game_id}
              </div>
            </div>

            <div
              className="p-3 fs-6"
              onClick={() => copy_text(is_waiting[0], 2)}
            >
              <b> Join Code:</b>
              <Overlay
                target={target2.current}
                show={tipShow[1]}
                placement="top"
                rootClose={true}
                rootCloseEvent="click"
                onHide={() => setTipShow([tipShow[0], false])}
              >
                {(props) => (
                  <Tooltip id="copied-overlay-2" {...props}>
                    <i className="bi bi-info-circle-fill text-success me-2"></i>
                    Copied!
                  </Tooltip>
                )}
              </Overlay>
              <i className="bi bi-clipboard-plus-fill text-info mx-2"></i>
              <em
                ref={target2}
                title="click to copy"
                className="bg-info bg-opacity-10 p-2  fw-bold "
              >
                {is_waiting[0]}
              </em>
            </div>
            <p className="mt-3 bg-opacity-10 bg-info py-2 px-3 fs-6 rounded">
              <i className="bi bi-info-circle-fill me-2 text-info"></i> Send the
              link or code to a friend to join the game.{" "}
            </p>
          </Modal.Body>
        </Modal>
      ) : (
        ""
      )}
      {req_list ? (
        <RequestList
          onHide={() => setRShow(false)}
          show={rShow}
          request_action={(action, req_id) => request_action(action, req_id)}
          games={req_list}
          type="Color Game"
        />
      ) : (
        ""
      )}
      <OverlayTrigger
        delay={200}
        placement="top"
        trigger={["click", "focus"]}
        overlay={menu_popover}
      >
        <div className="position-relative d-block d-md-none">
          <Button
            variant="dark"
            className="rounded-circle bg-gradient position-fixed bottom-0 start-0 ms-3 mb-5"
          >
            <i className="bi bi-menu-button-fill text-center "></i>
          </Button>
        </div>
      </OverlayTrigger>
    </Container>
  );
};

export { ColorGame };
