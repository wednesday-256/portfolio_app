import { Modal, ListGroup, Button } from "react-bootstrap";

const RequestList = (props) => {
  return (
    <Modal
      show={props.show}
      scrollable={true}
      fullscreen="sm-down"
      onHide={props.onHide}
      centered
      size="lg"
    >
      <Modal.Header>
        <Modal.Title className="flex-row d-flex align-items-center">
          <i className="bi me-2 text-secondary bi-list-ul"></i>
          <h3 className="text-capitalize  text-secondary text-center my-auto">
            {props.type} Requests.
          </h3>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          <h4> Received </h4>
          <ListGroup.Item className="d-flex flex-row justify-content-between fw-bold ">
            <p>From</p>
            <p>Actions</p>
          </ListGroup.Item>
          {props.games.received.map((obj, idx) => (
            <ListGroup.Item
              key={"r" + idx}
              className="flex-row d-flex justify-content-between"
            >
              <p>{obj.from}</p>
              <div className="d-flex flex-row justify-content-between">
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="bg-gradient me-3"
                  onClick={() => props.request_action("deny", obj.req_id)}
                >
                  <i className="bi bi-x-lg me-2"> Deny</i>{" "}
                </Button>

                <Button
                  variant="outline-success"
                  size="sm"
                  className="bg-gradient"
                  onClick={() => props.request_action("accept", obj.req_id)}
                >
                  <i className="bi bi-check-lg me-2"> Accept</i>{" "}
                </Button>
              </div>
            </ListGroup.Item>
          ))}
          <h4 className="mt-4"> Sent </h4>
          <ListGroup.Item className="d-flex flex-row justify-content-between fw-bold ">
            <p>To</p>
            <p>Actions</p>
          </ListGroup.Item>
          {props.games.sent.map((obj, idx) => (
            <ListGroup.Item
              key={"s" + idx}
              className="flex-row d-flex justify-content-between"
            >
              <p>{obj.to}</p>
              <Button
                variant="outline-warning"
                size="sm"
                className="bg-gradient"
                onClick={() => props.request_action("delete", obj.req_id)}
              >
                <i className="bi bi-trash-fill me-2"> Delete</i>{" "}
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide} variant="outline-dark ms-auto">
          <i className="me-1 bi bi-x-lg"></i> Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { RequestList };
