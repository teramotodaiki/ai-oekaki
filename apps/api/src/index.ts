import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { stream, streamText } from 'hono/streaming'
import type { Fetcher } from '@cloudflare/workers-types'
import { GeminiService } from './gemini'
import { ImagenService } from './imagen'

type Bindings = {
    GOOGLE_GENAI_API_KEY: string
    GOOGLE_GENAI_MODEL_NAME: string
    IMAGEN_MODEL_NAME: string
    VITE_DEV_SERVER_URL?: string
    ASSETS?: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.get('/*', async (c) => {
    if (c.env.VITE_DEV_SERVER_URL) {
        // Proxy to local Vite Dev Server
        const url = new URL(c.req.url)
        url.host = new URL(c.env.VITE_DEV_SERVER_URL).host
        url.protocol = new URL(c.env.VITE_DEV_SERVER_URL).protocol
        url.port = new URL(c.env.VITE_DEV_SERVER_URL).port

        const res = await fetch(url.toString(), c.req.raw as any)
        return res as any
    } else {
        // Serve static assets in production
        return c.env.ASSETS!.fetch(c.req.raw as any) as any
    }
})

app.post('/generate', async (c) => {
    const { prompt: userVoiceInput } = await c.req.json()

    if (!userVoiceInput) {
        return c.json({ error: 'No input provided' }, 400)
    }

    try {
        const gemini = new GeminiService(c.env.GOOGLE_GENAI_API_KEY, c.env.GOOGLE_GENAI_MODEL_NAME)
        const imagen = new ImagenService(c.env.GOOGLE_GENAI_API_KEY, c.env.IMAGEN_MODEL_NAME) // Assuming same key works for both in AI Studio

        // 1. Refine Prompt
        console.log(`Refining prompt for: ${userVoiceInput}`)
        const englishPrompt = await gemini.refinePrompt(userVoiceInput)
        console.log(`English prompt: ${englishPrompt}`)

        // 2. Generate Image
        console.log(`Generating image...`)
        const imageBase64 = await imagen.generateImage(englishPrompt)

        return c.json({
            original: userVoiceInput,
            prompt: englishPrompt,
            image: `data:image/png;base64,${imageBase64}`
        })

    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

app.post('/generate-canvas', async (c) => {
    const { prompt: userVoiceInput } = await c.req.json()

    if (!userVoiceInput) {
        return c.json({ error: 'No input provided' }, 400)
    }

    try {
        // Use Gemini 3.0 Pro for advanced coding tasks
        const gemini = new GeminiService(c.env.GOOGLE_GENAI_API_KEY, 'gemini-3-pro-preview')

        console.log(`Generating canvas code for: ${userVoiceInput}`)
        const code = await gemini.generateCanvasCode(userVoiceInput)
        console.log(`Generated code: ${code}`)

        return c.json({
            original: userVoiceInput,
            code: code
        })

    } catch (e: any) {
        console.error(e)
        return c.json({ error: e.message }, 500)
    }
})

app.post('/generate-canvas-stream', async (c) => {
    const { prompt: userVoiceInput } = await c.req.json()

    if (!userVoiceInput) {
        return c.json({ error: 'No input provided' }, 400)
    }

    const gemini = new GeminiService(c.env.GOOGLE_GENAI_API_KEY, 'gemini-3-pro-preview')

    return stream(c, async (stream) => {
        c.header('Content-Type', 'text/plain; charset=utf-8')
        c.header('X-Content-Type-Options', 'nosniff')
        c.header('Transfer-Encoding', 'chunked')
        c.header('Content-Encoding', 'identity')

        try {
            const codeStream = gemini.generateCanvasCodeStream(userVoiceInput)
            for await (const chunk of codeStream) {
                await stream.write(chunk)
            }
        } catch (e: any) {
            console.error(e)
            await stream.write(`// Error: ${e.message}`)
        }
    })
})

export default app
