import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import { useState, useEffect } from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import { HeaderPopover } from "./components/header_popover";
import { LoginModal } from "./components/modals/login";
import { SignupModal } from "./components/modals/signup";
import { RecoverModal } from "./components/modals/recover";
import { ProfileModal } from "./components/modals/profile";
import { UpdateModal } from "./components/modals/update";
import { GameList } from "./components/modals/game_list";
import { Notify } from "./components/notify";

import {
  Outlet,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import favicon from "./favicon-32x32.png";
import work_builder from "./workers/worker_builder";
import ProfileWorker from "./workers/profile_worker.js";
import Colorworker from "./workers/color_worker";
import TictactoeWorker from "./workers/ttt_worker";
import CheckersWorker from "./workers/chk_worker";

import {
  register_handler,
  recover_handler,
  delete_handler,
  update_handler,
  login_handler,
  logout_handler,
  check_handler,
} from "./message_handlers/profile_handler";

import {
  clr_create_handler,
  join_handler as clr_join_handler,
  list_handler as clr_list_handler,
} from "./message_handlers/color_handler";
import {
  ttt_create_handler,
  join_handler as ttt_join_handler,
  list_handler as ttt_list_handler,
} from "./message_handlers/ttt_handler";
import {
  chk_create_handler,
  join_handler as chk_join_handler,
  list_handler as chk_list_handler,
} from "./message_handlers/chk_handler";

const p_worker = new Worker(work_builder(ProfileWorker));
const clr_worker = new Worker(work_builder(Colorworker));
const ttt_worker = new Worker(work_builder(TictactoeWorker));
const chk_worker = new Worker(work_builder(CheckersWorker));

function App() {
  const [user_name, setUserName] = useState("Anon");
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [lShow, setlShow] = useState(false);
  const [sShow, setsShow] = useState(false);
  const [rShow, setrShow] = useState(false);
  const [pShow, setpShow] = useState(false);
  const [uShow, setuShow] = useState(false);
  const [msg, setMsg] = useState(false);
  const [mShow, setmShow] = useState(false);
  const [glShow, setGlShow] = useState(false);
  const [g_type, setG_type] = useState(false);
  const [g_data, setG_data] = useState([]);
  const [profileState, setProfileState] = useState("");
  const [url, setUrl] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  //profile interactions
  const recover_user = (key, pass) => {
    p_worker.postMessage({
      command: "recover",
      key: key,
      password: pass,
    });
  };

  const register_user = (usr, pwd) => {
    p_worker.postMessage({
      command: "auth",
      user_name: usr,
      password: pwd,
    });
  };

  const delete_user = () => {
    p_worker.postMessage({
      command: "delete_user",
    });
  };

  const update_user = (usr, pwd) => {
    p_worker.postMessage({
      command: "update",
      user_name: usr,
      password: pwd,
    });
  };

  const login_user = (u_name, pass) => {
    p_worker.postMessage({
      command: "login",
      user_name: u_name,
      password: pass,
    });
  };

  const logout_user = () => {
    p_worker.postMessage({ command: "logout" });
  };

  //color game interactions

  useEffect(() => {
    p_worker.addEventListener("message", (msg) => {
      msg = msg.data;
      switch (msg.command) {
        case "auth":
          register_handler(
            msg.data,
            setMsg,
            setUserName,
            setProfileState,
            setLoggedIn,
            setsShow
          );
          break;
        case "delete_user":
          delete_handler(msg.data, setMsg, setLoggedIn, setpShow);
          break;
        case "update":
          update_handler(
            msg.data,
            setMsg,
            setUserName,
            setProfileState,
            setuShow
          );
          break;
        case "recover":
          recover_handler(
            msg.data,
            setMsg,
            setUserName,
            setProfileState,
            setLoggedIn,
            setrShow
          );
          break;
        case "login":
          login_handler(
            msg.data,
            setMsg,
            setUserName,
            setProfileState,
            setLoggedIn,
            setlShow
          );
          break;
        case "logout":
          logout_handler(msg.data, setMsg, setLoggedIn);
          break;
        case "check":
          check_handler(
            msg.data,
            (msg) => {
              if (location.pathname !== "/home" && msg.check) {
                return;
              }
              setMsg(msg);
            },
            setUserName,
            setProfileState,
            setLoggedIn
          );
          break;
      }
    });

    clr_worker.addEventListener("message", (msg) => {
      msg = msg.data;
      switch (msg.command) {
        case "create":
          clr_create_handler(msg.data, setUrl);
          break;
        case "join":
          clr_join_handler(msg.data);
          break;
        case "list":
          clr_list_handler(msg.data, setGlShow, setG_type, setG_data);
      }
    });

    document.body.classList.add("bg-dark", "bg-opacity-10");

    ttt_worker.addEventListener("message", (msg) => {
      msg = msg.data;
      switch (msg.command) {
        case "create":
          ttt_create_handler(msg.data, setUrl);
          break;
        case "join":
          ttt_join_handler(msg.data);
          break;
        case "list":
          ttt_list_handler(msg.data, setGlShow, setG_type, setG_data);
      }
    });

    chk_worker.addEventListener("message", (msg) => {
      msg = msg.data;
      switch (msg.command) {
        case "create":
          chk_create_handler(msg.data, setUrl);
          break;
        case "join":
          chk_join_handler(msg.data);
          break;
        case "list":
          chk_list_handler(msg.data, setGlShow, setG_type, setG_data);
      }
    });

    const error_handler = (msg) => {
      msg = msg.data;
      let data = msg.data;

      if (data.state === "error") {
        let res = [];
        data.errors.forEach((msg) => {
          res.push(msg.msg);
        });
        let msg = { type: "error", header: "Game Error.", body: res };
        return setMsg(msg);
      }
    };

    clr_worker.addEventListener("message", error_handler);
    ttt_worker.addEventListener("message", error_handler);
    chk_worker.addEventListener("message", error_handler);

    let p_add = window.location.origin + "/profile/api";
    p_worker.postMessage({ url: p_add, command: "url" });

    let cl_add = window.location.origin + "/color/api";
    clr_worker.postMessage({ url: cl_add, command: "url" });

    let ttt_add = window.location.origin + "/tictactoe/api";
    ttt_worker.postMessage({ url: ttt_add, command: "url" });

    let chk_add = window.location.origin + "/checkers/api";
    chk_worker.postMessage({ url: chk_add, command: "url" });
  }, []);

  useEffect(() => {
    if (msg === false) {
      return;
    }
    setmShow(true);
  }, [msg]);

  useEffect(() => {
    if (url) {
      navigate(url);
    }
  }, [url]);

  const actionables = [];
  isLoggedIn
    ? [
        ["Profile", () => setpShow(true), "person-lines-fill"],
        ["Logout", logout_user, "box-arrow-left"],
      ].map((val) => actionables.push(val))
    : [
        ["Signup", () => setsShow(true), "person-plus-fill"],
        ["Login", () => setlShow(true), "person-check-fill"],
        ["Recover", () => setrShow(true), "arrow-clockwise"],
      ].map((val) => actionables.push(val));

  return (
    <Container fluid="md" className="pt-5 vh-100">
      <Navbar
        expand="lg"
        bg="black"
        variant="dark"
        fixed="top"
        className="shadow "
      >
        <Container fluid="md">
          <Link to="/home" className="text-decoration-none">
            <Navbar.Brand>
              <div className="d-none d-sm-inline-block">
                <img
                  src={favicon}
                  width="30"
                  height="30"
                  className=" bg-light bg-opacity-75 rounded-circle d-inline-block me-2 align-top"
                  alt="Snow Globe logo"
                />
              </div>
              Snow Globe
            </Navbar.Brand>
          </Link>

          <Nav className="justify-content-end d-flex d-md-none">
            <HeaderPopover
              actionables={actionables}
              login_click={login_user}
              header_text={isLoggedIn ? user_name : "Login/Signup"}
            />
          </Nav>
          {isLoggedIn ? (
            <Nav className="justify-content-end d-none d-md-flex flex-row">
              <Nav.Link onClick={() => setpShow(true)} className="me-3">
                <i className="bi bi-person me-1"></i> {user_name}
              </Nav.Link>
              <Nav.Link onClick={logout_user}>
                <i className="bi bi-box-arrow-left me-1"></i> Logout
              </Nav.Link>
            </Nav>
          ) : (
            <Nav className="justify-content-end d-none d-md-flex flex-row">
              {actionables.map((val, idx) => (
                <Nav.Link onClick={val[1]} key={idx} className="mx-3">
                  <i className={"bi me-1 bi-" + val[2]}></i> {val[0]}
                </Nav.Link>
              ))}
            </Nav>
          )}
        </Container>
      </Navbar>
      {location.pathname === "/" ? <Navigate to="/home" replace={true} /> : ""}
      <Outlet
        context={[
          (msg) => {
            setMsg(msg);
          },
          { color: clr_worker, ttt: ttt_worker, chk: chk_worker },
          {
            color: (data) => clr_worker.postMessage(data),
            ttt: (data) => ttt_worker.postMessage(data),
            chk: (data) => chk_worker.postMessage(data),
          },
        ]}
      />
      <LoginModal
        onHide={() => setlShow(false)}
        loginAction={login_user}
        show={lShow}
        size="sm"
      />
      {isLoggedIn ? (
        <>
          <ProfileModal
            onHide={() => setpShow(false)}
            show={pShow}
            profile={profileState}
            show_update={() => setuShow(true)}
            delete_user={() => delete_user()}
          />
          <UpdateModal
            onHide={() => setuShow(false)}
            show={uShow}
            user_name={user_name}
            size="sm"
            update_user={update_user}
          />
        </>
      ) : (
        ""
      )}
      <GameList
        onHide={() => setGlShow(false)}
        show={glShow}
        type={g_type}
        games={g_data}
      />
      <SignupModal
        onHide={() => setsShow(false)}
        show={sShow}
        size="sm"
        register_user={register_user}
      />
      <RecoverModal
        onHide={() => setrShow(false)}
        show={rShow}
        size="sm"
        recover_user={recover_user}
      />
      <div>
        <Notify onClose={() => setmShow(false)} show={mShow} msg={msg} />
      </div>
    </Container>
  );
}

export default App;
