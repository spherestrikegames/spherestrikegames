export interface AiFlaggedUser {
  userId: string;
  username: string;
  email: string;
  suspiciousScore: number;
  riskCategory: string;
  explanation: string;
  recommendedAction: 'Block Account' | 'Monitor' | 'Dismiss';
}

export interface AiAuditReport {
  timestamp: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  accountsScanned: number;
  flaggedCount: number;
  blockedCount: number;
  flaggedUsers: AiFlaggedUser[];
  nextScheduledAuditAt?: string;
}
