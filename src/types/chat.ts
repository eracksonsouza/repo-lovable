export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FinancialContext {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  topExpenseCategories: Record<string, number>;
  categories: string[];
}

export interface ChatRequest {
  message: string;
  context: FinancialContext;
  conversationHistory: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}
