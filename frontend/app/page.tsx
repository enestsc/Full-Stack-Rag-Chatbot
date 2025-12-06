"use client"

import * as React from "react"
import axios from "axios"
import { Send, MessageSquare, User, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
    { role: "bot", content: "Hello! I am ready to answer questions about the CV." }
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryItem[]>([])

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    fetchHistory()
  }, [])

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loading])

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
      const res = await axios.post(`${API_URL}/chat`, { message: userMsg })
      setMessages((prev) => [...prev, { role: "bot", content: res.data.answer }])
      fetchHistory() // Refresh history after valid exchange
    } catch (err) {
      console.error("Chat error", err)
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, something went wrong." }])
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryItem = (item: HistoryItem) => {
    setMessages([
      { role: "user", content: item.user_query },
      { role: "bot", content: item.bot_response }
    ])
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 border-r hidden md:flex flex-col bg-muted/40 p-4">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" /> Recent Chats
        </h2>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {history.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start text-left text-sm truncate h-auto py-2"
                onClick={() => loadHistoryItem(item)}
              >
                <div className="truncate w-full">
                  {item.user_query}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="border-b p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">RAG Chatbot</h1>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "rounded-lg p-3 max-w-[80%]",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                   <Bot size={16} />
                 </div>
                 <div className="bg-muted rounded-lg p-3">
                   <Loader2 className="w-4 h-4 animate-spin" />
                 </div>
              </div>
            )}
            <div ref={scrollAreaRef as any} /> 
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-background">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              placeholder="Ask a question about the CV..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
