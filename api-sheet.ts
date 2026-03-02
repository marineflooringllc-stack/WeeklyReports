import { WeeklyReport, Foreman, PreTaskPlan, AuditLogEntry } from "./types";

export class SheetService {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private async post(action: string, data: any) {
    try {
      // Adding action to URL as well, as some GAS setups prefer it for routing/CORS
      const urlWithAction = this.url.includes('?') 
        ? `${this.url}&action=${action}` 
        : `${this.url}?action=${action}`;

      const response = await fetch(urlWithAction, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'text/plain' // Simplified for best GAS compatibility
        },
        body: JSON.stringify({ action, data })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      return response;
    } catch (err) {
      console.error(`POST failed for action: ${action}`, err);
      // If it's a "Failed to fetch", it might be a CORS issue or network interruption
      if (err instanceof Error && err.message === 'Failed to fetch') {
        throw new Error(`Network error or CORS block when calling ${action}. Check if the Google Script is deployed to "Anyone".`);
      }
      throw err;
    }
  }

  private async get(action: string) {
    try {
      const response = await fetch(`${this.url}?action=${action}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn(`Empty response for action: ${action}`);
        return [];
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        // If it's HTML, it might be a Google Login page or error page
        if (text.trim().startsWith('<')) {
          throw new Error('Received HTML instead of JSON. This usually means the Google Script is not shared correctly (set to "Anyone") or the URL is incorrect.');
        }
        console.error(`Failed to parse JSON for action: ${action}. Response snippet: ${text.substring(0, 100)}`);
        throw new Error(`Invalid JSON response from server for ${action}`);
      }
    } catch (err) {
      console.error(`Fetch failed for action: ${action}`, err);
      throw err;
    }
  }

  private safeParse(str: any, fallback: any = []) {
    if (typeof str !== 'string' || !str || str.trim() === '' || str === 'undefined' || str === 'null') return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error("SafeParse failed for:", str.substring(0, 50));
      return fallback;
    }
  }

  async fetchReports(): Promise<WeeklyReport[]> { 
    const data = await this.get('fetchReports');
    return (data || []).map((r: any) => {
      // Case-insensitive key lookup for robustness
      const findKey = (obj: any, target: string) => {
        const key = Object.keys(obj).find(k => k.toLowerCase() === target.toLowerCase());
        return key ? obj[key] : undefined;
      };

      return {
        id: String(findKey(r, 'id') || findKey(r, 'ID') || ''),
        vessel: findKey(r, 'vessel') || findKey(r, 'Vessel') || '',
        weekStart: findKey(r, 'weekStart') || findKey(r, 'WeekStart') || '',
        weekEnd: findKey(r, 'weekEnd') || findKey(r, 'WeekEnd') || '',
        compartments: this.safeParse(findKey(r, 'CompartmentsData') || findKey(r, 'compartmentsdata') || findKey(r, 'compartments')),
        createdAt: findKey(r, 'createdAt') || findKey(r, 'CreatedAt') || '',
        author: findKey(r, 'author') || findKey(r, 'Author') || findKey(r, 'foreman') || findKey(r, 'Foreman') || '',
        lastEditor: findKey(r, 'lastEditor') || findKey(r, 'LastEditor') || '',
        updatedAt: findKey(r, 'updatedAt') || findKey(r, 'UpdatedAt') || findKey(r, 'createdAt') || findKey(r, 'CreatedAt') || '',
        editLog: this.safeParse(findKey(r, 'EditLog') || findKey(r, 'editlog'))
      };
    });
  }

  async fetchDeletedReports(): Promise<WeeklyReport[]> { 
    const data = await this.get('fetchDeleted');
    return (data || []).map((r: any) => {
      const findKey = (obj: any, target: string) => {
        const key = Object.keys(obj).find(k => k.toLowerCase() === target.toLowerCase());
        return key ? obj[key] : undefined;
      };

      return {
        id: String(findKey(r, 'id') || findKey(r, 'ID') || ''),
        vessel: findKey(r, 'vessel') || findKey(r, 'Vessel') || '',
        weekStart: findKey(r, 'weekStart') || findKey(r, 'WeekStart') || '',
        weekEnd: findKey(r, 'weekEnd') || findKey(r, 'WeekEnd') || '',
        compartments: this.safeParse(findKey(r, 'CompartmentsData') || findKey(r, 'compartmentsdata') || findKey(r, 'compartments')),
        createdAt: findKey(r, 'createdAt') || findKey(r, 'CreatedAt') || '',
        author: findKey(r, 'author') || findKey(r, 'Author') || findKey(r, 'foreman') || findKey(r, 'Foreman') || '',
        lastEditor: findKey(r, 'lastEditor') || findKey(r, 'LastEditor') || '',
        updatedAt: findKey(r, 'updatedAt') || findKey(r, 'UpdatedAt') || findKey(r, 'createdAt') || findKey(r, 'CreatedAt') || '',
        editLog: this.safeParse(findKey(r, 'EditLog') || findKey(r, 'editlog'))
      };
    });
  }
  async fetchForemen(): Promise<Foreman[]> { 
    const data = await this.get('fetchForemen');
    return (data || []).map((f: any) => ({
      name: f.Name || f.name || '',
      pin: String(f.PIN || f.pin || '')
    }));
  }

  async fetchPTPs(): Promise<PreTaskPlan[]> { 
    const data = await this.get('fetchPTPs');
    return (data || []).map((p: any) => ({
      id: String(p.ID || p.id || ''),
      date: p.Date || p.date || '',
      description: p.Description || p.description || '',
      supervisor: p.Supervisor || p.supervisor || '',
      location: p.Location || p.location || '',
      company: p.Company || p.company || '',
      evaluation: typeof p.Evaluation === 'string' ? JSON.parse(p.Evaluation) : (p.Evaluation || p.evaluation || {}),
      hazards: typeof p.Hazards === 'string' ? JSON.parse(p.Hazards) : (p.Hazards || p.hazards || []),
      ppe: typeof p.PPE === 'string' ? JSON.parse(p.PPE) : (p.PPE || p.ppe || []),
      steps: typeof p.Steps === 'string' ? JSON.parse(p.Steps) : (p.Steps || p.steps || []),
      author: p.Author || p.author || '',
      createdAt: p.CreatedAt || p.createdAt || ''
    }));
  }

  async fetchDeletedPTPs(): Promise<PreTaskPlan[]> { 
    const data = await this.get('fetchDeletedPTPs');
    return (data || []).map((p: any) => ({
      id: String(p.ID || p.id || ''),
      date: p.Date || p.date || '',
      description: p.Description || p.description || '',
      supervisor: p.Supervisor || p.supervisor || '',
      location: p.Location || p.location || '',
      company: p.Company || p.company || '',
      evaluation: typeof p.Evaluation === 'string' ? JSON.parse(p.Evaluation) : (p.Evaluation || p.evaluation || {}),
      hazards: typeof p.Hazards === 'string' ? JSON.parse(p.Hazards) : (p.Hazards || p.hazards || []),
      ppe: typeof p.PPE === 'string' ? JSON.parse(p.PPE) : (p.PPE || p.ppe || []),
      steps: typeof p.Steps === 'string' ? JSON.parse(p.Steps) : (p.Steps || p.steps || []),
      author: p.Author || p.author || '',
      createdAt: p.CreatedAt || p.createdAt || ''
    }));
  }

  async fetchAuditLogs(): Promise<AuditLogEntry[]> { 
    const data = await this.get('fetchAuditLogs');
    return (data || []).map((l: any) => ({
      id: String(l.ID),
      timestamp: l.Timestamp,
      user: l.User,
      action: l.Action,
      details: l.Details
    }));
  }

  async insertReport(report: WeeklyReport) { return this.post('insert', report); }
  async updateReport(report: WeeklyReport) { return this.post('update', report); }
  async deleteReport(id: string) { return this.post('delete', { id }); }
  async restoreReport(id: string) { return this.post('restore', { id }); }

  async insertPTP(ptp: PreTaskPlan) { return this.post('insertPTP', ptp); }
  async updatePTP(ptp: PreTaskPlan) { return this.post('updatePTP', ptp); }
  async deletePTP(id: string) { return this.post('deletePTP', { id }); }
  async restorePTP(id: string) { return this.post('restorePTP', { id }); }

  async insertAuditLog(entry: AuditLogEntry) { return this.post('insertAuditLog', entry); }

  async upsertForeman(foreman: Foreman) { return this.post('upsertForeman', foreman); }
  async deleteForeman(name: string) { return this.post('deleteForeman', { name }); }
}
