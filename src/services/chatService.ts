import type { ChatRequest, ChatResponse } from "@/types/chat";

class ChatService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    console.log("🔧 Webhook URL configurada:", this.webhookUrl);

    if (!this.webhookUrl) {
      console.error("VITE_N8N_WEBHOOK_URL não está configurada");
    }
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log("📤 Enviando mensagem para n8n:", {
        url: this.webhookUrl,
        message: request.message,
        context: request.context,
      });

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: request.message,
          context: request.context,
          conversationHistory: request.conversationHistory,
        }),
      });

      console.log("📊 Status da resposta:", response.status);
      console.log("📊 Response OK?", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro do servidor:", errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      console.log(
        "📥 Resposta completa do n8n:",
        JSON.stringify(data, null, 2)
      );
      console.log("📥 Tipo da resposta:", typeof data);
      console.log("📥 É array?", Array.isArray(data));

      // Se vier como array, pega o primeiro item
      const responseData = Array.isArray(data) ? data[0] : data;

      // Tentar múltiplos campos possíveis
      const aiResponse =
        responseData.response ||
        responseData.output ||
        responseData.message?.content ||
        responseData.message ||
        responseData.text ||
        "Resposta recebida com sucesso.";

      console.log("📥 Resposta final da IA:", aiResponse);

      return {
        response: aiResponse,
        success: true,
      };
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
      return {
        response:
          "Desculpe, não consegui processar sua pergunta no momento. Tente novamente em alguns instantes.",
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

export const chatService = new ChatService();
