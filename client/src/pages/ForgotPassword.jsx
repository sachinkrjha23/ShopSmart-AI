import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { forgotPassword } from "../api/authApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return toast.error("Please enter your email");

    try {
      setLoading(true);
      await forgotPassword({ email: trimmedEmail });
      setEmail(trimmedEmail);
      setSent(true);
      toast.success("Reset link sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 mb-6">
            We sent a password reset link to <strong>{email}</strong>
          </p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Forgot Password
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Enter your email and we'll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <p className="text-sm text-center text-gray-600">
            Remember your password?{" "}
            <Link to="/" className="text-indigo-600 hover:underline">
              Back to Home
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
