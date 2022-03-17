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
  move_handler,
  turn_handler,
  restart_handler,
  request_handler,
  create_req_handler,
  list_req_handler,
} from "../message_handlers/chk_handler";
import { RequestList } from "../components/modals/requests";

const ChGame = () => {
  const [score, setScore] = useState([0, 0]);
  const [context, setContext] = useState("info");
  const [msg, setMsg] = useState("Welcome to Checkers.");
  const [msgShow, setMsgShow] = useState(false);
  const [isJoin, setIsJoin] = useState(false);
  const [i_show, setIShow] = useState(false);
  const [board, setBoard] = useState(false);
  const [is_finished, setFinished] = useState(false);
  const [is_waiting, setWaiting] = useState(false);
  const [tipShow, setTipShow] = useState([false, false]);
  const [nBtn, setNBtn] = useState(false);
  const [turn, setTurn] = useState(0);
  const [isEngine, setEngine] = useState(false);
  const [moves, setMoves] = useState([]);
  const [rotated, setRotated] = useState(false);
  const [aPiece, setAPiece] = useState(false);
  const [eArray, setEArray] = useState([]);
  const [replayMode, setReplayMode] = useState(false);
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

  const time_travel = (val) => {
    setEArray([]);
    if (moves.length === 0) {
      notify({
        type: "error",
        header: "Replay error",
        body: "No moves yet.",
      });
      return;
    }
    let p_cnt;

    if (replayMode) {
      p_cnt = replayMode[1];
    } else {
      p_cnt = moves.length;
    }

    val ? (p_cnt += 1) : (p_cnt -= 1);

    if (p_cnt < 0) {
      notify({
        type: "warning",
        header: "Replay error.",
        body: "At First move",
      });
      return;
    } else if (p_cnt >= moves.length) {
      notify({
        type: "info",
        header: "Replay.",
        body: "At Last move",
      });
      setReplayMode(false);
      return;
    }

    setReplayMode([true, p_cnt]);
  };

  let chk_add = window.location.origin + "/checkers/api";

  const new_handler = () => {
    setNBtn(true);
  };

  const rotate_board = (val) => {
    if (val) {
      setRotated(true);
      document.getElementById("chk_board").classList.add("rotate");
      document.getElementById("chk_board").classList.remove("unrotate");
      return;
    }

    if (rotated) {
      setRotated(false);
      document.getElementById("chk_board").classList.remove("rotate");
      document.getElementById("chk_board").classList.add("unrotate");
      return;
    }

    setRotated(true);
    document.getElementById("chk_board").classList.add("rotate");
    document.getElementById("chk_board").classList.remove("unrotate");
  };

  const next_click_handler = (piece) => {
    if (replayMode) {
      notify({
        type: "error",
        header: "Replay Error.",
        body: ["Invalid action.", "Switch to game mode to make moves."],
      });
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
      notify({ type: "warning", header: "Game Turn", body: "Not your Piece." });
      return;
    }
    piece = piece.split("").map(Number);
    let res = [];
    board.all_expected[piece].forEach((arr) => {
      res.push(arr);
    });
    setEArray(res);
    setAPiece(piece);
  };

  const move_click_handler = (pos) => {
    if (!aPiece) {
      notify({
        type: "warning",
        header: "Piece error",
        body: "Invalid Piece",
      });
      return;
    }
    pos = pos.split("").map(Number);
    workers.chk.postMessage({
      piece: aPiece.map(Number),
      command: "move",
      position: pos,
      game_id: params.game_id,
    });
    setEArray([]);
  };

  const request_action = (action, req_id) => {
    workers.chk.postMessage({
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
    workers.chk.postMessage({
      command: "create_req",
      game_id: params.game_id,
    });
  };

  const show_requests = () => {
    workers.chk.postMessage({
      command: "list_reqs",
    });
    setRShow(true);
  };

  const controls_box = (
    <div className="d-flex  py-3 flex-column  rounded shadow justify-content-around">
      <Button
        variant="dark"
        size="sm"
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
      <Button
        variant="dark"
        size="sm"
        className="bg-gradient w-75  mx-auto mb-2"
        onClick={() => rotate_board()}
      >
        <i className="bi bi-plus-arrow-clockwise me-1"></i> Rotate Board
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
        onClick={() => workers.chk.postMessage({ command: "list" })}
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
    workers.chk.addEventListener("message", (msg) => {
      msg = msg.data;
      if (msg.data.state === "error") {
        return;
      }
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
            (data) => workers.chk.postMessage(data),
            setEngine,
            setMoves,
            () => rotate_board()
          );
          break;
        case "move":
          move_handler(
            msg.data,
            setContext,
            setMsg,
            setBoard,
            setTurn,
            setFinished,
            setScore,
            (data) => workers.chk.postMessage(data),
            setMoves,
            setAPiece,
            setEArray
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
            setMoves
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
            (msg) => workers.chk.postMessage(msg),
            params.game_id
          );
          break;
        case "list_reqs":
          list_req_handler(msg.data, setReqList, notify);
          break;
      }
    });
    workers.chk.postMessage({ url: chk_add, command: "url" });

    setTimeout(
      () =>
        workers.chk.postMessage({ command: "start", game_id: params.game_id }),
      300
    );
  }, []);

  useEffect(() => {
    if (!["success", "danger"].includes(context)) {
      setMsgShow(true);
      return;
    }
    setMsgShow(false);
    setTimeout(() => setMsgShow(true), 200);
  }, [msg]);

  useEffect(() => {
    if (replayMode) {
      setContext("dark");
      setMsg("Replay Mode.");
    } else {
      setContext("info");
      setMsg("Game Mode.");
      setTimeout(() => {
        if (turn && document.querySelector("#chk_board") && !is_finished) {
          setMsg("Your move.");
        }
      }, 300);
    }
  }, [replayMode]);

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
    workers.chk.postMessage({ command: "restart", option: option });
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

  const get_board = (bd) => {
    let board = replayMode ? moves[replayMode[1]] : bd;
    if (!board) {
      return;
    }
    let res = [];

    for (let i = 0; i < 8; i++) {
      let arr = [];
      for (let j = 0; j < 8; j++) {
        let bg = "";
        if (i % 2 === 0) {
          if (j % 2 !== 0) {
            bg = "dark";
          } else {
            bg = "white";
          }
        } else {
          if (j % 2 === 0) {
            bg = "dark";
          } else {
            bg = "white";
          }
        }
        arr.push(["" + i + j, bg]);
      }
      res.push(arr);
    }

    const get_piece = (clr, chk) => {
      return (
        <div
          className={"c_piece  rounded-circle my-2 w-sm-50 w-md-100 bg-" + clr}
        >
          {chk ? (
            <i
              className={
                "bi bi-suit-spade-fill mt-3 text-" +
                (clr === "light" ? "success" : "warning")
              }
            ></i>
          ) : (
            ""
          )}
        </div>
      );
    };
    let piece_pos = {};
    board.black_pieces.concat(board.white_pieces).forEach((obj) => {
      piece_pos[[obj.row, obj.col]] = [
        obj.clr === 1 ? "light" : "secondary",
        obj.is_king,
      ];
    });
    let e_pos = {};
    eArray.forEach((arr) => {
      e_pos[arr] = <i className="bi bi-circle-fill my-auto text-success"></i>;
    });

    const square_fill = (pos) => {
      pos = pos.split("").map(Number);
      let res = "";
      res = piece_pos[pos]
        ? get_piece(piece_pos[pos][0], piece_pos[pos][1])
        : "";

      if (e_pos[pos]) {
        res = e_pos[pos];
      }
      return res;
    };

    const check_position = (pos, cont) => {
      pos = pos.split("").map(Number);
      let res = false;
      switch (cont) {
        case "expected":
          board.expected_pieces.forEach((arr) => {
            if (arr[0] === pos[0] && arr[1] === pos[1]) {
              res = true;
              return;
            }
          });
          return res;
        case "next":
          eArray.forEach((arr) => {
            if (arr[0] === pos[0] && arr[1] === pos[1]) {
              res = true;
              return;
            }
          });
          return res;
      }
    };

    return (
      <>
        {res.map((arr, idx) => (
          <Row key={idx}>
            {arr.map((val) => (
              <Col
                onClick={
                  check_position(val[0], "expected")
                    ? () => next_click_handler(val[0])
                    : check_position(val[0], "next")
                    ? () => move_click_handler(val[0])
                    : () => {}
                }
                className={
                  "text-center w-100 h-100 c_box border d-flex justify-content-center bg-" +
                  val[1]
                }
                key={val}
              >
                {square_fill(val[0])}
              </Col>
            ))}
          </Row>
        ))}
      </>
    );
  };

  return (
    <Container
      fluid="md"
      className="mt-3 pt-2 flex-row d-md-flex d-sm-block justify-content-between w-100"
    >
      <div className="d-none d-md-flex flex-column w-50 me-3">
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
        <div className="my-1 px-3 py-2 shadow d-flex flex-row justify-content-evenly mx-auto d-md-none text-center">
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

      <div className="d-flex  flex-column mb-3 w-100 mx-auto ms-md-1 justify-content-center">
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
          id="chk_board"
          className="mt-3 px-auto mx-auto shadow w-100 h-100"
        >
          {get_board(board)}
        </Container>
        <div className="d-flex flex-row justify-content-evenly mt-3 mb-2 w-100">
          <Button
            variant="white"
            className="rounded-pill shadow bg-gradient"
            onClick={() => time_travel(false)}
          >
            <i className="bi fs-5 bi-caret-left-fill"></i>
          </Button>
          {replayMode ? (
            <Button
              variant="dark"
              className="rounded-pill bg-gradient"
              onClick={() => setReplayMode(false)}
            >
              <i className="bi fs-5 bi-arrow-clockwise"></i> Game Mode
            </Button>
          ) : (
            ""
          )}
          <Button
            variant="white"
            className="rounded-pill shadow bg-gradient"
            onClick={() => time_travel(true)}
          >
            <i className="bi fs-5 bi-caret-right-fill"></i>
          </Button>
        </div>
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
            This is a standard 8x8 checkers board game. Scores are updated after
            every capture.
            <em className="bg-info bg-opacity-10 p-2 fw-bold ">
              You win by either trapping your opponents last piece or capturing
              all your opponents pieces. The game ends in a draw, when both
              players are left with one player each after 5 moves..
            </em>
            You can move players by clicking on them, which highlights their
            respective next points then you choose which moves to make.
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
                  window.location.origin + "/checkers/" + params.game_id,
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
                {window.location.origin + "/checkers/" + params.game_id}
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

export { ChGame };
