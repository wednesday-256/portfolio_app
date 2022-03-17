import { Modal, ListGroup, Button } from "react-bootstrap";

const GameList = (props) => {
  const handle_click = (game_id) => {
    window.location = `/${props.type}/${game_id}`;
    props.onHide();
  };
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
            {props.type} Game List.
          </h3>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          <ListGroup.Item className="d-flex flex-row justify-content-between fw-bold ">
            <p>Date</p>
            <p> Player1</p>
            <p>Player2</p>
            <p>Score</p>
            <p> Winner</p>
          </ListGroup.Item>
          {props.games.map((obj, idx) => (
            <ListGroup.Item
              key={idx}
              onClick={() => handle_click(obj.game_id)}
              action
              className="flex-row d-flex justify-content-between"
            >
              <p className="mx-auto">
                {obj.date_played
                  .toLocaleString()
                  .split(".")[0]
                  .replace("T", " ")
                  .slice(0, -3)}
              </p>
              <p className="mx-auto">{obj.player1}</p>
              <p className="mx-auto">{obj.player2 ? obj.player2 : "---"}</p>
              <p className="mx-auto">
                {obj.score !== undefined ? obj.score : "---"}
              </p>
              <p className="mx-auto">{obj.winner ? obj.winner : "---"}</p>
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

export { GameList };
