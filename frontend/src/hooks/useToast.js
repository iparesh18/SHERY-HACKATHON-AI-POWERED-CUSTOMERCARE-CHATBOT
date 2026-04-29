import { useContext } from "react";
import { ToastContext } from "../context/ToastContext.jsx";

const useToast = () => useContext(ToastContext);

export { useToast };
