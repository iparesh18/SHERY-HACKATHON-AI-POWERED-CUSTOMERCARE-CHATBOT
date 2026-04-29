import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";

const Login = () => {
  const { login } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      pushToast("Welcome back", "success");
      navigate("/app", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold">Log in</h2>
      <p className="mt-2 text-sm text-muted">Access your workspace to manage support.</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New here? <Link className="text-ember" to="/register">Create an account</Link>
      </p>
    </div>
  );
};

export default Login;
