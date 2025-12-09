"use client"
import * as React from "react"
import axios from "axios"
import { Send, MessageSquare, User, Bot, Loader2, Github } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const API_URL = "http://localhost:8000"

interface Message {
  role: "user" | "bot"
  content: string
}

interface HistoryItem {
  id: number
  user_query: string
  bot_response: string
  timestamp: string
}

export default function ChatPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: "bot", content: "Hello! I am ready to answer questions about the CV and GitHub projects." }
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [language, setLanguage] = React.useState<"tr" | "en">("tr")

  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetchHistory()
  }, [])

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`)
      setHistory(res.data)
    } catch (err) {
      console.error("Failed to fetch history", err)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = input
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setInput("")
    setLoading(true)

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        message: userMsg,
        language: language
      })
      setMessages((prev) => [...prev, { role: "bot", content: res.data.answer }])
      fetchHistory()
    } catch (err) {
      console.error("Chat error", err)
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, something went wrong." }])
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryItem = (item: HistoryItem) => {
    // Inject both the Question and the Answer into the chat window
    setMessages([
      { role: "user", content: item.user_query },
      { role: "bot", content: item.bot_response }
    ])
  }

  const handleLanguageChange = (lang: "tr" | "en") => {
    setLanguage(lang)
  }

  return (
    // ROOT: Fixed Viewport Strategy
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground font-sans">

      {/* 1. Header: Fixed height, never moves */}
      <header className="flex-none h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">DevTwin</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Powered by Groq & <Github className="w-3 h-3" /> Graph
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-full p-1 border">
            <button
              onClick={() => handleLanguageChange("tr")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                language === "tr" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              TR
            </button>
            <button
              onClick={() => handleLanguageChange("en")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                language === "en" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* 2. Content Wrapper: Fills remaining vertical space */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar: Fixed width, scrolls independently */}
        <aside className="w-64 flex-none border-r hidden md:flex flex-col bg-muted/20 overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2 font-semibold flex-none">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>Recent Chats</span>
          </div>
          {/* History List: Flex-1 to fill space, overflow-auto to scroll */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                // truncate: force one line with ellipsis
                className="w-full justify-start text-left text-sm h-9 px-3 truncate block"
                onClick={() => loadHistoryItem(item)}
                title={item.user_query}
              >
                <span className="truncate w-full block">
                  {item.user_query}
                </span>
              </Button>
            ))}
          </div>
        </aside>

        {/* Chat Area: Flex-1, manages its own scrolling */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-muted/5">

          {/* Messages Scroll: The ONLY part that should scroll */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                    msg.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
                  )}>
                    {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={cn(
                    "rounded-2xl p-4 max-w-[85%] shadow-sm",
                    msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border text-card-foreground rounded-tl-sm"
                  )}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-background border flex items-center justify-center shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="bg-card border rounded-2xl p-4 rounded-tl-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing portfolio...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          {/* Input Area: Fixed at bottom */}
          <div className="flex-none border-t p-4 bg-background">
            <div className="max-w-3xl mx-auto flex gap-3 relative">
              <Input
                placeholder={language === "tr" ? "Bir soru sorun..." : "Ask a question..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
                className="flex-1 h-12 pl-4 pr-12 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20 shadow-sm transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              DevTwin can make mistakes. Please verify important information.
            </p>
          </div>

        </main>
      </div>
    </div>
  )
}
