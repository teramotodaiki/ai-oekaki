
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiService } from './gemini'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Mock GoogleGenerativeAI
vi.mock('@google/generative-ai', () => {
    const GoogleGenerativeAI = vi.fn()
    GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
        generateContentStream: vi.fn().mockResolvedValue({
            stream: (async function* () {
                yield { text: () => 'roughCanvas' };
                yield { text: () => '.line(0,0,10,10);' };
            })()
        }),
        generateContent: vi.fn()
    })
    return { GoogleGenerativeAI }
})

describe('GeminiService', () => {
    let service: GeminiService

    beforeEach(() => {
        service = new GeminiService('fake-key', 'fake-model')
    })

    it('should generate canvas code stream', async () => {
        const stream = service.generateCanvasCodeStream('draw a line');

        let fullText = '';
        for await (const chunk of stream) {
            fullText += chunk;
        }

        expect(fullText).toBe('roughCanvas.line(0,0,10,10);');
    })
})
