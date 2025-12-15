import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
    private genAI: GoogleGenerativeAI
    private modelName: string

    constructor(apiKey: string, modelName: string) {
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.modelName = modelName
    }

    async refinePrompt(originalText: string): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: this.modelName })

        // System prompt behavior via input, as some models don't support system instructions in the same way yet,
        // or to keep it compatible with Flash variants.
        const prompt = `
      You are a translator and style enhancer for image generation.

      Task: accurate translation of the Japanese input into English, and append specific style keywords.
      IMPORTANT: Do NOT add any new objects, characters, or story elements that are not in the input. Keep the subject matter EXACTLY as requested.

      Style keywords to append: "storybook illustration, colorful, 8k resolution, highly detailed"

      Input: "${originalText}"

      Output (English prompt only):
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text().trim()
    }

    async generateCanvasCode(originalText: string): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: this.modelName })

        const prompt = `
      You are a JavaScript developer for a specialized drawing app.

      Task: Write JavaScript code to draw the request on an HTML5 Canvas.
      Input: "${originalText}"

      Requirements:
      1. Use 'ctx' variable to access the 2D context.
      2. Canvas size is 512x512.
      3. Use simple, standard Canvas API calls (fillRect, stroke, beginPath, arc, etc.).
      4. Do NOT define 'ctx'. It is provided.
      5. Do NOT add any comments.
      6. Output ONLY the code. No markdown blocks, no 'javascript' tags.

      Example Input: "Red circle"
      Example Output:
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(256, 256, 100, 0, Math.PI * 2);
      ctx.fill();
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        let text = response.text().trim()

        // Cleanup if the model adds markdown
        if (text.startsWith('```javascript')) {
            text = text.replace('```javascript', '').replace('```', '').trim()
        } else if (text.startsWith('```')) {
            text = text.replace('```', '').replace('```', '').trim()
        }

        return text
    }
}
