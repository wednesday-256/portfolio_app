import { Popover, OverlayTrigger, Nav, ListGroup } from "react-bootstrap";

const HeaderPopover = (props) => {
  const popover = (
    <Popover id="header-popover" className="shadow">
      <Popover.Body className="bg-dark">
        <ListGroup as="ul" variant="flush">
          {props.actionables.map((val, idx) => (
            <ListGroup.Item
              onClick={val[1]}
              as="li"
              key={idx}
              className="my-2 rounded"
              action
              style={{ textAlign: "center" }}
            >
              <i
                style={{ fontSize: "1.1rem" }}
                className={"bi me-2 bi-" + val[2]}
              ></i>
              {val[0]}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Popover.Body>
    </Popover>
  );
  return (
    <OverlayTrigger
      trigger={["click", "focus"]}
      placement="bottom"
      overlay={popover}
      delay={170}
    >
      <Nav.Link href="#">
        <div className="d-none d-sm-inline-block">
          <i className="bi bi-person me-1"></i>
        </div>{" "}
        {props.header_text}
      </Nav.Link>
    </OverlayTrigger>
  );
};
export { HeaderPopover };
