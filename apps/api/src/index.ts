import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { GeminiService } from './gemini'
import { ImagenService } from './imagen'

type Bindings = {
    GOOGLE_GENAI_API_KEY: string
    GOOGLE_GENAI_MODEL_NAME: string
    IMAGEN_MODEL_NAME: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

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
        const gemini = new GeminiService(c.env.GOOGLE_GENAI_API_KEY, c.env.GOOGLE_GENAI_MODEL_NAME)

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

export default app
