import { Toast, ToastContainer } from "react-bootstrap";

const Notify = (props) => {
  const dict = {
    success: "bi bi-check-circle-fill text-success me-2",
    info: "bi bi-info-circle-fill text-info me-2",
    warning: "bi bi-exclamation-triangle-fill text-warning me-2",
    error: "bi bi-exclamation-octagon-fill text-danger me-2",
  };
  return (
    <ToastContainer
      style={{ zIndex: 1060 }}
      className=" mt-5"
      position="top-end"
    >
      <Toast
        onClose={props.onClose}
        delay={6000}
        autohide
        style={{ position: "fixed", transform: " translateX(-105%)" }}
        show={props.show}
        className="rounded me-auto"
      >
        <Toast.Header>
          <i className={dict[props.msg.type]}></i>
          <strong className="me-auto">{props.msg.header}</strong>
        </Toast.Header>
        <Toast.Body>
          <>
            {props.msg.body instanceof Array ? (
              <ul>
                {props.msg.body.map((val, idx) => (
                  <li className="my-2" key={idx}>
                    {val}
                  </li>
                ))}
              </ul>
            ) : (
              <>{props.msg.body}</>
            )}
          </>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export { Notify };
