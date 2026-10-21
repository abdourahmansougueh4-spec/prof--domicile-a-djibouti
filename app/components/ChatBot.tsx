'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export default function ChatBot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Bonjour et bienvenue sur Djib Superprof ! Je suis Coach Djib, votre assistant personnel. Êtes-vous un parent, un professeur ou un élève ?" 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [device, setDevice] = useState('Ordinateur')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Détection de l'appareil
  useEffect(() => {
    const ua = navigator.userAgent
    if (/android/i.test(ua)) setDevice('Android')
    else if (/iPad|iPhone|iPod/.test(ua)) setDevice('iPhone')
    else setDevice('Ordinateur')
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Envoi du message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          currentPage: pathname, 
          device: device 
        })
      })
      
      const data = await res.json()
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message || "Désolé, je n'ai pas pu traiter votre demande." 
      }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Désolé, une erreur de connexion est survenue." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* ========================================================= */}
      {/* BOUTON FLOTTANT (TOUJOURS VISIBLE - Z-INDEX MAXIMAL) */}
      {/* ========================================================= */}
      <div className="fixed bottom-6 right-5 z-[9999]">
        {/* Halo lumineux */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-blue-500 rounded-full blur-lg"
        />
        
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#1e1b4b] via-[#2563eb] to-[#059669] shadow-2xl flex items-center justify-center text-white border-2 border-white/20 backdrop-blur-md"
          aria-label="Ouvrir le chat"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* ========================================================= */}
      {/* FENÊTRE DE CHAT (FENÊTRE FLOTTANTE PREMIUM) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            
            // Positionnée au-dessus du bouton, taille fixe max pour ne pas prendre tout l'écran
            className="fixed bottom-24 right-5 z-[9998] w-[calc(100vw-2.5rem)] max-w-[380px] h-[65vh] max-h-[600px] flex flex-col overflow-hidden bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50 rounded-[2rem]"
          >
            {/* En-tête Premium */}
            <div className="bg-gradient-to-r from-indigo-800 via-blue-700 to-emerald-600 px-5 py-4 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                  <span className="text-xl">🧠</span>
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Coach Djib</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">
                      En ligne · Réponse instantanée
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0 shadow-md">
                      🤖
                    </div>
                  )}
                  <div className={`max-w-[85%] p-3.5 text-[13.5px] leading-relaxed font-medium whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl rounded-br-sm shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0 shadow-md">
                    🤖
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulaire */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className={`w-11 h-11 rounded-xl text-white flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg scale-100 hover:scale-105' 
                    : 'bg-slate-300 cursor-not-allowed scale-95'
                }`}
              >
                <svg className="w-5 h-5 transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}