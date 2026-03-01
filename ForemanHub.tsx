
import React, { useState } from 'react';
import { Key, Save, ShieldCheck, RefreshCw, Users, UserPlus, Trash2, Lock, UserCheck, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { WeeklyReport, Foreman } from './types';
import { SheetService } from './services/sheetService';

interface Props { reports: WeeklyReport[]; foremen: Foreman[]; currentUser: string; scriptUrl: string; onSync: () => void; }

const ForemanHub: React.FC<Props> = ({ reports, foremen, currentUser, scriptUrl, onSync }) => {
  const [newPin, setNewPin] = useState('');
  const [scriptUrlInput, setScriptUrlInput] = useState(scriptUrl);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', pin: '' });
  const [status, setStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const isAdmin = currentUser === 'Admin';
  const service = new SheetService(scriptUrl);

  const handleUpdateUrl = () => {
    localStorage.setItem('marine_flooring_script_url', scriptUrlInput);
    setStatus('Script URL updated. Refreshing...');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleUpdateMyPin = async () => {
    if (newPin.length === 4) {
      setIsUpdating(true);
      try {
        const success = await service.upsertForeman({ name: currentUser, pin: newPin });
        if (success) { setStatus('PIN updated.'); setNewPin(''); onSync(); }
      } catch (e) { setStatus('Error updating PIN.'); } finally { setIsUpdating(false); setTimeout(() => setStatus(''), 3000); }
    }
  };

  const handleAddUser = async () => {
    if (!isAdmin) return;
    if (newUser.name && newUser.pin.length === 4) {
      setIsUpdating(true);
      try { await service.upsertForeman(newUser); setStatus(`Added ${newUser.name}.`); setNewUser({ name: '', pin: '' }); setAddingUser(false); onSync(); } catch (e) { setStatus('Failed.'); } finally { setIsUpdating(false); setTimeout(() => setStatus(''), 3000); }
    }
  };

  const handleDeleteUser = async (name: string) => {
    if (!isAdmin || name === 'Admin') return;
    if (confirm(`Remove ${name}?`)) {
      setIsUpdating(true);
      try { await service.deleteForeman(name); onSync(); } catch (e) { setStatus('Failed.'); } finally { setIsUpdating(false); }
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <div className="flex items-center gap-4 mb-8"><div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><Key className="w-6 h-6" /></div><div><h3 className="text-xl font-black">My Passcode</h3><p className="text-slate-500 text-xs">Update your terminal PIN</p></div></div>
          <input type="password" maxLength={4} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-2xl tracking-[0.5em] text-center font-bold mb-4" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
          <button onClick={handleUpdateMyPin} disabled={newPin.length !== 4 || isUpdating} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black disabled:opacity-50 flex items-center justify-center gap-2">{isUpdating ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}Update PIN</button>
          {status && <p className="text-center mt-2 text-xs font-bold text-blue-600">{status}</p>}
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <div className="flex items-center justify-between mb-8"><div className="flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Users className="w-6 h-6" /></div><h3 className="text-xl font-black">Crew Access</h3></div>{isAdmin && <button onClick={() => setAddingUser(true)} className="p-2 bg-slate-900 text-white rounded-xl"><UserPlus className="w-5 h-5" /></button>}</div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
            {(foremen || []).map((f, idx) => (
              <div key={`${f.name}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${f.name === currentUser ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border'}`}>{f.name === currentUser ? <UserCheck className="w-4 h-4" /> : f.name.charAt(0)}</div><span className="font-bold text-sm">{f.name}</span></div>
                {isAdmin && f.name !== 'Admin' && <button onClick={() => handleDeleteUser(f.name)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
          {addingUser && isAdmin && (
            <div className="mt-4 p-4 border-2 border-dashed rounded-2xl space-y-3 bg-blue-50/30">
              <input placeholder="Full Name" className="w-full p-2 border rounded-xl text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input placeholder="4-digit PIN" maxLength={4} className="w-full p-2 border rounded-xl text-sm" value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value.replace(/\D/g, '')})} />
              <div className="flex gap-2"><button onClick={() => setAddingUser(false)} className="flex-1 py-2 text-xs font-bold">Cancel</button><button onClick={handleAddUser} disabled={isUpdating} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Authorize</button></div>
            </div>
          )}
          {!isAdmin && <div className="mt-6 p-3 bg-slate-50 rounded-xl border flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-slate-400" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin only management</p></div>}
        </div>
      </div>
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl"><div className="flex items-center gap-6"><ShieldCheck className="w-8 h-8 text-blue-400" /><div><h4 className="text-xl font-black">{isAdmin ? 'Admin Active' : 'Foreman Terminal'}</h4><p className="text-slate-400 text-sm">{isAdmin ? 'Full privileges.' : 'Lead access for ' + currentUser + '.'}</p></div></div><button onClick={onSync} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 flex items-center gap-2 shadow-lg"><RefreshCw className="w-5 h-5" />Sync</button></div>
    </div>
  );
};
export default ForemanHub;
