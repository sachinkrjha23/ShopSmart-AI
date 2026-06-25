export async function getAIRecommendation(userPrompt, products) {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is not configured");
    return { success: false, products: [], error: "API key missing" };
  }

  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const limitedProducts = products.slice(0, 50).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description?.substring(0, 200) || "",
    category: p.category,
    price: p.price,
    ratings: p.ratings,
    stock: p.stock,
    images: p.images,
  }));

  try {
    const geminiPrompt = `
You are a STRICT product filter. Your ONLY job is to filter products based on the user's request.

USER REQUEST: "${userPrompt}"

AVAILABLE PRODUCTS:
${JSON.stringify(limitedProducts, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILTERING RULES - FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. UNDERSTAND the user's request:
   - Read the user's request carefully
   - Identify the PRODUCT TYPE they're asking for (e.g., "tv", "phone", "bat", "laptop", "camera", "fridge", etc.)
   - Identify any BUDGET constraints (e.g., "under 10000", "under 1 lakh", etc.)
   - Identify any EXCLUSIONS (e.g., "not wood", "no Samsung", etc.)

2. For EACH product in the list:
   - Compare the product's name, description, and category with the user's request
   - Ask yourself: "Is this product the SAME TYPE as what the user wants?"
   - If the user asks for "tv", check if the product is actually a TV (not a phone, not a laptop)
   - If the user asks for "phone", check if it's a phone (not a tablet, not a laptop)
   - If the user asks for "bat", check if it's a cricket bat (not a phone, not a camera)

3. ONLY include products that MATCH the user's request type
4. If NO products match, return EMPTY array []

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE SCENARIOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scenario 1: User asks for "tv"
- Available: "S24 Ultra" (phone), "season bat" (cricket bat)
- Result: [] (no TV in list)

Scenario 2: User asks for "camera"
- Available: "S24 Ultra" (phone with camera), "season bat" (cricket bat)
- Result: ["S24 Ultra"] (it has a camera)

Scenario 3: User asks for "bat"
- Available: "S24 Ultra" (phone), "season bat" (cricket bat)
- Result: ["season bat"] (it's a bat)

Scenario 4: User asks for "beyblade"
- Available: "S24 Ultra" (phone), "season bat" (cricket bat)
- Result: [] (no beyblade in list)

Scenario 5: User asks for "phone"
- Available: "S24 Ultra" (phone), "season bat" (cricket bat)
- Result: ["S24 Ultra"] (it's a phone)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY PRINCIPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Match the PRODUCT TYPE, not just keywords
2. A phone is NOT a TV, even if both are electronics
3. A phone is NOT a camera, even if it has a camera
4. A bat is NOT a phone, even if both are products
5. Only return products that match the EXACT type requested
6. If in doubt, EXCLUDE the product

RESPONSE FORMAT:
[]  ← If NO products match
OR
[{"id":"...","name":"...", ...}]  ← Only matching products
`;

    console.log(
      `📤 Sending request to Gemini with ${limitedProducts.length} products...`,
    );

    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API error (${response.status}):`, errorText);
      return {
        success: false,
        products: [],
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const aiResponseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!aiResponseText) {
      console.error("❌ AI response is empty");
      return {
        success: false,
        products: [],
        error: "AI response is empty or invalid.",
      };
    }

    console.log(
      "📝 AI raw response:",
      aiResponseText.substring(0, 300) + "...",
    );

    let cleanedText = aiResponseText.replace(/```json|```/g, "").trim();

    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    let parsedProducts;
    try {
      parsedProducts = JSON.parse(cleanedText);

      if (!Array.isArray(parsedProducts)) {
        parsedProducts = [parsedProducts];
      }

      parsedProducts = parsedProducts.filter((p) => p && p.id && p.name);

      console.log(`✅ AI matched ${parsedProducts.length} products`);
      return { success: true, products: parsedProducts };
    } catch (error) {
      console.error("❌ Failed to parse AI response:", error.message);
      console.error("Cleaned text:", cleanedText);
      return {
        success: false,
        products: [],
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    console.error("❌ AI request failed:", error.message);
    return { success: false, products: [], error: "Internal server error." };
  }
}
