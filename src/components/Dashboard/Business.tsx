import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function Business() {
  const { user } = useAuth();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    industry: "",
    description: "",
    support_email: "",
    support_phone: "",
    website_url: "",
  });

  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    keywords: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchBusiness();
  }, [user]);

  // Fetch business
  const fetchBusiness = async () => {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setBusiness(data);
      setForm({
        business_name: data.business_name || "",
        industry: data.industry || "",
        description: data.description || "",
        support_email: data.support_email || "",
        support_phone: data.support_phone || "",
        website_url: data.website_url || "",
      });

      fetchFaqs(data.id);
    }
  };

  // Fetch FAQs
  const fetchFaqs = async (businessId: string) => {
    const { data } = await supabase
      .from("business_faq")
      .select("*")
      .eq("business_id", businessId);

    setFaqs(data || []);
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFaqChange = (e: any) => {
    setFaqForm({ ...faqForm, [e.target.name]: e.target.value });
  };

  // Save business
  const saveBusiness = async () => {
    if (!user) return;
    setLoading(true);

    if (business) {
      await supabase
        .from("businesses")
        .update(form)
        .eq("id", business.id);
    } else {
      const { data } = await supabase
        .from("businesses")
        .insert({
        ...form,
        user_id: user.id,
        chatbot_key: crypto.randomUUID(),
        })
        .select()
        .single();

      setBusiness(data);
      fetchFaqs(data.id);
    }

    setLoading(false);
    alert("Business details saved.");
  };

  // Add FAQ
  const addFaq = async () => {
    if (!business) return;

    await supabase.from("business_faq").insert({
      business_id: business.id,
      question: faqForm.question,
      answer: faqForm.answer,
      keywords: faqForm.keywords.split(","),
    });

    setFaqForm({ question: "", answer: "", keywords: "" });
    fetchFaqs(business.id);
  };

  return (
    <div className="space-y-8">
      {/* Business Profile */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Business Profile
          </h1>
          <p className="text-gray-500 mt-1">
            Add or update your business details anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Business Name" name="business_name" value={form.business_name} onChange={handleChange} />
          <Input label="Industry" name="industry" value={form.industry} onChange={handleChange} />
          <Input label="Support Email" name="support_email" value={form.support_email} onChange={handleChange} />
          <Input label="Support Phone" name="support_phone" value={form.support_phone} onChange={handleChange} />

          <div className="md:col-span-2">
            <Input label="Website URL" name="website_url" value={form.website_url} onChange={handleChange} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Business Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Briefly describe your business..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={saveBusiness}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            {business ? "Update Business" : "Save Business"}
          </button>
        </div>
      </div>

      {/* FAQ Manager */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">FAQ Manager</h2>

        {!business && (
          <p className="text-gray-500">
            Save business profile first to add FAQs.
          </p>
        )}

        {business && (
          <>
            {faqs.length === 0 && (
              <p className="text-gray-500 mb-4">
                No FAQs added yet.
              </p>
            )}

            <div className="space-y-3 mb-6">
              {faqs.map((faq) => (
                <FaqItem
                  key={faq.id}
                  faq={faq}
                  refreshFaqs={() => fetchFaqs(business.id)}
                />
              ))}
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-medium">Add New FAQ</h3>

              <input
                name="question"
                placeholder="Question"
                value={faqForm.question}
                onChange={handleFaqChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />

              <textarea
                name="answer"
                placeholder="Answer"
                rows={3}
                value={faqForm.answer}
                onChange={handleFaqChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />

              <input
                name="keywords"
                placeholder="Keywords (comma separated)"
                value={faqForm.keywords}
                onChange={handleFaqChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />

              <button
                onClick={addFaq}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Add FAQ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Reusable Input ---------- */
function Input({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

/* ---------- FAQ Item ---------- */
function FaqItem({ faq, refreshFaqs }: any) {
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    question: faq.question,
    answer: faq.answer,
    keywords: faq.keywords?.join(",") || "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveUpdate = async () => {
    await supabase
      .from("business_faq")
      .update({
        question: form.question,
        answer: form.answer,
        keywords: form.keywords.split(","),
      })
      .eq("id", faq.id);

    setEditing(false);
    refreshFaqs();
  };

  const deleteFaq = async () => {
    if (!confirm("Delete this FAQ?")) return;

    await supabase
      .from("business_faq")
      .delete()
      .eq("id", faq.id);

    refreshFaqs();
  };

  if (editing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 space-y-2">
        <input name="question" value={form.question} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        <textarea name="answer" value={form.answer} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        <input name="keywords" value={form.keywords} onChange={handleChange} className="w-full border rounded px-3 py-2" />

        <div className="flex gap-2">
          <button onClick={saveUpdate} className="bg-blue-600 text-white px-4 py-1 rounded">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="border px-4 py-1 rounded">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="font-medium text-gray-800">{faq.question}</p>
      <p className="text-gray-600 mt-1">{faq.answer}</p>

      <div className="flex gap-3 mt-3">
        <button onClick={() => setEditing(true)} className="text-blue-600 text-sm">
          Edit
        </button>

        <button onClick={deleteFaq} className="text-red-600 text-sm">
          Delete
        </button>
      </div>
    </div>
  );
}
