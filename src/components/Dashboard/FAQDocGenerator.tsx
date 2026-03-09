import { useState } from "react";

export default function FAQDocGenerator({ businessId, supabase }) {

  const [file, setFile] = useState<File | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);

  const generateFAQs = async () => {

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/generate-faq", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    const parsed = JSON.parse(data.faqs);

    setFaqs(parsed);
  };

  const approveFAQ = async (faq) => {

    await supabase
      .from("business_faq")
      .insert({
        business_id: businessId,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords
      });

  };

  return (
    <div style={{ marginTop: "40px" }}>

      <h3>Generate FAQs From Document</h3>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={generateFAQs}>
        Generate FAQs
      </button>

      {faqs.map((faq, i) => (
        <div key={i} style={{ marginTop: "20px" }}>

          <b>{faq.question}</b>

          <p>{faq.answer}</p>

          <p><i>{faq.keywords?.join(", ")}</i></p>

          <button onClick={() => approveFAQ(faq)}>
            Approve
          </button>

        </div>
      ))}

    </div>
  );
}