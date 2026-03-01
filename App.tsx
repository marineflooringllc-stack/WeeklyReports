import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Ship, 
  RefreshCw,
  Trash2,
  Menu,
  X as CloseIcon,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  CheckCircle,
  History,
  Lock,
  EyeOff
} from 'lucide-react';
import { WeeklyReport, ViewMode, Foreman, PreTaskPlan, EditLogEntry, AuditLogEntry } from './types';
import Dashboard from './Dashboard';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import ReportDetail from './ReportDetail';
import ForemanHub from './ForemanHub';
import PTPList from './PTPList';
import PTPForm from './PTPForm';
import PTPDetail from './PTPDetail';
import PTPBulkPrint from './PTPBulkPrint';
import AuditLogView from './AuditLogView';
import SettingsView from './SettingsView';
import { SheetService } from '@/services/sheetService';
import { GeminiService } from '@/services/geminiService';

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8W_RzH1ktZ0xQIakbNww6RP23PiRl-X577_Eou7m7vRlrlWeUwlTnjgXIBksr8TIoEw/exec';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [ptps, setPtps] = useState<PreTaskPlan[]>([]);
  const [deletedReports, setDeletedReports] = useState<WeeklyReport[]>([]);
  const [deletedPtps, setDeletedPtps] = useState<PreTaskPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [foremen, setForemen] = useState<Foreman[]>([]);
  
  const [pendingArchiveIds, setPendingArchiveIds] = useState<Set<string>>(new Set());
  const [pendingRestoreIds, setPendingRestoreIds] = useState<Set<string>>(new Set());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('active_foreman'));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', pin: '' });
  const [loginError, setLoginError] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const scriptUrl = useMemo(() => {
    const stored = localStorage.getItem('marine_flooring_script_url');
    if (stored && stored.startsWith('https://script.google.com')) return stored;
    return DEFAULT_APPS_SCRIPT_URL;
  }, []);
  const isAuthorized = !!currentUser;
  
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ ...toast, visible: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const loadData = async () => {
    if (!scriptUrl || scriptUrl === '') {
      console.warn("No script URL configured");
      return;
    }
    setIsSyncing(true);
    try {
      const service = new SheetService(scriptUrl);
      const [remoteReports, remoteDeleted, remoteForemen, remotePTPs, remoteDeletedPTPs, remoteAudit] = await Promise.all([
        service.fetchReports(),
        service.fetchDeletedReports(),
        service.fetchForemen(),
        service.fetchPTPs(),
        service.fetchDeletedPTPs(),
        service.fetchAuditLogs()
      ]);
      
      if (remoteReports) setReports(remoteReports);
      if (remoteDeleted) setDeletedReports(remoteDeleted);
      if (remoteForemen) setForemen(remoteForemen);
      if (remotePTPs) setPtps(remotePTPs);
      if (remoteDeletedPTPs) setDeletedPtps(remoteDeletedPTPs);
      if (remoteAudit) setAuditLogs(remoteAudit);

      setPendingArchiveIds(new Set());
      setPendingRestoreIds(new Set());
    } catch (err) {
      console.error("Sync failed", err);
      setToast({ message: "Sync failed: Please check your Google Script connection", visible: true });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, [scriptUrl]);

  const logAuditAction = async (action: string, details: string, overrideUser?: string) => {
    const userToLog = overrideUser || currentUser;
    if (!userToLog) return;
    
    const entry: AuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: userToLog,
      action,
      details
    };
    const service = new SheetService(scriptUrl);
    await service.insertAuditLog(entry);
    setAuditLogs(prev => [entry, ...prev]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardcoded fallback for first-time setup
    if (loginForm.name === 'Admin' && loginForm.pin === '1234') {
      setCurrentUser('Admin');
      localStorage.setItem('active_foreman', 'Admin');
      setShowLoginModal(false);
      setLoginForm({ name: '', pin: '' });
      setLoginError(false);
      logAuditAction('Foreman Login', `Identity: Admin`, 'Admin');
      return;
    }

    const user = (foremen || []).find(f => f.name === loginForm.name);
    if (user && user.pin === loginForm.pin) {
      setCurrentUser(user.name);
      localStorage.setItem('active_foreman', user.name);
      setShowLoginModal(false);
      setLoginForm({ name: '', pin: '' });
      setLoginError(false);
      logAuditAction('Foreman Login', `Identity: ${user.name}`, user.name);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logAuditAction('Foreman Logout', `Identity: ${currentUser}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('active_foreman');
    setView('dashboard');
  };

  const navigate = (v: ViewMode) => {
    if (!isAuthorized && !['dashboard', 'list'].includes(v)) {
      setShowLoginModal(true);
      return;
    }
    setView(v);
    setSelectedId(null);
    setSelectedBulkIds([]);
    setIsSidebarOpen(false);
  };

  const handleAddReport = async (report: WeeklyReport) => {
    if (!isAuthorized) return;
    const author = report.author || currentUser || 'Admin';
    const timestamp = new Date().toISOString();
    const historyEntry: EditLogEntry = { user: author, timestamp, action: 'created' };
    const compNames = (report.compartments || []).map(c => c.name).join(', ') || 'No Units';
    
    const finalReport: WeeklyReport = { 
      ...report, 
      author, 
      lastEditor: author, 
      updatedAt: timestamp,
      editLog: [historyEntry]
    };

    setIsSyncing(true);
    setReports(prev => [finalReport, ...prev]);
    const service = new SheetService(scriptUrl);
    await service.insertReport(finalReport);
    logAuditAction('Create Report', `Vessel: ${finalReport.vessel} | Compartments: ${compNames}`);
    setTimeout(() => loadData(), 3000);
    setView('list');
  };

  const handleUpdateReport = async (updatedReport: WeeklyReport) => {
    if (!isAuthorized) return;
    const targetId = String(updatedReport.id);
    const existing = reports.find(r => String(r.id) === targetId);
    const timestamp = new Date().toISOString();
    const editor = currentUser || 'Admin';
    
    const changes = [];
    const vesselOld = existing?.vessel || 'Unknown';
    const vesselNew = updatedReport.vessel || 'Unknown';
    const vesselDiff = vesselOld !== vesselNew ? `${vesselOld} → ${vesselNew}` : vesselOld;
    
    (updatedReport.compartments || []).forEach(newComp => {
      const oldComp = (existing?.compartments || []).find(c => c.id === newComp.id || c.name === newComp.name);
      if (!oldComp) {
        changes.push(`Added Comp: ${newComp.name}`);
      } else {
        const compChanges = [];
        if (oldComp.sqft !== newComp.sqft) compChanges.push(`SqFt: ${oldComp.sqft}→${newComp.sqft}`);
        if (oldComp.installer !== newComp.installer) compChanges.push(`Lead: ${oldComp.installer || 'None'}→${newComp.installer}`);
        if (oldComp.type !== newComp.type) compChanges.push(`Type: ${oldComp.type || 'None'}→${newComp.type}`);
        
        const oldPhaseSummary = oldComp.phases?.map(p => p.description).join(', ') || 'None';
        const newPhaseSummary = newComp.phases?.map(p => p.description).join(', ') || 'None';
        
        if (oldPhaseSummary !== newPhaseSummary) {
          compChanges.push(`Phases: ${oldComp.phases?.length || 0}→${newComp.phases?.length || 0} (Before: ${oldPhaseSummary} | After: ${newPhaseSummary})`);
        } else if (oldComp.phases?.length !== newComp.phases?.length) {
          compChanges.push(`Phase Count: ${oldComp.phases?.length || 0}→${newComp.phases?.length || 0}`);
        }
        
        if (compChanges.length > 0) {
          changes.push(`${newComp.name} [${compChanges.join('; ')}]`);
        }
      }
    });

    (existing?.compartments || []).forEach(oldComp => {
      if (!(updatedReport.compartments || []).find(c => c.id === oldComp.id || c.name === oldComp.name)) {
        changes.push(`Removed Comp: ${oldComp.name}`);
      }
    });

    const diffString = changes.length > 0 ? changes.join(' || ') : 'Metadata update';

    const history = existing && existing.editLog ? [...existing.editLog] : [];
    if (history.length === 0) {
      history.push({ user: existing?.author || 'System', timestamp: existing?.createdAt || timestamp, action: 'created' });
    }
    history.push({ user: editor, timestamp, action: 'edited' });

    const finalReport: WeeklyReport = { 
      ...updatedReport, 
      lastEditor: editor, 
      updatedAt: timestamp,
      editLog: history
    };

    setIsSyncing(true);
    setReports(prev => prev.map(r => String(r.id) === targetId ? finalReport : r));
    const service = new SheetService(scriptUrl);
    await service.updateReport(finalReport);
    
    logAuditAction('Update Report', `VESSEL: ${vesselDiff} | Details: ${diffString}`);
    
    setTimeout(() => loadData(), 3000);
    setView('list');
  };

  const handleArchiveReport = async (id: string) => {
    if (!isAuthorized) return;
    const originalId = String(id);
    const report = reports.find(r => String(r.id) === originalId);
    if (!report) {
      setToast({ message: `Error: Report ${originalId} not found`, visible: true });
      return;
    }
    
    const compNames = (report.compartments || []).map(c => c.name).join(', ') || 'Unknown Units';
    
    setIsSyncing(true);
    setToast({ message: 'Moving to trash...', visible: true });
    setReports(prev => prev.filter(r => String(r.id) !== originalId));
    setDeletedReports(prev => [report, ...prev]);

    const service = new SheetService(scriptUrl);
    try {
      const success = await service.deleteReport(originalId);
      if (success) {
        setToast({ message: 'Report moved to trash', visible: true });
        logAuditAction('Delete Report', `Vessel: ${report.vessel} | Compartments: ${compNames}`);
      }
      setTimeout(() => loadData(), 3000);
    } catch (err) { 
      console.error("Delete failed", err);
      setToast({ message: `Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`, visible: true });
      loadData(); 
    }
  };

  const handleRestoreReport = async (id: string) => {
    if (!isAuthorized) return;
    const originalId = String(id);
    const report = deletedReports.find(r => String(r.id) === originalId);
    if (!report) return;

    const compNames = (report.compartments || []).map(c => c.name).join(', ') || 'Unknown Units';

    setIsSyncing(true);
    setDeletedReports(prev => prev.filter(r => String(r.id) !== originalId));
    setReports(prev => [report, ...prev]);

    const service = new SheetService(scriptUrl);
    try {
      await service.restoreReport(originalId);
      setToast({ message: 'Report restored to active list', visible: true });
      logAuditAction('Restore Report', `Vessel: ${report.vessel} | Compartments: ${compNames}`);
      setTimeout(() => loadData(), 3000);
    } catch (e) { 
      console.error("Restore failed", e);
      setToast({ message: `Restore failed: ${e instanceof Error ? e.message : 'Unknown error'}`, visible: true });
      loadData(); 
    }
  };

  const handleAddPTP = async (ptp: PreTaskPlan) => {
    if (!isAuthorized) return;
    const finalPTP = { ...ptp, author: currentUser || 'Admin', createdAt: new Date().toISOString() };
    setIsSyncing(true);
    setPtps(prev => [finalPTP, ...prev]);
    const service = new SheetService(scriptUrl);
    await service.insertPTP(finalPTP);
    logAuditAction('Create PTP', `Location: ${finalPTP.location}, ID: ${finalPTP.id}`);
    setTimeout(() => loadData(), 3000);
    setView('ptp_list');
  };

  const handleUpdatePTP = async (ptp: PreTaskPlan) => {
    if (!isAuthorized) return;
    const finalPTP = { ...ptp, updatedAt: new Date().toISOString() };
    setIsSyncing(true);
    setPtps(prev => prev.map(p => String(p.id) === String(ptp.id) ? finalPTP : p));
    const service = new SheetService(scriptUrl);
    await service.updatePTP(finalPTP);
    logAuditAction('Update PTP', `Location: ${finalPTP.location}, ID: ${finalPTP.id}`);
    setTimeout(() => loadData(), 3000);
    setView('ptp_list');
  };

  const handleDeletePTP = async (id: string) => {
    if (!isAuthorized) return;
    const sId = String(id);
    const ptp = ptps.find(p => String(p.id) === sId);
    setIsSyncing(true);
    setPtps(prev => prev.filter(p => String(p.id) !== sId));
    const service = new SheetService(scriptUrl);
    try {
      const success = await service.deletePTP(sId);
      if (success) {
        setToast({ message: 'Safety Plan moved to trash', visible: true });
        logAuditAction('Delete PTP', `Location: ${ptp?.location}, ID: ${sId}`);
      }
      setTimeout(() => loadData(), 3000);
    } catch (e) { 
      console.error("Delete PTP failed", e);
      setToast({ message: `Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`, visible: true });
      loadData(); 
    }
  };

  const handleRestorePTP = async (id: string) => {
    if (!isAuthorized) return;
    const sId = String(id);
    const ptp = deletedPtps.find(p => String(p.id) === sId);
    setIsSyncing(true);
    setDeletedPtps(prev => prev.filter(p => String(p.id) !== sId));
    const service = new SheetService(scriptUrl);
    try {
      await service.restorePTP(sId);
      setToast({ message: 'Safety Plan restored', visible: true });
      logAuditAction('Restore PTP', `Location: ${ptp?.location}, ID: ${sId}`);
      setTimeout(() => loadData(), 3000);
    } catch (e) { 
      console.error("Restore PTP failed", e);
      setToast({ message: `Restore failed: ${e instanceof Error ? e.message : 'Unknown error'}`, visible: true });
      loadData(); 
    }
  };

  const handleBulkPrintPTPs = (ids: string[]) => {
    setSelectedBulkIds(ids.map(id => String(id)));
    setView('ptp_bulk_print');
    logAuditAction('Bulk Print PTP', `Count: ${ids.length}`);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {toast.visible && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
            <div className="bg-emerald-500 rounded-full p-1"><CheckCircle className="w-4 h-4 text-white" /></div>
            <span className="text-sm font-black uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black">Foreman Login</h3>
              <button onClick={() => setShowLoginModal(false)} className="p-2 text-slate-300 hover:text-slate-900"><CloseIcon /></button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Identify Yourself</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                  value={loginForm.name} 
                  onChange={e => setLoginForm({...loginForm, name: e.target.value})} 
                  required
                >
                  <option key="default-foreman" value="">Select Foreman</option>
                  {!(foremen || []).find(f => f.name === 'Admin') && <option key="admin-fallback" value="Admin">Admin (Default)</option>}
                  {(foremen || []).map((f, idx) => <option key={`${f.name}-${idx}`} value={f.name}>{f.name}</option>)}
                </select>
                {(foremen || []).length === 0 && (
                  <p className="text-[9px] text-slate-400 mt-2 italic px-1">
                    No crew members found. Use <b>Admin</b> (PIN: 1234) for setup.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Terminal PIN</label>
                <input 
                  type="password" 
                  placeholder="••••" 
                  maxLength={4} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-blue-500 transition-all" 
                  value={loginForm.pin} 
                  onChange={e => setLoginForm({...loginForm, pin: e.target.value.replace(/\D/g, '')})} 
                  required 
                />
              </div>
              {loginError && <p className="text-red-500 text-xs font-bold text-center animate-pulse">Invalid foreman identity or PIN.</p>}
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all mt-4">
                Sign In to Terminal
              </button>
            </form>
           </div>
        </div>
      )}

      {isAuthorized && (
        <aside className={`w-72 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3"><Ship className="w-6 h-6 text-blue-500" /><span className="font-bold uppercase tracking-tight text-white">MarineFlooring</span></div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white"><CloseIcon /></button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            <SidebarBtn active={view === 'dashboard'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate('dashboard')} />
            <SidebarBtn active={view === 'list' || view === 'detail' || view === 'edit' || view === 'add'} icon={<FileText />} label="Weekly Reports" onClick={() => navigate('list')} />
            <SidebarBtn active={view === 'ptp_list' || view === 'ptp_add' || view === 'ptp_edit' || view === 'ptp_detail'} icon={<ShieldAlert />} label="Safety (PTP)" onClick={() => navigate('ptp_list')} />
            <SidebarBtn active={view === 'management'} icon={<ShieldCheck />} label="Foreman Hub" onClick={() => navigate('management')} />
            <SidebarBtn active={view === 'audit_log'} icon={<History />} label="Audit Log" onClick={() => navigate('audit_log')} />
            
            <div className="pt-4 mt-4 border-t border-slate-800/50">
              <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Inventory Trash</p>
              <SidebarBtn active={view === 'deleted'} icon={<Trash2 />} label="Deleted Reports" onClick={() => navigate('deleted')} color="red" />
              <SidebarBtn active={view === 'ptp_deleted'} icon={<Trash2 />} label="Deleted Safety (PTP)" onClick={() => navigate('ptp_deleted')} color="red" />
            </div>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">{currentUser?.charAt(0)}</div>
              <div className="truncate text-left text-xs"><p className="font-bold">{currentUser}</p><p className="text-slate-500">Sign Out</p></div>
            </button>
          </div>
        </aside>
      )}

      <main className={`flex-1 ${isAuthorized ? 'lg:ml-72' : ''} p-4 lg:p-8 min-w-0 relative flex flex-col bg-slate-50 min-h-screen`}>
        <header className="flex flex-col items-center mb-10 gap-4 z-30 relative">
          <div className="flex items-center gap-3">
            {isAuthorized && <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white rounded-lg shadow-sm border absolute left-0 top-0"><Menu /></button>}
            <h1 className="text-xl font-bold text-slate-600 tracking-tight">
              Marine Flooring LLC - Report Manager
            </h1>
          </div>
          
          <div className="absolute right-0 top-0 flex items-center gap-3">
            {!isAuthorized && (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
            <button onClick={loadData} className={`p-2 bg-white rounded-xl border shadow-sm hover:bg-slate-50 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </header>

        <div className={`flex-1 relative transition-all duration-700 ${!isAuthorized ? 'blur-md pointer-events-none select-none overflow-hidden h-[60vh]' : ''}`}>
          <div className="animate-in fade-in duration-500">
            {view === 'dashboard' && <Dashboard reports={reports} />}
            {view === 'list' && <ReportList reports={reports} canManage={isAuthorized} onAdd={() => navigate('add')} onDelete={handleArchiveReport} onEdit={(id) => { setSelectedId(String(id)); setView('edit'); }} onView={(id) => { setSelectedId(String(id)); setView('detail'); }} />}
            {view === 'ptp_list' && <PTPList ptps={ptps} onAdd={() => navigate('ptp_add')} onEdit={(id) => { setSelectedId(String(id)); setView('ptp_edit'); }} onView={(id) => { setSelectedId(String(id)); setView('ptp_detail'); }} onDelete={handleDeletePTP} onBulkPrint={handleBulkPrintPTPs} />}
            {view === 'ptp_deleted' && <PTPList ptps={deletedPtps} isTrashView={true} onView={(id) => { setSelectedId(String(id)); setView('ptp_detail'); }} onRestore={handleRestorePTP} onAdd={()=>{}} onEdit={()=>{}} onDelete={()=>{}} onBulkPrint={()=>{}} />}
            {view === 'ptp_add' && <PTPForm onSubmit={handleAddPTP} onCancel={() => setView('ptp_list')} />}
            {view === 'ptp_edit' && selectedId && ptps.find(p => String(p.id) === String(selectedId)) && (
              <PTPForm initialData={ptps.find(p => String(p.id) === String(selectedId))} onSubmit={handleUpdatePTP} onCancel={() => setView('ptp_list')} />
            )}
            {view === 'ptp_detail' && selectedId && (ptps.find(p => String(p.id) === String(selectedId)) || deletedPtps.find(p => String(p.id) === String(selectedId))) && (
              <PTPDetail ptp={(ptps.find(p => String(p.id) === String(selectedId)) || deletedPtps.find(p => String(p.id) === String(selectedId)))!} onBack={() => setView(deletedPtps.find(p => String(p.id) === String(selectedId)) ? 'ptp_deleted' : 'ptp_list')} />
            )}
            {view === 'ptp_bulk_print' && <PTPBulkPrint ptps={ptps.filter(p => selectedBulkIds.includes(String(p.id)))} onBack={() => setView('ptp_list')} />}
            {view === 'add' && <ReportForm currentUser={currentUser || undefined} onSubmit={handleAddReport} onCancel={() => setView('list')} />}
            {view === 'edit' && selectedId && reports.find(r => String(r.id) === String(selectedId)) && (
              <ReportForm currentUser={currentUser || undefined} initialData={reports.find(r => String(r.id) === String(selectedId))} onSubmit={handleUpdateReport} onCancel={() => setView('list')} />
            )}
            {view === 'detail' && selectedId && (reports.find(r => String(r.id) === String(selectedId)) || deletedReports.find(r => String(r.id) === String(selectedId))) && (
              <ReportDetail 
                report={(reports.find(r => String(r.id) === String(selectedId)) || deletedReports.find(r => String(r.id) === String(selectedId)))!} 
                isDeleted={deletedReports.some(r => String(r.id) === String(selectedId))} 
                canManage={isAuthorized} 
                onBack={() => setView(deletedReports.some(r => String(r.id) === String(selectedId)) ? 'deleted' : 'list')} 
                onEdit={(id) => { setSelectedId(String(id)); setView('edit'); }} 
                onRestore={handleRestoreReport}
                onDelete={handleArchiveReport}
              />
            )}
            {view === 'management' && <ForemanHub reports={reports} foremen={foremen} currentUser={currentUser!} scriptUrl={scriptUrl} onSync={loadData} />}
            {view === 'deleted' && <ReportList reports={deletedReports} isTrashView={true} canManage={isAuthorized} onAdd={() => {}} onDelete={() => {}} onRestore={handleRestoreReport} onView={(id) => { setSelectedId(String(id)); setView('detail'); }} />}
            {view === 'audit_log' && <AuditLogView logs={auditLogs} />}
          </div>
        </div>

        {!isAuthorized && (
          <div className="absolute inset-0 top-32 flex flex-col items-center justify-center z-20 px-6">
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/50 text-center max-w-md animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Terminal Locked</h2>
              <p className="text-slate-500 font-medium mb-8">Access to Marine Flooring production data and safety plans requires authorized foreman authentication.</p>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <LogIn className="w-6 h-6" /> Unlock Terminal
              </button>
              <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                <EyeOff className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Protected Environment</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SidebarBtn = ({ active, icon, label, onClick, color='blue' }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? (color==='red'?'bg-red-600 text-white shadow-lg shadow-red-900/40':'bg-blue-600 text-white shadow-lg shadow-blue-900/40') : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {React.cloneElement(icon, { className: 'w-5 h-5 shrink-0' })}
    <span className="font-bold text-sm truncate">{label}</span>
  </button>
);

export default App;