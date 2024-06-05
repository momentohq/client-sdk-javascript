import {useEffect} from "react";
import {cacheName} from "../utils/momento-web";

type CacheModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const CacheModal = (props: CacheModalProps) => {
  useEffect(() => {
    if (props.isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [props.isVisible]);

  return (
    <>
      {props.isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
            <h2 className="text-2xl font-bold mb-4">Cache Not Found</h2>
            <p className="mb-4">
              The cache <span className="font-semibold">{cacheName}</span> does not exist. Please create a new cache
              using the <a className="text-blue-500" href="https://console.gomomento.com" target="_blank"
                           rel="noopener noreferrer">Momento Console</a>.
            </p>
            <button
              onClick={props.onClose}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CacheModal;
