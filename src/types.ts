export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface SqlTable {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
  sampleQuery: string;
  sampleResult: string;
}

export interface TechCardData {
  title: string;
  subtitle: string;
  comparison: {
    optionA: string;
    optionAPoints: string[];
    optionB: string;
    optionBPoints: string[];
    verdict: string;
  };
  recommendation: string;
}
