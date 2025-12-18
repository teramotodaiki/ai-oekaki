import { useRef, useEffect, useState } from 'react'
import rough from 'roughjs'
import { IncrementalRunner } from '../utils/IncrementalRunner'

interface CanvasRendererProps {
    code?: string
    size?: number
    streamPrompt?: string
    onComplete?: (code: string) => void
}

export function CanvasRenderer({ code, size = 512, streamPrompt, onComplete }: CanvasRendererProps) {
    console.log("CanvasRenderer Render. Props:", { codeLen: code?.length, size, streamPrompt, hasOnComplete: !!onComplete });

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const runnerRef = useRef<IncrementalRunner | null>(null);
    const [isStreaming, setIsStreaming] = useState(false)

    // Initial Setup
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        // We do NOT init runner here for streaming to avoid stale closure or instance sharing issues.
        // It will be inited in the effect that uses it.
        // But for static code, we might need it?
        // Let's keep it here for general init.
        const roughCanvas = rough.canvas(canvas);
        runnerRef.current = new IncrementalRunner(roughCanvas);

        // Initial clear
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, size, size)
        }
    }, [size]);


    // Handle static code
    useEffect(() => {
        // If we are streaming, ignore static code prop updates to avoid conflict
        if (streamPrompt) return;

        if (code && runnerRef.current) {
            console.log("Executing static code:", code.slice(0, 50) + "...");
            try {
                const canvas = canvasRef.current
                if (canvas) {
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.fillStyle = 'white'
                        ctx.fillRect(0, 0, size, size)
                    }
                }

                const roughCanvas = rough.canvas(canvas!)
                const drawFunction = new Function('roughCanvas', code)
                drawFunction(roughCanvas)
                console.log("Static code execution successful");
            } catch (e) {
                console.error("Static code error:", e)
                console.error("Failed code content:", code);
            }
        }
    }, [code, size, streamPrompt]) // Added streamPrompt to deps to re-eval if it changes

    // Handle Streaming
    useEffect(() => {
        if (!streamPrompt) return;

        const abortController = new AbortController();
        const signal = abortController.signal;

        const fetchData = async () => {
            console.log("Starting stream fetch for:", streamPrompt);
            setIsStreaming(true);

            // Reset runner and canvas for new stream specific to this effect run
            const canvas = canvasRef.current;
            if (canvas) {
                const roughCanvas = rough.canvas(canvas);
                runnerRef.current = new IncrementalRunner(roughCanvas);

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, size, size);
                }
            }

            try {
                const res = await fetch('/generate-canvas-stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: streamPrompt }),
                    signal
                });

                if (!res.body) return;

                const reader = res.body.getReader();
                const decoder = new TextDecoder();

                let done = false;
                let fullCode = '';

                console.log("Stream connected, starting read loop");

                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;

                    if (signal.aborted) {
                        console.log("Signal aborted during read");
                        break;
                    }

                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        console.log("Received chunk size:", chunk.length);
                        fullCode += chunk;

                        if (runnerRef.current) {
                            runnerRef.current.push(chunk);
                        }
                    }
                }

                if (!signal.aborted) {
                    console.log("Stream finished normally. fullCode len:", fullCode.length);
                    if (runnerRef.current) {
                        runnerRef.current.finish(() => {
                            // Clear before final run to ensure clean state
                            const canvas = canvasRef.current
                            if (canvas) {
                                const ctx = canvas.getContext('2d')
                                if (ctx) {
                                    ctx.fillStyle = 'white'
                                    ctx.fillRect(0, 0, size, size)
                                }
                            }
                        });
                    }
                    if (onComplete) {
                        console.log("Calling onComplete");
                        onComplete(fullCode);
                    }
                }

            } catch (e: any) {
                if (e.name === 'AbortError') {
                    console.log("Fetch aborted");
                } else {
                    console.error("Stream fetch error", e);
                }
            } finally {
                if (!signal.aborted) {
                    setIsStreaming(false);
                }
            }
        }

        fetchData();

        return () => {
            console.log("Cleanup: Aborting stream fetch");
            abortController.abort();
        };
    }, [streamPrompt]) // Intentionally exclude execution-only deps like 'size' to avoid re-fetching on resize if possible, but actually resize clears canvas so maybe we should? For now keep simple.

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="w-full h-full object-contain bg-white shadow-inner"
        />
    )
}
