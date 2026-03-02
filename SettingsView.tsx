import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [url, setUrl] = useState(localStorage.getItem('marine_flooring_script_url') || '');

  const handleSave = () => {
    localStorage.setItem('marine_flooring_script_url', url);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border">
        <h2 className="text-2xl font-black mb-6">System Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Google Apps Script URL</label>
            <input 
              type="text" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="https://script.google.com/macros/s/..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
          >
            <Save size={20} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
