import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { createBroadcast } from "../../store/slices/notificationSlice";

const EMPTY_FORM = {
  target_audience: "buyers_and_sellers",
  type: "announcement",
  title: "",
  message: "",
  expires_at: "",
};

const Broadcasts = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      toast.error("Expiry date/time must be in the future.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        target_audience: formData.target_audience,
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
        ...(formData.expires_at && {
          expires_at: new Date(formData.expires_at).toISOString(),
        }),
      };

      await dispatch(createBroadcast(payload)).unwrap();
      toast.success("Broadcast sent successfully.");
      setFormData(EMPTY_FORM);
    } catch (error) {
      toast.error(error || "Failed to create broadcast.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">
        Broadcast Notification
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Send a notification to all buyers/sellers, or everyone including admins.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Target Audience <span className="text-red-500">*</span>
          </label>
          <select
            name="target_audience"
            value={formData.target_audience}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 bg-white"
          >
            <option value="buyers_and_sellers">Buyers &amp; Sellers</option>
            <option value="all_including_admins">
              Everyone (incl. Admins)
            </option>
          </select>
        </div>

        <Input
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          placeholder="e.g. announcement, maintenance, promo"
          required
        />

        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Notification title"
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Notification message"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 bg-white resize-none"
          />
        </div>

        <Input
          label="Expires At (optional)"
          name="expires_at"
          type="datetime-local"
          value={formData.expires_at}
          onChange={handleChange}
          min={new Date().toISOString().slice(0, 16)}
        />

        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Broadcast"}
        </Button>
      </form>
    </div>
  );
};

export default Broadcasts;
