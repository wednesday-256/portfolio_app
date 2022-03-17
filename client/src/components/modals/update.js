import { Modal, Form, InputGroup, Button } from "react-bootstrap";
import { useState } from "react";

const UpdateModal = (props) => {
  const [pValue, setPvalue] = useState("password");
  const [pValid, setPvalid] = useState(true);

  const check_pass = () => {
    let pass1 = document.getElementById("u_pass1").value;
    let pass2 = document.getElementById("u_pass2").value;
    let user_n = document.getElementById("u_user_name").value;

    pass1 === pass2 &&
    (pass1 !== "" || user_n !== "") &&
    (pass1.length > 7 || pass1 === "")
      ? setPvalid(true)
      : setPvalid(false);
  };

  const update_profile = () => {
    let pass = document.getElementById("u_pass2").value;
    let user_n = document.getElementById("u_user_name").value;
    props.update_user(user_n, pass);
  };

  const togglePassword = () => {
    setPvalue(pValue === "password" ? "text" : "password");
  };

  return (
    <Modal show={props.show} onHide={props.onHide} centered>
      <Modal.Header>
        <Modal.Title>
          <i className="bi me-2 bi-person-plus-fill"></i>Update{" "}
          {props.user_name + "'s "} Profile{" "}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-person-fill"></i>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Change Username."
            id="u_user_name"
          />
        </InputGroup>
        <InputGroup className="mb-3" hasValidation>
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            id="u_pass1"
            type={pValue}
            isValid={pValid}
            isInvalid={!pValid}
            placeholder="Change Password."
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
            id="u_pass2"
            type={pValue}
            isValid={pValid}
            isInvalid={!pValid}
            placeholder="Confirm Password."
            onChange={check_pass}
            onKeyPress={(e) =>
              e.key === "Enter" && pValid ? update_profile() : null
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
          <i className="me-1 bi bi-x-lg"></i> Close
        </Button>
        <Button variant="dark" onClick={update_profile} disabled={!pValid}>
          <i className="bi me-2 bi-person-check-fill"></i> Update
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { UpdateModal };
