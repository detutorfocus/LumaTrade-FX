import { apiClient } from '../api/client';
import { ChatRequest, ChatResponse } from '../api/types';

/**
 * Sends a message to the LumaTrade AI Assistant.
 * Uses the POST /api/assistant/chat/ endpoint from the OpenAPI spec.
 */
export const sendChatMessage = async (message: string, context?: Record<string, any>): Promise<ChatResponse> => {
  const payload: ChatRequest = {
    message,
    context
  };

  const response = await apiClient.post<ChatResponse>('/api/assistant/chat/', payload);
  return response.data;
};
