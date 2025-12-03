export interface UserProfile {
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  healthContext: string;
}

export interface RecommendedProduct {
  name: string;
  reason: string;
}

export interface CalorieAnalysis {
  productCalories: number; // kcal
  userDailyNeed: number; // kcal (Estimated TDEE)
  percentage: number; // %
  note: string; // Short text explanation (e.g., "Based on sedentary lifestyle...")
}

export interface ImageQualityCheck {
  isUnclear: boolean;
  reason: string;
}

export interface AnalysisResult {
  imageQualityCheck: ImageQualityCheck;
  calorieAnalysis?: CalorieAnalysis;
  summary: string;
  pros: string[];
  cons: string[];
  recommendations: RecommendedProduct[];
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  result: AnalysisResult;
  imagePreviewUrl?: string;
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
}