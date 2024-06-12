import { toast } from "react-toastify";

const defaultToastOptions = {
  hideProgressBar: true,
  position: "top-center",
  autoClose: 2000,
} as const;

const toastSuccess = (message: string) => {
  toast(message, {
    ...defaultToastOptions,
    type: "success",
  });
};

const toastError = (message: string) => {
  toast(message, {
    ...defaultToastOptions,
    type: "error",
  });
};

const toastInfo = (message: string) => {
  toast(message, {
    ...defaultToastOptions,
    type: "info",
  });
};

export { toastSuccess, toastError, toastInfo };
