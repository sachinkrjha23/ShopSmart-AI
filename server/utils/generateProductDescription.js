export async function generateProductDescription({ draft, productName, category }) {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is not configured");
    return { success: false, description: "", error: "API key missing" };
  }

  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  const prompt = `
    You are an e-commerce copywriter. Rewrite the seller's rough product notes below into a polished,
    professional product description suitable for an online marketplace listing.

    PRODUCT NAME: "${productName || "Unknown"}"
    CATEGORY: "${category || "Unknown"}"

    SELLER'S ROUGH NOTES:
    "${draft}"

    RULES:
    - Keep it factual — do NOT invent features, specifications, or claims that aren't implied by the seller's notes.
    - Write 2-4 short paragraphs, or a short paragraph plus a bullet list of key features — whichever fits the content better.
    - Tone: clear, confident, professional — avoid stacking hype words like "amazing" or "revolutionary".
    - Do not include the product name as a heading — just the description body.
    - Do not wrap the response in markdown code fences or quotes.
    - Respond with ONLY the description text, nothing else — no preamble, no explanation.
  `;

  console.log(`📤 Sending description-polish request to Gemini for "${productName}"...`);

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 500,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API error (${response.status}):`, errorText);
      return { success: false, description: "", error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      console.error("❌ AI response is empty");
      return { success: false, description: "", error: "AI response is empty or invalid." };
    }

    return { success: true, description: text.replace(/```/g, "").trim() };
  } catch (error) {
    console.error("❌ generateProductDescription failed:", error.message);
    return { success: false, description: "", error: error.message };
  }
}