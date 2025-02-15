'use client'

import { useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  options?: {
    type: 'date' | 'group-size' | 'duration' | 'interests' | 'budget'
    data?: any
  }
}

export function useAIChat(): {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
} {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      })

      const data = await response.json()
      
      // Add user message
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), content, isUser: true }
      ])

      // Only add AI message if we have a valid response
      if (data && data.message) {
        setMessages(prev => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            content: data.message, 
            isUser: false 
          }
        ])
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          content: "I apologize, but I encountered an error. Please try again.", 
          isUser: false 
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    messages,
    isLoading,
    sendMessage
  }
} 