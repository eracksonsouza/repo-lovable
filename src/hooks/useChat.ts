import { useState, useCallback } from "react";
import { chatService } from "@/services/chatService";
import { useFinance } from "@/contexts/FinanceContext";
import type { Message, ChatMessage } from "@/types/chat";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 👋 Sou seu assistente financeiro. Como posso ajudar você a economizar hoje?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { getTotalIncome, getTotalExpenses, getBalance, expenses, categories } =
    useFinance();

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Adicionar mensagem do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Preparar contexto financeiro
        const financialContext = {
          totalIncome: getTotalIncome(),
          totalExpenses: getTotalExpenses(),
          balance: getBalance(),
          topExpenseCategories: expenses.reduce((acc, expense) => {
            acc[expense.category] =
              (acc[expense.category] || 0) + expense.amount;
            return acc;
          }, {} as Record<string, number>),
          categories: categories.map((c) => c.name),
        };

        // Converter histórico para formato da API
        const conversationHistory: ChatMessage[] = messages
          .slice(-5)
          .map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
          }));

        // Enviar para API
        const response = await chatService.sendMessage({
          message: text,
          context: financialContext,
          conversationHistory,
        });

        // Adicionar resposta da IA
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      isLoading,
      getTotalIncome,
      getTotalExpenses,
      getBalance,
      expenses,
      categories,
    ]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
