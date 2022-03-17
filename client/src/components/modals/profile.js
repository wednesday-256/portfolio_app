import {
  Modal,
  Form,
  InputGroup,
  Button,
  Row,
  Overlay,
  Tooltip,
} from "react-bootstrap";
import { useState, useRef } from "react";

const ProfileModal = (props) => {
  const [rVal, setrVal] = useState(false);
  const [tShow, settShow] = useState(false);
  const target = useRef(null);

  const update_profile = () => {
    props.onHide();
    props.show_update();
  };

  const handle_click = () => {
    let key = document.querySelector("#pro_key").placeholder;

    const copy_mode = (key) => {
      key = document.querySelector("#pro_key").placeholder;
      navigator.clipboard.writeText(key);
      settShow(true);
      setrVal(false);
    };

    if (key === "") {
      setrVal(true);
    }

    setTimeout(copy_mode, 100);
  };
  return (
    <Modal show={props.show} onHide={props.onHide} centered>
      <Modal.Header>
        <Modal.Title>
          {" "}
          <i className="bi me-2 bi-person-lines-fill"></i>
          {props.profile.user_name + "'s Profile."}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row justify-content-start ">
          <i className="bi bi-person-fill me-2"></i>
          <p className="fw-bold me-2">Username:</p>{" "}
          <p>{props.profile.user_name}</p>
        </div>
        <div className="d-flex flex-row justify-content-start">
          <i className="bi bi-calendar-plus text-success me-2"></i>
          <p className="fw-bold me-2">Date Added:</p>{" "}
          <p>{props.profile.date_added.toLocaleString().split("T")[0]}</p>
        </div>
        {props.profile.user_name === "anon" ? (
          <>
            <div className="d-flex flex-row justify-content-start ">
              <i className="bi bi-calendar-minus text-warning me-2"></i>
              <p className="fw-bold me-2">Delete Date:</p>{" "}
              <p>
                {
                  new Date(Date.parse(props.profile.date_added) + 31557600000)
                    .toLocaleString()
                    .split("T")[0]
                }
              </p>
            </div>
            <Row className="mx-1 text-center mb-4 bg-warning bg-opacity-10 p-2">
              <small className="fs-6 text-muted fst-italic">
                <i className="bi bi-info-circle-fill text-warning"></i>{" "}
                <b>Note: </b>Anonymous accounts will be deleted after a year of
                opening, to keep your account update it.
              </small>
            </Row>
          </>
        ) : (
          ""
        )}
        <InputGroup>
          <InputGroup.Text>
            <i className="bi bi-shield-fill-check"></i>
          </InputGroup.Text>
          <InputGroup.Text>Recovery Key:</InputGroup.Text>
          <Form.Control
            id="pro_key"
            placeholder={!rVal ? "" : props.profile.rec_key}
            aria-label="recovery key"
            title="click to copy"
            readOnly
            ref={target}
            onClick={handle_click}
            size="sm"
          />
          <Overlay
            target={target.current}
            show={tShow}
            palcement="top"
            rootClose={true}
            rootCloseEvent="click"
            onHide={() => settShow(false)}
          >
            {(props) => (
              <Tooltip id="copied overlay" {...props}>
                <i className="bi bi-info-circle-fill text-success me-2"></i>
                Copied!
              </Tooltip>
            )}
          </Overlay>
          <Button onClick={() => setrVal(!rVal)} variant="outline-secondary">
            <i className={rVal ? "bi   bi-eye" : "bi   bi-eye-slash"}></i>
          </Button>
        </InputGroup>
        <Row className="mt-3 mx-1 bg-info bg-opacity-10 p-2 text-center ">
          <small className="fs-6 text-muted  fst-italic">
            <i className="bi bi-info-circle-fill text-info"></i> <b>Note:</b>{" "}
            Recovery key can be used to change your password please copy to a
            safe place
          </small>
        </Row>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-around">
        <Button variant="outline-secondary" onClick={props.onHide}>
          <i className="me-1 bi bi-x-lg"></i> Close
        </Button>
        <Button variant="outline-danger" onClick={props.delete_user}>
          <i className="bi me-1 bi-person-x"></i> Delete Profile
        </Button>
        <Button variant="dark" onClick={update_profile}>
          <i className="bi me-1 bi-person-plus"></i> Update Profile
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { ProfileModal };
