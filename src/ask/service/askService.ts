import genAI from "../../common/genAIGenerator.js";

const ask = async (
  model = "gemini-2.5-flash",
  storeName: string,
  question: string
) => {
  const request = {
    contents: [
      {
        role: "user",
        parts: [{ text: question }],
      },
    ],
  };

  const result = await genAI.models.generateContent({
    model: model,
    contents: request.contents as any,
    config: {
      temperature: 0.2,
      tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }] as any,
    },
  });

  return result;
};

export { ask };
