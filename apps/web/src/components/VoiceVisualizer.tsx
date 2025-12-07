import { motion } from 'framer-motion'

interface VoiceVisualizerProps {
    isListening: boolean
    interimTranscript?: string
}

export function VoiceVisualizer({ isListening, interimTranscript }: VoiceVisualizerProps) {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative h-16 w-16 flex items-center justify-center">
                {isListening && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-full bg-brand-400 opacity-20"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full bg-brand-400 opacity-20"
                            animate={{ scale: [1, 2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                        />
                    </>
                )}
                <div className={`z-10 h-14 w-14 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-brand-500 shadow-lg shadow-brand-200' : 'bg-slate-300'}`}>
                    {/* Mic Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                </div>
            </div>

            <div className="h-8 mt-2 text-center">
                {interimTranscript ? (
                    <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold text-slate-700"
                    >
                        {interimTranscript}
                    </motion.span>
                ) : (
                    isListening && <span className="text-sm text-slate-400">おはなししてね...</span>
                )}
            </div>
        </div>
    )
}
