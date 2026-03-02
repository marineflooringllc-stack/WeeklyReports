
export interface WorkPhase {
  date: string;
  description: string;
}

export interface Compartment {
  id: string;
  vessel: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  sqft: number;
  installer: string;
  phases: WorkPhase[];
  qcPassed: boolean;
}

export interface Foreman {
  name: string;
  pin: string;
}

export interface EditLogEntry {
  user: string;
  timestamp: string;
  action: 'created' | 'edited';
}

export interface WeeklyReport {
  id: string;
  vessel: string; 
  weekStart: string;
  weekEnd: string;
  compartments: Compartment[];
  createdAt: string;
  author?: string;
  lastEditor?: string;
  updatedAt?: string;
  editLog?: EditLogEntry[];
}

export interface PTPStep {
  description: string;
  hazards: string;
  actions: string;
}

export interface PreTaskPlan {
  id: string;
  date: string;
  description: string;
  supervisor: string;
  location: string;
  company: string;
  // Evaluation Questions (Yes/No)
  evaluation: {
    walkedArea: boolean | null;
    liveSystems: boolean | null;
    specialTraining: boolean | null;
    msdsReview: boolean | null;
    airMonitoring: boolean | null;
    workPermits: boolean | null;
    evacuationRoutes: boolean | null;
    emergencyEquipment: boolean | null;
    congestedArea: boolean | null;
    ppeNeeded: boolean | null;
    toolsProvided: boolean | null;
    toolsInspected: boolean | null;
    confinedSpace: boolean | null;
    safetyDeptInvolved: boolean | null;
    safetyIssueNotAddressed: boolean | null;
  };
  // Hazard Checklist
  hazards: string[];
  // PPE
  ppe: string[];
  // Task Steps
  steps: PTPStep[];
  // Metadata
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export type ViewMode = 'dashboard' | 'list' | 'add' | 'edit' | 'deleted' | 'detail' | 'management' | 'ptp_list' | 'ptp_add' | 'ptp_edit' | 'ptp_detail' | 'ptp_bulk_print' | 'ptp_deleted' | 'audit_log';
