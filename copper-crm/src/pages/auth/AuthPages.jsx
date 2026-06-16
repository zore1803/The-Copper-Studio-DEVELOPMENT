import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole,
  Mail, ShieldCheck, Sparkles, UserRound
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";

const roleOptions = [
  { value: "user", label: "User", description: "Client portal access" },
  { value: "superadmin", label: "SuperAdmin", description: "CRM control center" }
];

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-950 grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:flex flex-col justify-between border-r border-gray-200 bg-white px-10 py-9">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#2563EB] text-white grid place-items-center shadow-lg shadow-blue-200">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">DataCircles CRM</p>
            <p className="text-xs text-gray-400">The Copper Studio portal</p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <ShieldCheck size={14} />
            Authenticated access only
          </div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Professional CRM access after package purchase.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-gray-500">
            Clients receive a secure email link after payment, set their own password, and enter a dedicated portal. Admins manage leads, orders, projects, invoices, and reports from one protected workspace.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Payment verified", "Invite emailed", "Portal unlocked"].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="mt-3 text-xs font-semibold text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-8">
        <div className="w-full max-w-[440px] rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-7">
            <div className="mb-4 h-11 w-11 rounded-2xl bg-blue-50 text-[#2563EB] grid place-items-center">
              <LockKeyhole size={20} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function RolePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {roleOptions.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => onChange(role.value)}
          className={`rounded-2xl border p-3 text-left transition-all ${
            value === role.value
              ? "border-[#2563EB] bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
          }`}
        >
          <p className="text-sm font-bold">{role.label}</p>
          <p className="mt-1 text-[11px]">{role.description}</p>
        </button>
      ))}
    </div>
  );
}

function Field({ icon: Icon, type = "text", label, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const inputType = type === "password" && visible ? "text" : type;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
        <Icon size={16} className="text-gray-400" />
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-300"
        />
        {type === "password" && (
          <button type="button" onClick={() => setVisible((next) => !next)} className="text-gray-400 hover:text-gray-600">
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
    </label>
  );
}

function SubmitButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
      <ArrowRight size={16} />
    </button>
  );
}

function Message({ type, children }) {
  if (!children) return null;
  const styles = type === "error" ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700";
  return <div className={`rounded-2xl border px-3 py-2 text-xs font-medium ${styles}`}>{children}</div>;
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await auth.login({ email, password, role });
      const fallback = session.user.role === "superadmin" ? "/admin" : "/client";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Log in to CRM" subtitle="Choose your role and sign in to continue.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <RolePicker value={role} onChange={setRole} />
        <Field icon={Mail} label="Email address" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        <Field icon={KeyRound} type="password" label="Password" value={password} onChange={setPassword} placeholder="Enter password" autoComplete="current-password" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Secure JWT session</span>
          <Link to="/forgot-password" className="font-semibold text-[#2563EB] hover:text-blue-700">Forgot password?</Link>
        </div>
        <Message type="error">{error}</Message>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const auth = useAuth();
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await auth.forgotPassword({ email, role });
      setOtpSent(true);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await auth.resetPassword({ email, role, otp, password });
      navigate(session.user.role === "superadmin" ? "/admin" : "/client", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="Request an OTP on email, then create a new password.">
      <form onSubmit={otpSent ? resetPassword : sendOtp} className="space-y-4">
        <RolePicker value={role} onChange={setRole} />
        <Field icon={Mail} label="Email address" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        {otpSent && (
          <>
            <Field icon={UserRound} label="OTP" value={otp} onChange={setOtp} placeholder="6 digit code" autoComplete="one-time-code" />
            <Field icon={KeyRound} type="password" label="New password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" autoComplete="new-password" />
          </>
        )}
        <Message type="success">{message}</Message>
        <Message type="error">{error}</Message>
        <SubmitButton loading={loading}>{otpSent ? "Reset password" : "Send OTP"}</SubmitButton>
        <Link to="/login" className="block text-center text-xs font-semibold text-gray-500 hover:text-[#2563EB]">Back to login</Link>
      </form>
    </AuthShell>
  );
}

export function SetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await auth.setPassword({ token, password });
      auth.logout();
      setMessage("Password created successfully. Redirecting to login...");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Client access setup" subtitle="Use the secure private link from your payment confirmation email.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!token && <Message type="error">Access setup token is missing from the link.</Message>}
        <Field icon={KeyRound} type="password" label="New password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" autoComplete="new-password" />
        <Field icon={KeyRound} type="password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" autoComplete="new-password" />
        <Message type="success">{message}</Message>
        <Message type="error">{error}</Message>
        <SubmitButton loading={loading}>Activate portal</SubmitButton>
        <Link to="/login" className="block text-center text-xs font-semibold text-gray-500 hover:text-[#2563EB]">Back to login</Link>
      </form>
    </AuthShell>
  );
}
