import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SHERIFF_SYSTEM_PROMPT, getMockChatResponse } from "@/lib/gemini";
import { Message } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lastMessage = messages[messages.length - 1];

  // Demo mode — no API key
  if (!process.env.GEMINI_API_KEY) {
    const mockResponse = getMockChatResponse(lastMessage.content);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(mockResponse));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SHERIFF_SYSTEM_PROMPT,
    });

    // Build chat history (all messages except the last one)
    const history = messages.slice(0, -1).map((msg: Message) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error from Gemini API";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
