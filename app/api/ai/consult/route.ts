import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json(
        { error: "Prompt missing" },
        { status: 400 }
      );
    }

    const client = new Groq({
      apiKey: process.env.PK!,
    });

    const result = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const text = result.choices[0].message.content;

    return Response.json({
      success: true,
      data: text,
    });

  } catch (error) {
    console.error("Groq error:", error);
    return Response.json(
      { error: "Groq failed" },
      { status: 500 }
    );
  }
}