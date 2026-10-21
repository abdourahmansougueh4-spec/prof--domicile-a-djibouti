'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { usePathname } from 'next/navigation'

// =====================================================================
// TYPES & INTERFACES
// =====================================================================
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
  const [isMobile, setIsMobile] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  // =====================================================================
  // DÉTECTION DE L'APPAREIL (Pour adapter l'interface et le prompt IA)
  // =====================================================================
  useEffect(() => {
    const ua = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    setIsMobile(isMobileDevice)
    
    if (/android/i.test(ua)) setDevice('Android')
    else if (/iPad|iPhone|iPod/.test(ua)) setDevice('iPhone')
    else setDevice('Ordinateur')
  }, [])

  // =====================================================================
  // AUTO-SCROLL VERS LE BAS
  // =====================================================================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // =====================================================================
  // ENVOI DU MESSAGE À L'API
  // =====================================================================
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
        content: "Désolé, une erreur de connexion est survenue. Veuillez vérifier votre connexion internet." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================================
  // GESTION DU GLISSEMENT VERS LE BAS POUR FERMER (Mobile)
  // =====================================================================
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 100) {
      setIsOpen(false)
    }
  }

  // =====================================================================
  // RENDU VISUEL (UI PREMIUM)
  // =====================================================================
  return (
    <>
      {/* ========================================================= */}
      {/* BOUTON FLOTTANT (LA BULLE) - Toujours visible */}
      {/* ========================================================= */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: isOpen ? 90 : 0 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-5 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center text-2xl text-white border-2 border-white/20 backdrop-blur-sm transition-all"
        aria-label="Ouvrir le chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </motion.button>

      {/* ========================================================= */}
      {/* FENÊTRE DE CHAT - S'adapte à l'écran (Mobile ou Desktop) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag={isMobile ? "y" : false} // Drag uniquement sur mobile
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            
            // Styles adaptatifs : Plein écran sur mobile, flottant sur desktop
            className={`
              fixed z-[100] flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl shadow-2xl border border-white/50 ring-1 ring-slate-900/5
              ${isMobile 
                ? 'inset-0 rounded-none' 
                : 'bottom-40 right-5 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] rounded-3xl'
              }
            `}
          >
            {/* Poignée de glissement (Visible uniquement sur mobile) */}
            {isMobile && (
              <div 
                className="w-full flex justify-center pt-3 pb-1 bg-gradient-to-r from-indigo-700 to-emerald-600 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
              </div>
            )}

            {/* EN-TÊTE DU CHAT */}
            <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-600 px-5 pb-4 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Coach Djib</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-[11px] font-medium text-blue-100 uppercase tracking-widest">
                      Expert du site
                    </p>
                  </div>
                </div>
                {/* Bouton fermer spécifique mobile */}
                {isMobile && (
                  <button onClick={() => setIsOpen(false)} className="ml-auto w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* ZONE DES MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar de l'IA */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0 shadow-md">
                      🤖
                    </div>
                  )}
                  
                  {/* Bulle de message */}
                  <div className={`max-w-[85%] p-4 text-[14px] leading-relaxed font-medium whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl rounded-br-sm shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm shadow-sm font-sans'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Indicateur de chargement (3 petits points) */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0 shadow-md">
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

            {/* FORMULAIRE DE SAISIE */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-3.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className={`w-12 h-12 rounded-xl text-white flex items-center justify-center transition-all ${
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
            
            {/* Pied de page (Sécurité) */}
            <div className="text-center pb-3 bg-white text-[10px] text-slate-400 font-medium tracking-wide">
              Propulsé par Coach Djib AI - Sécurisé
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}