
import { useRef, useEffect } from 'react'

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

        // Reset canvas
        ctx.clearRect(0, 0, size, size)

        // Solid white background for "paper" feel
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)

        try {
            // Execute the generated code
            // The code is expected to use 'ctx' variable
            const drawFunction = new Function('ctx', code)
            drawFunction(ctx)
        } catch (e) {
            console.error('Failed to execute canvas code:', e)
            // Error visual
            ctx.fillStyle = '#fee2e2'
            ctx.fillRect(0, 0, size, size)
            ctx.fillStyle = '#ef4444'
            ctx.font = '20px sans-serif'
            ctx.fillText('描画エラーが発生しました', 20, 50)
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
