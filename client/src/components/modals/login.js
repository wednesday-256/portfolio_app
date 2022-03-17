import { Modal, Form, InputGroup, Button } from "react-bootstrap";
import { useState } from "react";

const LoginModal = (props) => {
  const [p_value, setPvalue] = useState("password");
  const [check, setCheck] = useState(false);

  const text_handler = () => {
    let user = document.getElementById("user_name").value;
    let pass = document.getElementById("password").value;
    if (user === "" || pass === "") {
      setCheck(false);
    } else {
      setCheck(true);
    }
  };

  const authenticate_user = () => {
    let pass = document.getElementById("password").value;
    let u_name = document.getElementById("user_name").value;
    props.loginAction(u_name, pass);
  };

  const togglePassword = () => {
    setPvalue(p_value === "password" ? "text" : "password");
  };

  return (
    <Modal show={props.show} onHide={props.onHide} centered>
      <Modal.Header>
        <Modal.Title>
          <i className="bi me-2 bi-shield-lock-fill"></i> Login{" "}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <InputGroup className="mb-4">
          <InputGroup.Text>
            <i className="bi bi-person-fill"></i>
          </InputGroup.Text>

          <Form.Control
            type="text"
            placeholder="Enter Username."
            id="user_name"
            onChange={text_handler}
            isValid={check}
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-key-fill"></i>
          </InputGroup.Text>
          <Form.Control
            id="password"
            type={p_value}
            placeholder="Enter Password."
            onChange={text_handler}
            isValid={check}
            onKeyPress={(e) =>
              e.key === "Enter" && check ? authenticate_user() : null
            }
          />
          <Button onClick={togglePassword} variant="outline-dark">
            <i
              className={
                p_value !== "password" ? "bi   bi-eye-slash" : "bi   bi-eye"
              }
            ></i>
          </Button>
        </InputGroup>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-around">
        <Button variant="outline-secondary" onClick={props.onHide}>
          <i className="me-2 bi bi-x-lg"></i>Close
        </Button>
        <Button variant="dark" onClick={authenticate_user} disabled={!check}>
          <i className="bi me-2 bi-shield-fill-check"></i>Login
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// const SignUpModal = (props) => {
//
//   return ()
// }
//
// const RecoverModal = (props) =>{
//
//   return ()
// }

export { LoginModal };
