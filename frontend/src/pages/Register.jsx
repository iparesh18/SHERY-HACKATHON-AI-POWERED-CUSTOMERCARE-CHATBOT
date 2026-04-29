import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";

const Register = () => {
  const { register } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    inviteCode: "",
    password: "",
    role: "customer"
  });
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      pushToast("Account created", "success");
      navigate("/app", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold">Create account</h2>
      <p className="mt-2 text-sm text-muted">Pick a role for demo access.</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <Input label="Name" name="name" value={form.name} onChange={onChange} required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
        <Input
          label="Organization"
          name="organization"
          value={form.organization}
          onChange={onChange}
          placeholder="Acme Support"
        />
        <Input
          label="Invite Code (optional)"
          name="inviteCode"
          value={form.inviteCode}
          onChange={onChange}
          placeholder="Paste invite code"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          required
        />
        <Select
          label="Role"
          name="role"
          value={form.role}
          onChange={onChange}
          options={[
            { value: "customer", label: "Customer" },
            { value: "agent", label: "Agent" },
            { value: "admin", label: "Admin" }
          ]}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account? <Link className="text-ember" to="/login">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
