import { NextRequest, NextResponse } from "next/server";

const HF_BASE = "https://jatinnath-skin-cancer-classifier.hf.space";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Step 1: Upload file to Gradio's upload endpoint
    const uploadForm = new FormData();
    uploadForm.append("files", file, file.name);

    const uploadRes = await fetch(`${HF_BASE}/gradio_api/upload`, {
      method: "POST",
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Upload error:", uploadRes.status, errText);
      return NextResponse.json(
        { error: `Upload failed (${uploadRes.status}). Space may be sleeping.` },
        { status: 502 }
      );
    }

    const uploadedFiles = await uploadRes.json();
    const filePath = uploadedFiles[0];
    console.log("Uploaded file path:", filePath);

    // Step 2: Call predict with the uploaded file reference
    const callRes = await fetch(`${HF_BASE}/gradio_api/call/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{ path: filePath, orig_name: file.name, mime_type: file.type }],
      }),
    });

    if (!callRes.ok) {
      const errText = await callRes.text();
      console.error("Predict call error:", callRes.status, errText);
      return NextResponse.json(
        { error: `Predict failed (${callRes.status}).` },
        { status: 502 }
      );
    }

    const { event_id } = await callRes.json();
    console.log("Event ID:", event_id);

    // Step 3: GET result via SSE stream
    const resultRes = await fetch(
      `${HF_BASE}/gradio_api/call/predict/${event_id}`
    );
    const sseText = await resultRes.text();
    console.log("SSE response:", sseText);

    const dataLines = sseText
      .split("\n")
      .filter((line) => line.startsWith("data:"));
    const lastDataLine = dataLines[dataLines.length - 1];

    if (!lastDataLine) {
      return NextResponse.json(
        { error: "No result received from classifier." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(lastDataLine.replace(/^data:\s*/, ""));

    return NextResponse.json({
      data: Array.isArray(parsed) ? parsed : [parsed],
    });
  } catch (err: any) {
    console.error("classify-skin error:", err.message);
    return NextResponse.json(
      { error: err.message || "Classification failed." },
      { status: 500 }
    );
  }
}
