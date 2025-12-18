export class IncrementalRunner {
    private currentCode = '';
    private roughCanvas: any;

    constructor(roughCanvas: any) {
        this.roughCanvas = roughCanvas;
    }

    push(chunk: string) {
        this.currentCode += chunk;
        const codeToExecute = this.cleanCode(this.currentCode);

        // Optimization: Try to check syntax validity before Clearing Canvas
        // new Function will throw SyntaxError if incomplete
        try {
            const func = new Function('roughCanvas', codeToExecute);

            // If we are here, syntax is likely valid (or at least valid enough to compile).
            // Now we clear and run.
            this.clearCanvas();

            // Execute
            func(this.roughCanvas);

        } catch (e) {
            // SyntaxError: Incomplete code. We just wait for next chunk.
            // ReferenceError/TypeError: Logic error or incomplete variable definition.
            // For now, we suppress these during streaming to avoid flickering/console spam,
            // as they often resolve themselves with the next chunk.

            // Optional: If it's a runtime error (not syntax), maybe we *should* log it if it persists?
            // But strict "incomplete syntax" check is hard in JS without a parser.
            // `new Function` handles syntax check.
        }
    }

    finish(onBeforeRerun?: () => void) {
        if (onBeforeRerun) onBeforeRerun();

        const code = this.cleanCode(this.currentCode);
        this.clearCanvas();
        try {
            const func = new Function('roughCanvas', code);
            func(this.roughCanvas);
        } catch (e) {
            console.error("Final execution error:", e);
        }
    }

    private clearCanvas() {
        const canvas = this.roughCanvas.canvas;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Determine clear color? Assuming white for now based on app design
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    private cleanCode(code: string) {
        return code
            .replace(/```javascript/g, '')
            .replace(/```/g, '')
            .replace(/^javascript\s*/, '');
    }
}
