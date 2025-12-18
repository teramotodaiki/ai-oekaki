
import { describe, it, expect, vi } from 'vitest'
import { IncrementalRunner } from './IncrementalRunner'

describe('IncrementalRunner', () => {
    it('should execute a complete statement', () => {
        const roughCanvasMock = {
            line: vi.fn(),
        }
        const runner = new IncrementalRunner(roughCanvasMock)

        runner.push("roughCanvas.line(0,0,10,10);")

        expect(roughCanvasMock.line).toHaveBeenCalledWith(0, 0, 10, 10)
    })

    it('should buffer split statements and execute when complete', () => {
        const roughCanvasMock = {
            line: vi.fn(),
        }
        const runner = new IncrementalRunner(roughCanvasMock)

        runner.push("roughCan")
        expect(roughCanvasMock.line).not.toHaveBeenCalled()

        runner.push("vas.line(0,0,")
        expect(roughCanvasMock.line).not.toHaveBeenCalled()

        runner.push("10,10);")
        expect(roughCanvasMock.line).toHaveBeenCalledWith(0, 0, 10, 10)
    })

    it('should execute multiple statements', () => {
        const roughCanvasMock = {
            line: vi.fn(),
            circle: vi.fn(),
        }
        const runner = new IncrementalRunner(roughCanvasMock)

        runner.push("roughCanvas.line(0,0,10,10);")
        expect(roughCanvasMock.line).toHaveBeenCalled()

        runner.push(" roughCanvas.circle(100,100,50);")
        expect(roughCanvasMock.circle).toHaveBeenCalledWith(100, 100, 50)
    })

    it('should ignore markdown blocks', () => {
        const roughCanvasMock = {
            line: vi.fn(),
        }
        const runner = new IncrementalRunner(roughCanvasMock)

        runner.push("```javascript\n")
        runner.push("roughCanvas.line(0,0,10,10);\n")
        runner.push("```")

        expect(roughCanvasMock.line).toHaveBeenCalled()
    })

    it('should should re-run everything on finish', () => {
        const roughCanvasMock = {
            line: vi.fn(),
            rectangle: vi.fn(),
        }
        // Assuming we might need a way to clear canvas in the real impl,
        // but here we just check if it calls the codes again.
        // Actually, the requirement is "Clear canvas and re-run".
        // The runner expects `roughCanvas` to handle drawing.
        // We might need a `reset` callback or similar, but simplified:

        const runner = new IncrementalRunner(roughCanvasMock)

        runner.push("roughCanvas.line(0,0,10,10);")
        expect(roughCanvasMock.line).toHaveBeenCalledTimes(1)

        runner.push("roughCanvas.rectangle(0,0,10,10);")
        expect(roughCanvasMock.rectangle).toHaveBeenCalledTimes(1)

        // Clear mocks to verify re-run
        vi.clearAllMocks()

        runner.finish()

        expect(roughCanvasMock.line).toHaveBeenCalledTimes(1)
        expect(roughCanvasMock.rectangle).toHaveBeenCalledTimes(1)
    })
})
