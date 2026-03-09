import formidable from "formidable";
import fs from "fs";
import mammoth from "mammoth";
import Groq from "groq-sdk";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const config = {
  api: {
    bodyParser: false
  }
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function extractText(filePath, type) {

  if (type.includes("pdf")) {
    const data = await pdf(fs.readFileSync(filePath));
    return data.text;
  }

  if (type.includes("word")) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  return fs.readFileSync(filePath, "utf8");
}

function chunkText(text, size = 6000) {

  const chunks = [];

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }

  return chunks;
}

function extractJSON(str) {

  try {
    const start = str.indexOf("[");
    const end = str.lastIndexOf("]");

    if (start !== -1 && end !== -1) {
      return JSON.parse(str.slice(start, end + 1));
    }

    return [];
  } catch {
    return [];
  }
}

function removeDuplicates(faqs) {

  const seen = new Set();

  return faqs.filter(f => {

    const key = f.question?.toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);

    return true;

  });

}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {

    try {

      if (err) {
        return res.status(500).json({ error: "Upload failed" });
      }

      const file = files.file?.[0] || files.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const text = await extractText(file.filepath, file.mimetype);

      const chunks = chunkText(text);

      let allFaqs = [];

      for (const chunk of chunks) {

        const prompt = `
Generate Business FAQs from this document.

Return STRICT JSON:

[
{
"question":"",
"answer":"",
"keywords":[]
}
]
`;

        const completion = await groq.chat.completions.create({
          model: "llama3-70b-8192",
          temperature: 0.2,
          messages: [
            { role: "system", content: "You generate business FAQs." },
            { role: "user", content: prompt + chunk }
          ]
        });

        const output = completion.choices[0].message.content;

        const parsed = extractJSON(output);

        allFaqs = allFaqs.concat(parsed);
      }

      const cleaned = removeDuplicates(allFaqs);

      res.status(200).json({
        faqs: cleaned
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "FAQ generation failed"
      });

    }

  });

}