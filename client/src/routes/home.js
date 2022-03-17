import { Container, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import { SmHome } from "../components/smhome";
import { MdHome } from "../components/mdhome";
import { useOutletContext } from "react-router-dom";

const Home = () => {
  const [val, setVal] = useState(0);
  const [res, setRes] = useState("");
  const [notify, workers, start_game] = useOutletContext();

  const words = [
    " - Learn - Grow - ",
    "Checkers.",
    "Checkers with Erik.",
    "Checkers with Friends.",
    "Tic-Tac-Toe.",
    "Tic-Tac-Toe with Erik.",
    "Tic-Tac-Toe with Friends.",
    "The Color Game.",
    "The Color Game With Friends.",
  ];

  let timeout = setTimeout(() => {
    let n_val = val + 1;
    if (n_val === words.length) {
      n_val = 0;
    }

    let check = document.getElementById("head_text");
    if (check === null) {
      clearTimeout(timeout);
      return;
    }
    setVal(n_val);
  }, 5000);

  const iterate_words = (val) => {
    let n_wrd = "_";
    setRes("_");
    words[val].split("").forEach((word, indx) => {
      let timeout = setTimeout(() => {
        let check = document.getElementById("head_text");
        if (check === null) {
          clearTimeout(timeout);
          return;
        }
        n_wrd = n_wrd.slice(0, -1) + word;
        n_wrd += "_";
        setRes(n_wrd);
      }, 1000 + indx * 100);
    });
  };
  useEffect(() => iterate_words(val), [val]);
  return (
    <Container className="mt-3 " fluid="md">
      <Container className="text-left head-container bg-white bg-opacity-10  text-secondary mx-auto rounded  p-3">
        <p className="h1 mx-auto   ">
          Play{" "}
          <em id="head_text" className="fw-italic  header_text text-dark">
            {res}
          </em>
        </p>
      </Container>
      <Container>
        <Col xs={12} md={6} className="rounded  w-100 px-4 ">
          <p className="fs-6 text-dark text-md-left">
            We offer{" "}
            <em className="bg-opacity-10 mx-1  px-2 rounded bg-info">
              Checkers
            </em>
            ,{" "}
            <em className="bg-opacity-10 mx-1  px-2 rounded bg-info">
              Tic-Tac-Toe
            </em>
            , and a guessing{" "}
            <em className="bg-opacity-10 mx-1  px-2 rounded bg-info">
              Color Game
            </em>{" "}
            as a free service.{" "}
          </p>

          <p className="fs-6 text-dark text-md-left">
            Users can play on their own, with{" "}
            <em className="bg-opacity-10 mx-1  px-2 rounded bg-warning">
              <i className="bi bi-robot me-2"></i> Erik
            </em>{" "}
            in the case of Tic-Tac-Toe and Checkers or with{" "}
            <em className="bg-opacity-10 mx-1 px-2 rounded bg-warning">
              <i className="bi bi-people-fill me-2"></i>Friends in person,
            </em>
            <em className="bg-opacity-10 mx-1  px-2 rounded bg-info">
              <i className="bi bi-globe me-2"></i>or around the world, over the
              internet.
            </em>
          </p>
        </Col>
      </Container>
      <div className="mb-5">
        <div className="d-lg-none d-flex  ">
          <SmHome start_game={start_game} notify={notify} />
        </div>
        <div className="d-lg-flex d-none  ">
          <MdHome start_game={start_game} notify={notify} />
        </div>
      </div>
      <hr />
    </Container>
  );
};

export { Home };
