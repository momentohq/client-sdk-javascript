import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {ToastContainer} from "react-toastify";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <App/>
    <ToastContainer/>
  </>
);
