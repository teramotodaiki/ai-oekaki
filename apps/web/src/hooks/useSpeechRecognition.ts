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
    const debugRef = useRef<boolean>(false)
    const debugSeqRef = useRef(0)
    const lastOnResultAtRef = useRef<number | null>(null)
    const lastFinalizedTextRef = useRef<string>('')
    const lastFinalizedAtRef = useRef<number | null>(null)
    const lastSpeechStartAtRef = useRef<number | null>(null)
    const lastSubmittedTextRef = useRef<string>('')
    const lastSubmittedSpeechStartAtRef = useRef<number | null>(null)

    if (!debugRef.current) {
        try {
            debugRef.current =
                (window as any).__debugSpeech === true || window.localStorage.getItem('debugSpeech') === '1'
        } catch {
            debugRef.current = false
        }
    }

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

        if (debugRef.current) {
            console.log('[speech] init', {
                lang: recognition.lang,
                continuous: recognition.continuous,
                interimResults: recognition.interimResults,
                debounceMs,
                engine: window.SpeechRecognition ? 'SpeechRecognition' : 'webkitSpeechRecognition'
            })
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const seq = ++debugSeqRef.current
            const now = Date.now()
            const deltaMs = lastOnResultAtRef.current == null ? null : now - lastOnResultAtRef.current
            lastOnResultAtRef.current = now

            let final = ''
            let interim = ''

            const resultsDebug: Array<{ i: number; isFinal: boolean; transcript: string; confidence?: number }> = []
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript
                } else {
                    interim += event.results[i][0].transcript
                }
                if (debugRef.current) {
                    const alt0 = event.results[i][0]
                    resultsDebug.push({
                        i,
                        isFinal: event.results[i].isFinal,
                        transcript: alt0?.transcript ?? '',
                        confidence: alt0?.confidence
                    })
                }
            }

            if (debugRef.current) {
                console.log('[speech] onresult', {
                    seq,
                    deltaMs,
                    resultIndex: event.resultIndex,
                    resultsLength: event.results.length,
                    final,
                    interim,
                    results: resultsDebug
                })
            }

            setInterimTranscript(interim)
            if (final) {
                setTranscript(prev => prev + final)
                // Actually, we might want to accumulate or just take the burst.
                // For oekaki, usually a single phrase is good.
                // Let's rely on the debounce logic below to send whatever we have currently.
            }
        }

        recognition.onend = () => {
            if (debugRef.current) console.log('[speech] onend')
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

        recognition.onstart = () => {
            if (debugRef.current) console.log('[speech] onstart')
        }
        recognition.onspeechstart = () => {
            lastSpeechStartAtRef.current = Date.now()
            if (debugRef.current) console.log('[speech] onspeechstart')
        }
        recognition.onspeechend = () => {
            if (debugRef.current) console.log('[speech] onspeechend')
        }
        recognition.onaudiostart = () => {
            if (debugRef.current) console.log('[speech] onaudiostart')
        }
        recognition.onaudioend = () => {
            if (debugRef.current) console.log('[speech] onaudioend')
        }
        recognition.onsoundstart = () => {
            if (debugRef.current) console.log('[speech] onsoundstart')
        }
        recognition.onsoundend = () => {
            if (debugRef.current) console.log('[speech] onsoundend')
        }
        recognition.onnomatch = () => {
            if (debugRef.current) console.log('[speech] onnomatch')
        }

        recognitionRef.current = recognition

        return () => {
            if (debugRef.current) console.log('[speech] cleanup: stop + clear timers')
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
        const combined = transcript + interimTranscript
        if (debugRef.current) {
            console.log('[speech] buffer change', {
                combinedLen: combined.length,
                hasText: combined.trim().length > 0
            })
        }
        if (combined.trim().length > 0) {
            debounceTimerRef.current = setTimeout(() => {
                const finalText = transcriptRef.current
                const normalized = finalText.replace(/\s+/g, ' ').trim()
                if (normalized) {
                    const isSameText = normalized === lastSubmittedTextRef.current
                    const isSameUtterance =
                        lastSpeechStartAtRef.current != null &&
                        lastSubmittedSpeechStartAtRef.current != null &&
                        lastSpeechStartAtRef.current === lastSubmittedSpeechStartAtRef.current

                    // iOS Safari (webkitSpeechRecognition) can emit the same final result twice without a new speechstart.
                    // Avoid generating twice for the same utterance.
                    if (isSameText && isSameUtterance) {
                        if (debugRef.current) {
                            console.log('[speech] suppress duplicate finalize', {
                                finalText: normalized,
                                speechStartAt: lastSpeechStartAtRef.current
                            })
                        }
                        setTranscript('')
                        setInterimTranscript('')
                        return
                    }

                    if (debugRef.current) {
                        const now = Date.now()
                        const deltaFromLastFinalize =
                            lastFinalizedAtRef.current == null ? null : now - lastFinalizedAtRef.current
                        console.log('[speech] finalize (debounced)', {
                            deltaFromLastFinalize,
                            isDuplicateText: normalized === lastFinalizedTextRef.current,
                            finalText: normalized
                        })
                        lastFinalizedTextRef.current = normalized
                        lastFinalizedAtRef.current = now
                    }

                    lastSubmittedTextRef.current = normalized
                    lastSubmittedSpeechStartAtRef.current = lastSpeechStartAtRef.current
                    onTranscriptFinalized(normalized)
                    // Clear state after sending to prepare for next
                    setTranscript('')
                    setInterimTranscript('')
                }
            }, debounceMs)
        }
    }, [transcript, interimTranscript, debounceMs, onTranscriptFinalized, stopTimer])

    return { isListening, transcript, interimTranscript, startListening, stopListening }
}
