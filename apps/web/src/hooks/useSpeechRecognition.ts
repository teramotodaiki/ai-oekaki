import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSpeechRecognitionProps {
    onTranscriptFinalized: (text: string) => void
    debounceMs?: number
}

export function useSpeechRecognition({
    onTranscriptFinalized,
    debounceMs = 1500
}: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

    const stopTimer = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = undefined
        }
    }, [])

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (e) {
                console.warn("Recognition already started", e)
            }
        }
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [])

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.error("Browser does not support Speech Recognition")
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = 'ja-JP'
        recognition.continuous = true // Keep listening
        recognition.interimResults = true // Show real-time feedback

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let final = ''
            let interim = ''

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript
                } else {
                    interim += event.results[i][0].transcript
                }
            }

            setInterimTranscript(interim)
            if (final) {
                setTranscript(prev => prev + final)
                // Actually, we might want to accumulate or just take the burst.
                // For oekaki, usually a single phrase is good.
                // Let's rely on the debounce logic below to send whatever we have currently.
            }

            // Debounce logic: if we have *any* content (interim or final), reset the timer
            const currentText = interim || final || transcript
            if (currentText.trim().length > 0) {
                stopTimer()
                debounceTimerRef.current = setTimeout(() => {
                    // Send the *accumulated* interim+final (or just what we have)
                    // Actually, usually we only want to send "finalized" sentences, OR wait for a pause in speaking.
                    // If the user pauses for `debounceMs`, we treat it as "done speaking".

                    // Re-grab values from refs or closures?
                    // In this specific closure, `interim` and `final` are fresh.
                    // Better strategy: Use the 'end of speech' logic.
                    // But we want to support 'debounce'.

                    // Let's trigger callback with the collected text so far (likely just the latest burst if we clear it).
                    // To prevent sending partial words, maybe we should only send if `final` was populated?
                    // BUT, `interim` can be quite accurate.
                    // Let's prefer `final` segments, but if `interim` hangs around for 1.5s, it's probably done.

                    // Complication: The `transcript` state might grow indefinitely if we don't clear it.
                    // Assumption: After sending, we should clear the buffer to start fresh for the next drawing.

                    // Wait, we can't easily access the latest state inside setTimeout without refs.
                    // For simplicity, let's just use the fact that this timer runs ONLY when result updates.
                    // BUT we need the LATEST full text.

                    // Let's dispatch a custom event or use a ref for current text buffer.
                }, debounceMs)
            }
        }

        recognition.onend = () => {
            // If desired to be always-on, restart.
            // But maybe user wants to toggle?
            // Concept says "Audio input bar... Microphone button". So likely manual toggle or start.
            // But also "no send button".
            // Let's stop listening status when it actually stops.
            setIsListening(false)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error", event.error)
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            stopTimer()
            recognition.stop()
        }
    }, [stopTimer, debounceMs])

    // Ref-based debounce execution to access latest state
    const transcriptRef = useRef('')
    useEffect(() => {
        transcriptRef.current = transcript + interimTranscript

        // Reset timer on change
        stopTimer()
        if ((transcript + interimTranscript).trim().length > 0) {
            debounceTimerRef.current = setTimeout(() => {
                const finalText = transcriptRef.current
                if (finalText.trim()) {
                    onTranscriptFinalized(finalText)
                    // Clear state after sending to prepare for next
                    setTranscript('')
                    setInterimTranscript('')
                }
            }, debounceMs)
        }
    }, [transcript, interimTranscript, debounceMs, onTranscriptFinalized, stopTimer])

    return { isListening, transcript, interimTranscript, startListening, stopListening }
}
