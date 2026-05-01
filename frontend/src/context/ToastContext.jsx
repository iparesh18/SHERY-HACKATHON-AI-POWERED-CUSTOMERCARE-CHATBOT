import { createContext, useCallback, useMemo, useRef, useState } from "react";
import ToastStack from "../components/Toast.jsx";

const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((message, tone = "info") => {
    toastIdRef.current += 1;
    const id = `${Date.now()}-${toastIdRef.current}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
};

export { ToastContext, ToastProvider };
