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
        // Configure model with thinking config for speed (Gemini 3 Pro)
        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                // @ts-ignore - thinkingConfig is supported in newer models/APIs but might be missing in strict types of this SDK version
                thinkingConfig: {
                    thinkingLevel: "LOW"
                }
            }
        })

        const prompt = `
        You are a JavaScript developer for a specialized drawing app using Rough.js.

            Task: Write JavaScript code to draw the request using the 'roughCanvas' object.
                Input: "${originalText}"

        Requirements:
        1. Use 'roughCanvas' object. It is an instance of RoughCanvas.
        2. Canvas size is 512x512.
        3. Use Rough.js methods directly.
           **IMPORTANT**: These methods draw immediately. Do NOT call .draw().

           Supported methods:
             - roughCanvas.line(x1, y1, x2, y2, options)
             - roughCanvas.rectangle(x, y, width, height, options)
             - roughCanvas.circle(centerX, centerY, diameter, options)
             - roughCanvas.ellipse(centerX, centerY, width, height, options)
             - roughCanvas.linearPath([[x1, y1], [x2, y2], ...], options)
             - roughCanvas.curve([[x1, y1], [x2, y2], ...], options)
             - roughCanvas.polygon([[x1, y1], [x2, y2], ...], options)
             - roughCanvas.path(d, options)

        4. Options object: { stroke: 'color', fill: 'color', roughness: number, ... }
         - Default colors if not specified: stroke 'black', fill 'none'.
         - Feel free to use randomness or 'roughness' for style.

        5. Do NOT define 'roughCanvas'. It is provided.
        6. Output ONLY the code. No markdown blocks, no 'javascript' tags.

        Example Input: "Red circle"
        Example Output:
          roughCanvas.circle(256, 256, 200, { stroke: 'red', fill: 'rgba(255,0,0,0.2)', fillStyle: 'hachure' });
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
