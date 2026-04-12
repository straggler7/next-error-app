export interface AgentRecommendation {
  field: string;
  currentValue: string;
  proposedValue: string;
  confidenceScore: number;
  reason?: string;
}

export interface AgentRecommendationsResponse {
  recommendations: AgentRecommendation[] | null;
  status: 'PENDING' | 'COMPLETE' | 'ERROR';
  message?: string;
  analyzedAt?: string;
}

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onStatusUpdate?: (status: string) => void;
}

class AIAgentService {
  async submitWorkRecord(eraDto: Record<string, unknown>, dln: string): Promise<void> {
    const response = await fetch('/api/ai-agent/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eraDto, dln }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Submission failed' }));
      throw new Error(error.message || `Submission failed with status ${response.status}`);
    }
  }

  async getRecommendations(dln: string): Promise<AgentRecommendationsResponse> {
    const response = await fetch(
      `/api/ai-agent/recommendations?dln=${encodeURIComponent(dln)}`
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Failed to fetch recommendations' }));
      throw new Error(error.message || `Fetch failed with status ${response.status}`);
    }

    return response.json();
  }

  pollForRecommendations(
    dln: string,
    { intervalMs = 3000, timeoutMs = 60000, onStatusUpdate }: PollOptions = {}
  ): Promise<AgentRecommendation[]> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const poll = async () => {
        try {
          const result = await this.getRecommendations(dln);

          if (result.status === 'COMPLETE' && result.recommendations) {
            resolve(result.recommendations);
            return;
          }

          if (result.status === 'ERROR') {
            reject(new Error(result.message || 'Agent processing failed'));
            return;
          }

          if (Date.now() - startTime >= timeoutMs) {
            reject(new Error('Agent analysis timed out. Please try again.'));
            return;
          }

          onStatusUpdate?.(result.status || 'PENDING');
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const aiAgentService = new AIAgentService();
