import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/slices/authSlice";
import { closeLoginModal, openRegisterModal } from "../../store/slices/uiSlice";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import GoogleLoginButton from "./GoogleLoginButton";
import { toast } from "react-hot-toast";

const LoginModal = () => {
  const dispatch = useDispatch();
  const { isLoginModalOpen } = useSelector((state) => state.ui);
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error("Please fill in all fields");
    }
    try {
      await dispatch(login(formData)).unwrap();
      dispatch(closeLoginModal());
      toast.success("Logged in successfully!");
    } catch (err) {
      toast.error(err || "Login failed");
    }
  };

  const switchToRegister = () => {
    dispatch(closeLoginModal());
    dispatch(openRegisterModal());
  };

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={() => dispatch(closeLoginModal())}
      title="Welcome Back"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleLoginButton
          mode="login"
          onSuccess={() => dispatch(closeLoginModal())}
        />

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={switchToRegister}
            className="text-indigo-600 font-medium hover:underline"
          >
            Register
          </button>
        </p>
      </form>
    </Modal>
  );
};

export default LoginModal;
