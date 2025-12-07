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
      You are an expert prompt engineer for image generation AI.

      Task: Convert the following Japanese spoken text (from a 5-year-old) into a high-quality, detailed English image generation prompt.
      The style should be "colorful, friendly, storybook illustration, highly detailed, 8k resolution".

      Input: "${originalText}"

      Output (just the English prompt):
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text().trim()
    }
}
