import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import constants from "@/lib/constants";
import { RecordingType } from "@/types/recording";

const genAI = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const extractSchema = z.object({
  amount: z.number(),
  category: z.enum([
    "food",
    "entertainment",
    "clothing",
    "transportation",
    "utilities",
    "healthcare",
    "education",
    "shopping",
    "other",
  ]),
  description: z.string(),
  transcription: z.string(),
  type: z.enum([RecordingType.INCOME, RecordingType.OUTCOME]),
});

const audioPrompt = `
      Listen carefully to these audios (in base64 format) and transcribe what is said.
      Then extract expense or income information from the transcription.
      Respond strictly in JSON following the given schema with vietnamese language.
      If you cannot understand or find any transaction, respond with:
      {"error": "Could not extract expense information from audio"}
      
      từ "ca" hoặc "k" nghĩa là nghìn đồng
    `;

export const transcribeAndExtract = async (payload: {
  id: string;
  audioDataBase64: string;
}): Promise<{
  id: string;
  data: {
    error?: string;
    amount?: number;
    category?: string;
    description?: string;
    transcription?: string;
    type?: RecordingType;
  };
}> => {
  const { id, audioDataBase64 } = payload;
  try {
    const response = await genAI.models.generateContent({
      model: constants.GEMINI_TRANSCRIBE_AND_EXTRACT_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: audioPrompt },
            { inlineData: { mimeType: "audio/wav", data: audioDataBase64 } },
          ],
        },
      ],
    });
    const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const data = jsonText
      ? JSON.parse(jsonText)
      : { error: "No data returned" };
    return { id, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { id, data: { error: errorMessage } };
  }
};

export const transcribeAndExtracts = async (
  payload: { id: string; audioDataBase64: string }[],
  categoryNames: string[]
): Promise<
  {
    id: string;
    data: {
      error?: string;
      amount?: number;
      category?: string;
      description?: string;
      transcription?: string;
      type?: RecordingType;
    };
  }[]
> => {
  const expenseSchema = z.object({
    id: z.string(),
    amount: z.number(),
    category: z.enum(categoryNames as [string, ...string[]]),
    description: z.string(),
    type: z.enum([RecordingType.INCOME, RecordingType.OUTCOME]),
    transcription: z.string(),
  });

  const parts = payload.flatMap((item) => [
    { text: `id: ${item.id})` },
    {
      inlineData: {
        mimeType: "audio/wav",
        data: item.audioDataBase64,
      },
    },
  ]);

  try {
    const response = await genAI.models.generateContent({
      model: constants.GEMINI_TRANSCRIBE_AND_EXTRACT_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: audioPrompt }, ...parts],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(z.array(expenseSchema)),
      },
    });

    const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const dataArray = jsonText ? JSON.parse(jsonText) : [];

    return payload.map((item, index) => ({
      id: item.id,
      data: dataArray[index] || { error: "No data returned" },
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return payload.map((item) => ({
      id: item.id,
      data: { error: errorMessage },
    }));
  }
};

const textPrompt = `
  Analyze the following Vietnamese text to extract expense or income information.
  Return the result strictly in JSON following the given schema. 
  If there is no valid transaction, respond with:
  {"error": "Could not extract expense information from text"}
  
  từ "ca" hoặc "k" nghĩa là nghìn đồng
`;

export const extractFromText = async (text: string) =>
  await genAI.models.generateContent({
    model: constants.GEMINI_EXTRACT_FROM_TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: `${textPrompt}\n\nText:\n${text}` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(extractSchema),
    },
  });

export const extractFromTexts = async (payload: {
  texts: string[];
  id: string;
}) => {
  const { texts, id } = payload;

  const parts = texts.map((text, index) => ({
    text: `Text ${index + 1}:\n${text}`,
  }));

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [{ text: textPrompt }, ...parts],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(z.array(extractSchema)),
      },
    });

    const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const dataArray = jsonText ? JSON.parse(jsonText) : [];

    return dataArray.map((data: unknown, index: number) => ({
      id,
      text: texts[index],
      data: data as {
        error?: string;
        amount?: number;
        category?: string;
        description?: string;
        transcription?: string;
        type?: RecordingType;
      },
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return texts.map((text) => ({
      id,
      text,
      data: { error: errorMessage },
    }));
  }
};
