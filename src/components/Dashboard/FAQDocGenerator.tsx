import { useState } from "react";

export default function FAQDocGenerator({ businessId, supabase }: any) {

  const [file, setFile] = useState<File | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateFAQs = async () => {

    if (!file) {
      alert("Please select a file first.");
      return;
    }

    try {

      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/generate-faq", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("FAQ generation failed");
      }

      const data = await res.json();

      setFaqs(data.faqs || []);

    } catch (err) {

      console.error(err);
      alert("Failed to generate FAQs");

    } finally {

      setLoading(false);

    }

  };

  const approveFAQ = async (faq: any) => {

    try {

      await supabase
        .from("business_faq")
        .insert({
          business_id: businessId,
          question: faq.question,
          answer: faq.answer,
          keywords: faq.keywords
        });

      alert("FAQ added");

    } catch (err) {

      console.error(err);
      alert("Failed to insert FAQ");

    }

  };

  return (

    <div style={{ marginTop: "40px" }}>

      <h3>Generate FAQs From Document</h3>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={generateFAQs}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate FAQs"}
        </button>

      </div>

      {faqs.length > 0 && (

        <div style={{ marginTop: "20px" }}>

          {faqs.map((faq, i) => (

            <div
              key={i}
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "6px"
              }}
            >

              <p>
                <strong>{faq.question}</strong>
              </p>

              <p>{faq.answer}</p>

              <p style={{ fontSize: "12px", color: "#666" }}>
                Keywords: {faq.keywords?.join(", ")}
              </p>

              <button
                onClick={() => approveFAQ(faq)}
              >
                Approve
              </button>

            </div>

          ))}

        </div>

      )}

    </div>

  );

}