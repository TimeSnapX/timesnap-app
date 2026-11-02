import { API_BASE } from '../config';
export interface ValuationResult {
  name: string;
  usdValue: number;
  description: string;
  tags: string[];
  valuationReasoning?: string;
  sources?: { title: string; uri: string }[];
}

export const analyzeImage = async (base64Image: string): Promise<ValuationResult> => {
  try {
    const response = await fetch(`${API_BASE}/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data as ValuationResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error to prevent app crash while surfacing error context
    return {
      name: "Unidentified Object",
      usdValue: 0,
      description: "Could not analyze image due to an error. Please try again.",
      tags: ["error"],
      valuationReasoning: error instanceof Error ? error.message : "Error during analysis.",
      sources: []
    };
  }
};