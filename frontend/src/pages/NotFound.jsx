import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted">The page you are looking for does not exist.</p>
        <Link to="/app" className="mt-6 inline-flex">
          <Button>Back to app</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
