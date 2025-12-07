import { motion, AnimatePresence } from 'framer-motion'

export interface GeneratedImage {
    id: string
    url: string
    originalPrompt: string
    timestamp: number
}

interface ImageFeedProps {
    images: GeneratedImage[]
}

export function ImageFeed({ images }: ImageFeedProps) {
    return (
        <div className="w-full flex-1 overflow-y-auto p-4 space-y-6">
            <AnimatePresence initial={false}>
                {images.map((img) => (
                    <motion.div
                        key={img.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-white"
                    >
                        <div className="relative aspect-square w-full bg-slate-100">
                            <img
                                src={img.url}
                                alt={img.originalPrompt}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4 bg-brand-50">
                            <p className="text-center font-bold text-slate-700 text-lg">
                                「{img.originalPrompt}」
                            </p>
                            <div className="text-center text-xs text-slate-400 mt-1">
                                {new Date(img.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {images.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-300 flex-col gap-4 mt-20">
                    <div className="text-6xl">🎨</div>
                    <p>なにか いってごらん？</p>
                </div>
            )}
        </div>
    )
}
