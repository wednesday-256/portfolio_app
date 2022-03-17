import { Modal, Form, InputGroup, Button } from "react-bootstrap";
import { useState } from "react";

const RecoverModal = (props) => {
  const [pValue, setPvalue] = useState("password");
  const [check, setCheck] = useState(false);

  const text_handler = () => {
    let rec_key = document.getElementById("rec_key").value;
    let pass = document.getElementById("new_pass").value;
    let pass2 = document.getElementById("new_pass2").value;
    let pass_check;
    pass_check = pass === pass2 && pass !== "" ? true : false;
    if (rec_key !== "" && pass_check) {
      setCheck(true);
    } else {
      setCheck(false);
    }
  };

  const recover_user = () => {
    let key = document.getElementById("rec_key").value;
    let pass = document.getElementById("new_pass").value;
    props.recover_user(key, pass);
  };

  const togglePassword = () => {
    setPvalue(pValue === "password" ? "text" : "password");
  };

  return (
    <Modal onHide={props.onHide} show={props.show} centered>
      <Modal.Header>
        <Modal.Title>
          <i className="bi me-2 bi-arrow-clockwise"></i> Recover{" "}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <InputGroup className="mb-4">
          <InputGroup.Text>
            <i className="bi bi-key-fill"></i>
          </InputGroup.Text>

          <Form.Control
            type="text"
            placeholder="Enter Recovery Key."
            id="rec_key"
            onChange={text_handler}
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            id="new_pass"
            type={pValue}
            placeholder="Enter New Password."
            onChange={text_handler}
            isValid={check}
            isInvalid={!check}
          />
          <Button onClick={togglePassword} variant="outline-dark">
            <i
              className={
                pValue === "password" ? "bi   bi-eye-slash" : "bi   bi-eye"
              }
            ></i>
          </Button>
          <Form.Control.Feedback type="invalid">
            Passwords do not match / Enter valid key.
          </Form.Control.Feedback>
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            id="new_pass2"
            type={pValue}
            placeholder="Confirm New Password."
            onChange={text_handler}
            isValid={check}
            isInvalid={!check}
            onKeyPress={(e) =>
              e.key === "Enter" && check ? recover_user() : null
            }
          />
          <Button onClick={togglePassword} variant="outline-dark">
            <i
              className={
                pValue === "password" ? "bi   bi-eye-slash" : "bi   bi-eye"
              }
            ></i>
          </Button>
          <Form.Control.Feedback type="invalid">
            Passwords do not match / Enter valid key.
          </Form.Control.Feedback>
        </InputGroup>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-around">
        <Button variant="outline-secondary" onClick={props.onHide}>
          <i className="me-2 bi bi-x-lg"></i> Close
        </Button>
        <Button variant="dark" onClick={recover_user} disabled={!check}>
          <i className="bi me-2 bi-shield-fill-check"></i> Recover
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { RecoverModal };
