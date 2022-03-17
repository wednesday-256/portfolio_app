import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  Container,
  Button,
  Collapse,
  Popover,
  Modal,
  OverlayTrigger,
  Col,
  Row,
  Spinner,
  Overlay,
  Tooltip,
} from "react-bootstrap";
import {
  start_handler,
  choice_handler,
  restart_handler,
  turn_handler,
  request_handler,
  create_req_handler,
  list_req_handler,
} from "../message_handlers/ttt_handler";
import { RequestList } from "../components/modals/requests";

const TGame = () => {
  const [score, setScore] = useState([0, 0]);
  const [context, setContext] = useState("info");
  const [msg, setMsg] = useState("Welcome to Tic-Tac-Toe.");
  const [msgShow, setMsgShow] = useState(false);
  const [isJoin, setIsJoin] = useState(false);
  const [i_show, setIShow] = useState(false);
  const [board, setBoard] = useState([3, 3, 3, 3, 3, 3, 3, 3, 3]);
  const [is_finished, setFinished] = useState(false);
  const [is_waiting, setWaiting] = useState(false);
  const [choice, setChoice] = useState(false);
  const [tipShow, setTipShow] = useState([false, false]);
  const [nBtn, setNBtn] = useState(false);
  const [turn, setTurn] = useState(0);
  const [isEngine, setEngine] = useState(false);
  const [winPos, setWinPos] = useState(false);
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

  let ttt_add = window.location.origin + "/tictactoe/api";

  const new_handler = () => {
    setNBtn(true);
  };

  const click_handler = (idx) => {
    let n_board = Object.assign([], board);
    if (n_board[idx] !== "e") {
      setContext("warning");
      setMsg("That's a Filled Square, Try a Free square.");
      return;
    }
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
    setChoice(idx);
    if (isJoin) {
      setTurn(false);
    }
  };

  const request_action = (action, req_id) => {
    workers.ttt.postMessage({
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
    workers.ttt.postMessage({
      command: "create_req",
      game_id: params.game_id,
    });
  };

  const show_requests = () => {
    workers.ttt.postMessage({
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
            <i className="bi bi-plus-send-plus-fill me-1"></i> Request Rematch
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
        onClick={() => workers.ttt.postMessage({ command: "list" })}
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
    setMsgShow(false);
    setTimeout(() => setMsgShow(true), 200);
  }, [msg]);

  useEffect(() => {
    if (is_finished && isJoin) {
      let r_time = setInterval(() => {
        let box = document.querySelector(".t_box");
        if (box === null) {
          clearInterval(r_time);
          return;
        }
        workers.ttt.postMessage({
          command: "list_reqs",
        });
      }, 4000);
    }
  }, [is_finished]);

  useEffect(() => {
    workers.ttt.addEventListener("message", (msg) => {
      msg = msg.data;
      switch (msg.command) {
        case "start":
          start_handler(
            msg.data,
            setScore,
            setContext,
            setMsg,
            setIsJoin,
            setBoard,
            setTurn,
            setFinished,
            setWaiting,
            (data) => workers.ttt.postMessage(data),
            setEngine,
            setWinPos
          );
          break;
        case "choice":
          choice_handler(
            msg.data,
            setContext,
            setMsg,
            setBoard,
            setTurn,
            setFinished,
            setScore,
            (data) => workers.ttt.postMessage(data),
            setWinPos
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
            setBoard,
            setTurn,
            setScore,
            setWinPos
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
            (msg) => workers.ttt.postMessage(msg),
            params.game_id
          );
          break;
        case "list_reqs":
          list_req_handler(msg.data, setReqList, notify);
          break;
      }
    });
    workers.ttt.postMessage({ url: ttt_add, command: "url" });

    setTimeout(
      () =>
        workers.ttt.postMessage({ command: "start", game_id: params.game_id }),
      500
    );
  }, []);

  useEffect(() => {
    if (choice === "" || choice === false) {
      return;
    }
    workers.ttt.postMessage({
      command: "choice",
      game_id: params.game_id,
      choice: choice,
    });
    setChoice(false);
  }, [choice]);

  useEffect(() => {
    if (!nBtn) {
      return;
    }
    let option = "";
    if (isJoin) {
      option = "friend";
    } else if (isEngine) {
      option = "computer";
    } else {
      option = "oneplayer";
    }
    workers.ttt.postMessage({ command: "restart", option: option });
  }, [nBtn]);

  useEffect(() => {
    let turn_time = setInterval(() => {
      let box = document.querySelector(".t_box");
      if (box === null && !turn) {
        workers.ttt.postMessage({ command: "stop_turn" });
        clearInterval(turn_time);
      }
    }, 5000);
  }, [turn]);

  return (
    <Container
      fluid="md"
      className="mt-3 pt-2 d-md-flex d-sm-block flex-row justify-content-between w-100"
    >
      <div className="d-none d-md-flex flex-column w-50 me-4">
        <div className="my-3 shadow  text-center">
          <p className="fw-bold text-uppercase">
            <i
              className={
                score[1] < score[0]
                  ? "text-success bi bi-award-fill  me-1 "
                  : score[1] === score[0]
                  ? "text-warning bi bi-award-fill  me-1 "
                  : "text-danger bi bi-award-fill  me-1 "
              }
            ></i>{" "}
            Player 1 : {score[0]}
          </p>
          <hr className="text-muted" />
          <p className=" fw-bold text-uppercase ">
            <i
              className={
                score[0] < score[1]
                  ? "text-success bi bi-award-fill  me-1 "
                  : score[1] === score[0]
                  ? "text-warning bi bi-award-fill  me-1 "
                  : "text-danger bi bi-award-fill  me-1 "
              }
            ></i>{" "}
            Player 2 : {score[1]}
          </p>
        </div>
        {controls_box}
      </div>

      <div className="d-flex d-md-none mb-2  p-auto text-center  justify-content-between">
        <div className="my-2 px-3 py-2 shadow d-flex flex-row justify-content-center mx-auto d-md-none text-center">
          <p className="fw-bold me-3 my-auto text-uppercase">
            <i
              className={
                score[1] < score[0]
                  ? "text-success bi bi-award-fill  me-1 "
                  : score[1] === score[0]
                  ? "text-warning bi bi-award-fill  me-1 "
                  : "text-danger bi bi-award-fill  me-1 "
              }
            ></i>{" "}
            Player 1 : {score[0]}
          </p>
          <p className=" fw-bold ms-3 my-auto text-uppercase ">
            <i
              className={
                score[0] < score[1]
                  ? "text-success bi bi-award-fill  me-1 "
                  : score[1] === score[0]
                  ? "text-warning bi bi-award-fill  me-1 "
                  : "text-danger bi bi-award-fill  me-1 "
              }
            ></i>{" "}
            Player 2 : {score[1]}
          </p>
        </div>
      </div>

      <div className="d-flex  flex-column mb-3 w-100 mx-auto ms-md-4 justify-content-center">
        <Container
          className={
            "text-center p-2 shadow rounded bg-opacity-10 bg-" + context
          }
        >
          <Collapse in={msgShow} timeout={1000}>
            <p className="h6  m-2 fst-italic">
              <i className={"bi me-2 bi-info-circle-fill text-" + context}></i>
              {msg}
            </p>
          </Collapse>
        </Container>
        <Container
          id="t_board"
          className="mt-3 px-auto mx-auto shadow w-100 h-100"
        >
          {get_board(click_handler, board, winPos)}
        </Container>
      </div>
      <Modal
        show={i_show}
        size="md"
        onHide={() => setIShow(false)}
        centered={true}
      >
        <Modal.Header>
          <Modal.Title>How to Play.</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="p-3 fs-6">
            This is a 3-by-3 grid game, Players alternate placing Xs and Os on
            the board until either player has three in a row, horizontally,
            vertically, or diagonally or until all squares on the grid are
            filled.
            <em className="bg-info bg-opacity-10 p-2 fw-bold ">
              If a player is able to draw three Xs or three Os in a row, then
              that player wins. If all squares are filled and neither player has
              made a complete row of Xs or Os, then the game is a draw.
            </em>
            . You can place X's or O's on the board by clicking on the desired
            squares.
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
              className="p-3 d-flex tw_box flex-column fs-6"
              onClick={() =>
                copy_text(
                  window.location.origin + "/tictactoe/" + params.game_id,
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
                {window.location.origin + "/tictactoe/" + params.game_id}
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
          type="Tic-Tac-Toe"
        />
      ) : (
        ""
      )}
      <OverlayTrigger
        trigger={["click", "focus"]}
        delay={200}
        placement="top"
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

const get_board = (click_handler, board, winp) => {
  winp = winp ? winp : [];
  let cnt = 0;
  let res = [];

  for (let i = 0; i < 3; i++) {
    let arr = [];
    for (let j = 0; j < 3; j++) {
      arr.push([board[cnt], cnt]);
      cnt++;
    }
    res.push(arr);
  }

  return (
    <>
      {res.map((arr, idx) => (
        <Row key={idx}>
          {arr.map((val, ids) => (
            <Col
              onClick={() => click_handler(val[1])}
              className={
                "text-center m-auto w-100  t_box border    border-secondary d-flex justify-content-center" +
                (winp.includes(val[1]) ? " bg-opacity-25 bg-success" : "")
              }
              key={ids + "inner"}
            >
              <p className="my-auto fs-1 lh-lg fw-bold w-100 h-100">
                {" "}
                {val[0] === 1 ? "X" : val[0] === 2 ? "O" : ""}
              </p>
            </Col>
          ))}
        </Row>
      ))}
    </>
  );
};
export { TGame };
