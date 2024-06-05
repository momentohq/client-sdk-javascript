import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {ToastContainer} from "react-toastify";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <App/>
    <ToastContainer/>
  </>
);
