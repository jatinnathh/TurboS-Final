"use client";

import { useState, useRef, useCallback } from "react";

async function resizeImage(file: File): Promise<File> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 800;

                if (width > height) {
                    if (width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: "image/jpeg" }));
                    } else {
                        resolve(file);
                    }
                }, "image/jpeg", 0.85);
            };
        };
    });
}

export default function CancerClassifier() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setLoading(true);
        try {
            const resized = await resizeImage(file);
            setImage(resized);
            setPreview(URL.createObjectURL(resized));
            setPrediction(null);
            setError(null);
        } catch (err) {
            console.error("Compression error:", err);
            setImage(file);
            setPreview(URL.createObjectURL(file));
        } finally {
            setLoading(false);
        }
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const classifyCancer = async () => {
        if (!image) return;
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("image", image);

            const res = await fetch("/api/doctor/classify", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();
            console.log("Raw API response:", JSON.stringify(result, null, 2));

            if (!res.ok || result.error) {
                throw new Error(result.error || "Classification failed.");
            }

            // Try to extract predictions from various response shapes
            let predictions: any = null;

            if (result.data) {
                predictions = Array.isArray(result.data) ? result.data[0] : result.data;
            } else if (result.label || result.confidences) {
                predictions = result;
            }

            console.log("Parsed predictions:", JSON.stringify(predictions, null, 2));

            if (!predictions || typeof predictions !== "object") {
                // If response is a string, show it directly
                if (typeof predictions === "string") {
                    setPrediction(predictions);
                } else {
                    throw new Error("Unexpected response format. Check console for raw response.");
                }
            } else if (predictions.confidences && Array.isArray(predictions.confidences)) {
                const best = predictions.confidences[0];
                setPrediction(
                    `${best.label} — ${(best.confidence * 100).toFixed(1)}% confidence`
                );
            } else if (predictions.label) {
                setPrediction(predictions.label);
            } else {
                const entries = Object.entries(predictions);
                if (entries.length > 0) {
                    const best = entries.sort((a: any, b: any) => b[1] - a[1])[0];
                    setPrediction(
                        `${best[0]} — ${((best[1] as number) * 100).toFixed(1)}% confidence`
                    );
                } else {
                    setPrediction(JSON.stringify(predictions));
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Classification failed. Please try again.");
        }

        setLoading(false);
    };

    const reset = () => {
        setImage(null);
        setPreview(null);
        setPrediction(null);
        setError(null);
    };

    return (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="text-lg">🔬</span>
                <h3 className="text-sm font-bold tracking-tight text-slate-200">
                    Skin Cancer Classifier
                </h3>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-rose-400/70 bg-rose-400/10 px-2 py-0.5 rounded-full ring-1 ring-rose-400/20">
                    AI Tool
                </span>
            </div>

            {/* Drop zone / Preview */}
            {!preview ? (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                        dragging
                            ? "border-rose-400/60 bg-rose-500/10"
                            : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragging ? "bg-rose-500/20" : "bg-white/[0.05]"}`}>
                        <svg className={`w-6 h-6 ${dragging ? "text-rose-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">
                            {dragging ? "Drop image here" : "Drag & drop a skin image"}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                            or click to browse · JPG, PNG accepted
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Image preview */}
                    <div className="relative group">
                        <img
                            src={preview}
                            alt="Uploaded skin image"
                            className="w-full max-h-64 object-contain rounded-xl border border-white/[0.08]"
                        />
                        <button
                            onClick={reset}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
                            title="Remove image"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Classify button */}
                    <button
                        onClick={classifyCancer}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_18px_-4px_rgba(244,63,94,0.4)] hover:shadow-[0_0_22px_-4px_rgba(244,63,94,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing…
                            </>
                        ) : (
                            "🧠 Classify Image"
                        )}
                    </button>
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
            />

            {/* Result */}
            {prediction && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">✅</span>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">
                            Prediction
                        </p>
                        <p className="text-sm font-bold text-emerald-300">
                            {prediction}
                        </p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400 mb-1">
                            Error
                        </p>
                        <p className="text-sm text-rose-300">{error}</p>
                    </div>
                </div>
            )}

            {/* Backup link */}
            <div className="pt-3 border-t border-white/[0.06] text-center">
                <a
                    href="https://jatincancer.streamlit.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                    🔗 Open Backup Classifier (Streamlit)
                </a>
            </div>
        </div>
    );
}