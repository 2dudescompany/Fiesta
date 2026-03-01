// import { serve } from "https://deno.land/std/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
// };

// /* ---------- Utility Functions ---------- */

// function cleanText(text: string) {
//   return text
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .split(/\s+/)
//     .filter((w) => w.length > 2);
// }

// function textToVector(words: string[]) {
//   const freq: Record<string, number> = {};

//   for (const w of words) {
//     freq[w] = (freq[w] || 0) + 1;
//   }

//   return freq;
// }

// function cosineSimilarity(a: any, b: any) {
//   const words = new Set([...Object.keys(a), ...Object.keys(b)]);

//   let dot = 0;
//   let magA = 0;
//   let magB = 0;

//   for (const w of words) {
//     const va = a[w] || 0;
//     const vb = b[w] || 0;

//     dot += va * vb;
//     magA += va * va;
//     magB += vb * vb;
//   }

//   magA = Math.sqrt(magA);
//   magB = Math.sqrt(magB);

//   if (!magA || !magB) return 0;

//   return dot / (magA * magB);
// }

// /* ---------- Main Function ---------- */

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const { question, chatbot_key } = await req.json();

//     if (!chatbot_key || !question) {
//       return new Response(
//         JSON.stringify({ answer: null, error: "Missing data" }),
//         {
//           headers: {
//             ...corsHeaders,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     }

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL")!,
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
//     );

//     /* ---------- Step 1: Find business ---------- */

//     const { data: business } = await supabase
//       .from("businesses")
//       .select("id")
//       .eq("chatbot_key", chatbot_key)
//       .single();

//     if (!business) {
//       return new Response(JSON.stringify({ answer: null }), {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     /* ---------- Step 2: Load FAQs ---------- */

//     const { data: faqs } = await supabase
//       .from("business_faq")
//       .select("question, answer, keywords")
//       .eq("business_id", business.id);

//     if (!faqs || faqs.length === 0) {
//       return new Response(JSON.stringify({ answer: null }), {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     /* ---------- Step 3: Prepare user text ---------- */

//     const userWords = cleanText(question);
//     const userVec = textToVector(userWords);

//     /* ---------- Step 4: Keyword filter ---------- */

//     let candidates = faqs.filter((faq: any) => {
//       // Skip broken FAQ rows
//       if (!faq.question) return false;

//       if (!faq.keywords || faq.keywords.length === 0) return true;

//       const keys = faq.keywords.map((k: string) =>
//         k.toLowerCase().trim()
//       );

//       return userWords.some((w) => keys.includes(w));
//     });

//     /* ---------- Step 5: Cosine similarity ---------- */

//     let bestMatch: any = null;
//     let bestScore = 0;

//     for (const faq of candidates) {
//       const faqWords = cleanText(faq.question || "");
//       const faqVec = textToVector(faqWords);

//       const score = cosineSimilarity(userVec, faqVec);

//       console.log("User words:", userWords);
//       console.log("FAQ keywords:", faq.keywords);
//       console.log("Score:", score);

//       if (score > bestScore) {
//         bestScore = score;
//         bestMatch = faq;
//       }
//     }

//     /* ---------- FAQ ANALYTICS LOG ---------- */

//     if (bestMatch) {
//       await supabase.from("faq_analytics").insert({
//         chatbot_key,
//         question,
//         matched_question: bestMatch.question,
//         score: bestScore,
//         created_at: new Date().toISOString(),
//       });
//     }

//     /* ---------- Step 6: Threshold ---------- */

//     const threshold = 0.00;
//     const matched = bestScore > threshold;

//     await supabase.from("faq_logs").insert({
//       business_id: business.id,
//       question,
//       faq_question: bestMatch?.question || null,
//       answer: bestMatch?.answer || null,
//       similarity_score: bestScore,
//       matched,
//     });

//     return new Response(
//       JSON.stringify({
//         answer: matched ? bestMatch?.answer : null,
//         matched_question: bestMatch?.question || null,
//       }),
//       {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   } catch (err: any) {
//     return new Response(
//       JSON.stringify({ answer: null, error: err.message }),
//       {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   }
// });

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin || "")
    ? origin!
    : "",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ---------- Utility Functions ---------- */

function cleanText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function textToVector(words: string[]) {
  const freq: Record<string, number> = {};

  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return freq;
}

function cosineSimilarity(a: any, b: any) {
  const words = new Set([...Object.keys(a), ...Object.keys(b)]);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const w of words) {
    const va = a[w] || 0;
    const vb = b[w] || 0;

    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (!magA || !magB) return 0;

  return dot / (magA * magB);
}

/* ---------- Main Function ---------- */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, chatbot_key } = await req.json();

    if (!chatbot_key || !question) {
      return new Response(
        JSON.stringify({ answer: null, error: "Missing data" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* ---------- Step 1: Find business ---------- */

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("chatbot_key", chatbot_key)
      .single();

    if (!business) {
      return new Response(JSON.stringify({ answer: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* ---------- Step 2: Load FAQs ---------- */

    const { data: faqs } = await supabase
      .from("business_faq")
      .select("question, answer, keywords")
      .eq("business_id", business.id);

    if (!faqs || faqs.length === 0) {
      return new Response(JSON.stringify({ answer: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* ---------- Step 3: Prepare user text ---------- */

    const userWords = cleanText(question);
    const userVec = textToVector(userWords);

    /* ---------- Step 4: Candidate selection ---------- */
    // Keep all valid FAQs instead of strict keyword filtering
    const candidates = faqs.filter((faq: any) => faq.question);

    /* ---------- Step 5: Cosine similarity ---------- */

    let bestMatch: any = null;
    let bestScore = -1;

    for (const faq of candidates) {
      const faqWords = cleanText(faq.question || "");
      const faqVec = textToVector(faqWords);

      const score = cosineSimilarity(userVec, faqVec);

      console.log("User words:", userWords);
      console.log("FAQ question:", faq.question);
      console.log("Score:", score);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    /* ---------- FAQ ANALYTICS LOG ---------- */

    if (bestMatch) {
      await supabase.from("faq_analytics").insert({
        chatbot_key,
        question,
        matched_question: bestMatch.question,
        score: bestScore,
        created_at: new Date().toISOString(),
      });
    }

    /* ---------- Step 6: Matching ---------- */
    // Match if at least one FAQ exists
    const threshold = 0.25;  // safe starting value
    const matched = bestScore >= threshold;

    await supabase.from("faq_logs").insert({
      business_id: business.id,
      question,
      faq_question: bestMatch?.question || null,
      answer: bestMatch?.answer || null,
      similarity_score: bestScore,
      matched,
    });

    return new Response(
      JSON.stringify({
        answer: matched ? bestMatch?.answer : null,
        matched_question: bestMatch?.question || null,
        score: bestScore,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ answer: null, error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
