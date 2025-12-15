import { motion, AnimatePresence } from 'framer-motion'
import { CanvasRenderer } from './CanvasRenderer'

export interface GeneratedItem {
    id: string
    type: 'image' | 'canvas'
    content: string // url or code
    originalPrompt: string
    timestamp: number
}

interface ImageFeedProps {
    items: GeneratedItem[]
}

export function ImageFeed({ items }: ImageFeedProps) {
    return (
        <div className="w-full flex-1 overflow-y-auto p-4 space-y-6">
            <AnimatePresence initial={false}>
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-white"
                    >
                        <div className="relative aspect-square w-full bg-slate-100">
                            {item.type === 'image' ? (
                                <img
                                    src={item.content}
                                    alt={item.originalPrompt}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <CanvasRenderer code={item.content} />
                            )}
                        </div>
                        <div className="p-4 bg-brand-50">
                            <p className="text-center font-bold text-slate-700 text-lg">
                                「{item.originalPrompt}」
                            </p>
                            <div className="text-center text-xs text-slate-400 mt-1">
                                {new Date(item.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {items.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-300 flex-col gap-4 mt-20">
                    <div className="text-6xl">🎨</div>
                    <p>なにか いってごらん？</p>
                </div>
            )}
        </div>
    )
}
