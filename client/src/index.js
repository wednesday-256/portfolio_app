import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./routes/home";
import { ColorGame } from "./routes/color_game";
import { TGame } from "./routes/ttt_game.js";
import { ChGame } from "./routes/chk_game.js";
import { Container } from "react-bootstrap";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="home" element={<Home />} />
          <Route path="color/:game_id" element={<ColorGame />} />
          <Route path="tictactoe/:game_id" element={<TGame />} />
          <Route path="checkers/:game_id" element={<ChGame />} />
          <Route
            path="*"
            element={
              <Container>
                <h2 className="text-center  mb-2 mt-4 rounded py-3 text-uppercase">
                  Oops!! could not find that page.{" "}
                </h2>
                <div
                  style={{
                    width: "100%",
                    paddingBottom: "56%",
                    position: "relative",
                  }}
                  className="d-flex p-2 rounded shadow justify-content-center"
                >
                  <img
                    src="https://i.giphy.com/media/UoeaPqYrimha6rdTFV/giphy.webp"
                    width="100%"
                    alt="404 image"
                    height="100%"
                  />
                </div>
              </Container>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
