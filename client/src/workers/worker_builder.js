export default (worker) => {
  let code = worker.toString();
  code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
  const blob = new Blob([code], { type: "application/javascript" });
  return URL.createObjectURL(blob);
};
