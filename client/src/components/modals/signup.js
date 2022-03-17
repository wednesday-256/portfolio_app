import { Modal, Form, InputGroup, Button } from "react-bootstrap";
import { useState, useEffect } from "react";

const SignupModal = (props) => {
  const [pValue, setPvalue] = useState("password");
  const [pValid, setPvalid] = useState(true);
  const [check, setCheck] = useState(false);

  useEffect(() => {
    let user_n = document.getElementById("s_user_name");
    if (user_n == null) {
      return setCheck(false);
    }
    user_n = user_n.value;
    if (user_n !== "" && pValid) {
      setCheck(true);
    } else {
      setCheck(false);
    }
  }, [pValid]);

  const check_pass = () => {
    let pass1 = document.getElementById("s_pass1").value;
    let pass2 = document.getElementById("s_pass2").value;
    let user_n = document.getElementById("s_user_name").value;

    pass1 === pass2 && pass1 !== "" && pass1.length > 7
      ? setPvalid(true)
      : setPvalid(false);
    if (user_n !== "" && pValid) {
      setCheck(true);
    } else {
      setCheck(false);
    }
  };

  const signup_user = () => {
    let pass = document.getElementById("s_pass2").value;
    let user_n = document.getElementById("s_user_name").value;
    props.register_user(user_n, pass);
  };

  const togglePassword = () => {
    setPvalue(pValue === "password" ? "text" : "password");
  };

  return (
    <Modal onHide={props.onHide} show={props.show} centered>
      <Modal.Header>
        <Modal.Title>
          <i className="bi me-2 bi-person-plus-fill"></i>SignUp{" "}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-person-fill"></i>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Enter Username."
            id="s_user_name"
            onChange={check_pass}
          />
        </InputGroup>
        <InputGroup className="mb-3" hasValidation>
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            id="s_pass1"
            type={pValue}
            isValid={pValid}
            isInvalid={!pValid}
            placeholder="Enter Password."
            onChange={check_pass}
          />
          <Button onClick={togglePassword} variant="outline-dark">
            <i
              className={
                pValue !== "password" ? "bi   bi-eye-slash" : "bi   bi-eye"
              }
            ></i>
          </Button>
        </InputGroup>
        <InputGroup className="mb-3" hasValidation>
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            id="s_pass2"
            type={pValue}
            isValid={pValid}
            isInvalid={!pValid}
            placeholder="Confirm Password."
            onChange={check_pass}
            onKeyPress={(e) =>
              e.key === "Enter" && check ? signup_user() : null
            }
          />
          <Button onClick={togglePassword} variant="outline-dark">
            <i
              className={
                pValue !== "password" ? "bi   bi-eye-slash" : "bi   bi-eye"
              }
            ></i>
          </Button>
          <Form.Control.Feedback type="invalid">
            <ul>
              <li>Check that Passwords match.</li>
              <li>Must be 8 characters Long.</li>
            </ul>
          </Form.Control.Feedback>
        </InputGroup>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-around">
        <Button variant="outline-secondary" onClick={props.onHide}>
          <i className="me-2 bi bi-x-lg"></i> Close
        </Button>
        <Button variant="dark" onClick={signup_user} disabled={!check}>
          <i className="bi me-2 bi-person-check"></i> Signup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { SignupModal };
