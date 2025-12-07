export class ImagenService {
    private apiKey: string
    private modelName: string
    private accountId: string // If using CF logic or specific endpoint, but here assuming Google AI Studio / Vertex direct logic via REST if possible.

    constructor(apiKey: string, modelName: string) {
        this.apiKey = apiKey
        this.modelName = modelName
        this.accountId = "" // Placeholder if needed
    }

    async generateImage(prompt: string): Promise<string> {
        // Note: Imagen 3/4 via Google AI Studio API (REST)
        // Structure typically: https://generativelanguage.googleapis.com/v1beta/models/{model}:predict
        // NOTE: Current public API for Imagen might differ. This is a best-effort implementation for the "Imagen 4 Fast" request.

        // Mocking the URL pattern for Google AI Studio's Imagen endpoint
        // If this fails in real usage (due to model non-existence), the user must swap the model name or endpoint.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:predict?key=${this.apiKey}`

        // This payload structure is based on standard Vertex/AI Studio image gen payloads
        const payload = {
            instances: [
                {
                    prompt: prompt
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
                safetySettings: [
                    { category: "HARM_CATEGORY_SEXUAL", threshold: "BLOCK_LOW_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS", threshold: "BLOCK_LOW_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" },
                ]
            }
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            // Fallback for debugging (assuming fake implementation for future models)
            console.error("Imagen API Error:", errorText)
            throw new Error(`Imagen API Failed: ${response.status} ${errorText}`)
        }

        const data = await response.json() as any

        // Debug logging
        // console.log("Imagen API Response:", JSON.stringify(data, null, 2))

        // 1. Vertex AI / Standard structure: { predictions: [ { bytesBase64: "..." } ] }
        if (data.predictions && data.predictions[0]) {
            const firstPred = data.predictions[0]

            console.log("Prediction[0] type:", typeof firstPred)

            if (typeof firstPred === 'object' && firstPred.bytesBase64) {
                return firstPred.bytesBase64
            }

            if (typeof firstPred === 'string') {
                return firstPred
            }

            // Robust search: Look for ANY long string value (likely base64) in the object
            // This handles cases where key might be different (e.g. "b64", "base64", "byteBase64", etc.)
            if (typeof firstPred === 'object') {
                for (const key in firstPred) {
                    const val = firstPred[key]
                    if (typeof val === 'string' && val.length > 200) {
                        console.log(`Found base64 image in key: ${key}`)
                        return val
                    }
                }
            }

            // Force return JSON if all else fails, so we can see it in valid form
            if (firstPred) {
                console.warn("Forcing return of full object")
                return JSON.stringify(firstPred) // Return valid JSON so we can debug client side if needed
            }
        }

        // 3. Alternative "images" structure
        if (data.images && data.images[0]) {
            if (typeof data.images[0] === 'string') return data.images[0]
            if (data.images[0].image) return data.images[0].image
        }

        throw new Error(`Unexpected Imagen API response format. Payload: ${JSON.stringify(data)}`)
    }
}
