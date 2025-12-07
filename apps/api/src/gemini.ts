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
}
