
import { useRef, useEffect } from 'react'
import rough from 'roughjs'

interface CanvasRendererProps {
    code: string
    size?: number
}

export function CanvasRenderer({ code, size = 512 }: CanvasRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 1. Clear Canvas
        ctx.clearRect(0, 0, size, size)

        // 2. White Background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)

        // 3. Initialize Rough.js
        // 3. Initialize Rough.js
        const roughCanvas = rough.canvas(canvas)

        try {
            // 4. Execute Code
            // The generated code assumes 'roughCanvas' exists.
            // We pass it via new Function argument.
            const drawFunction = new Function('roughCanvas', code)
            drawFunction(roughCanvas)

        } catch (e) {
            console.error('Failed to execute roughjs code:', e)

            // Error visual
            ctx.fillStyle = '#fee2e2'
            ctx.fillRect(0, 0, size, size)
            ctx.fillStyle = '#ef4444'
            ctx.font = '20px sans-serif'
            ctx.fillText('描画エラー', 20, 50)
        }
    }, [code, size])

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="w-full h-full object-contain bg-white shadow-inner"
        />
    )
}
