import { Container, Row, Col } from "react-bootstrap";
import { ClBox } from "./sm_color";
import { TtBox } from "./sm_ttt";
import { ChBox } from "./sm_chk";

const MdHome = (props) => {
  return (
    <Container fluid="md">
      <Row>
        <Col className="m-3 p-2 shadow rounded">
          <p className="h5 my-3 text-center">The Color Game.</p>
          <ClBox notify={props.notify} start_game={props.start_game.color} />
        </Col>

        <Col className="m-3 p-2 shadow rounded">
          <p className="h5 my-3 text-center">Tic-Tac-Toe.</p>
          <TtBox notify={props.notify} start_game={props.start_game.ttt} />
        </Col>

        <Col className="m-3 p-2 shadow rounded">
          <p className="h5 my-3 text-center">Checkers.</p>
          <ChBox notify={props.notify} start_game={props.start_game.chk} />
        </Col>
      </Row>
    </Container>
  );
};

export { MdHome };
