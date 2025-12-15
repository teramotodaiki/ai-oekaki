import { useState, useCallback } from 'react'
import { VoiceVisualizer } from './components/VoiceVisualizer'
import { ImageFeed, GeneratedItem } from './components/ImageFeed'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'



function App() {
    const [items, setItems] = useState<GeneratedItem[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [mode, setMode] = useState<'image' | 'canvas'>('image')

    const handleTranscript = useCallback(async (text: string) => {
        if (isGenerating) return
        setIsGenerating(true)

        try {
            let item: GeneratedItem

            if (mode === 'image') {
                const res = await fetch('/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: text })
                })
                if (!res.ok) throw new Error('API Error')
                const data = await res.json()

                item = {
                    id: crypto.randomUUID(),
                    type: 'image',
                    content: data.image,
                    originalPrompt: data.original,
                    timestamp: Date.now()
                }
            } else {
                const res = await fetch('/generate-canvas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: text })
                })
                if (!res.ok) throw new Error('API Error')
                const data = await res.json()

                item = {
                    id: crypto.randomUUID(),
                    type: 'canvas',
                    content: data.code,
                    originalPrompt: data.original,
                    timestamp: Date.now()
                }
            }

            setItems(prev => [item, ...prev])

        } catch (e) {
            console.error(e)
        } finally {
            setIsGenerating(false)
        }
    }, [isGenerating, mode])

    const { isListening, interimTranscript, startListening, stopListening } = useSpeechRecognition({
        onTranscriptFinalized: handleTranscript,
        debounceMs: 1200
    })

    return (
        <div className="h-[100dvh] w-full bg-slate-50 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl relative">
            <header className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-slate-100 flex justify-between items-center">
                <h1 className="text-2xl font-bold font-sans text-brand-500 tracking-tight">
                    AI お絵描き
                </h1>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${mode === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                    {mode === 'image' ? '画像モード' : 'お絵かきモード'}
                </div>
            </header>

            {/* Main Feed */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <ImageFeed items={items} />

                {/* Loading Overlay */}
                {isGenerating && (
                    <div className="absolute inset-x-0 top-0 p-4 z-10 flex justify-center pointer-events-none">
                        <div className="bg-brand-500 text-white px-6 py-2 rounded-full shadow-lg font-bold animate-bounce">
                            作成中...
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Control Bar */}
            <footer className="bg-white border-t border-slate-100 p-4 pb-8 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-full flex justify-center gap-2">
                        <button
                            onClick={() => setMode('image')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'image'
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                        >
                            📸 フォト
                        </button>
                        <button
                            onClick={() => setMode('canvas')}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'canvas'
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                        >
                            🎨 キャンバス
                        </button>
                    </div>

                    <VoiceVisualizer
                        isListening={isListening}
                        interimTranscript={interimTranscript}
                    />

                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${isListening
                            ? 'bg-red-500 text-white rotate-180 hover:bg-red-600'
                            : (mode === 'image' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-orange-500 hover:bg-orange-600') + ' text-white'
                            }`}
                    >
                        {isListening ? (
                            // Stop Icon
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        ) : (
                            // Mic Icon (Large)
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                        )}
                    </button>
                </div>
            </footer>
        </div>
    )
}

export default App
