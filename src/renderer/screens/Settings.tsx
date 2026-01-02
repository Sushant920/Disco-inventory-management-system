import { useEffect, useState } from 'react';
import { Settings as SettingsType } from '@shared/types';

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [backupPath, setBackupPath] = useState('');
  const [restorePath, setRestorePath] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await window.api.settings.get();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setMsg(null);
    await window.api.settings.update({
      scanDefaultQty: settings.scanDefaultQty,
      lowStockThreshold: settings.lowStockThreshold,
      currency: settings.currency
    });
    setMsg('Settings saved');
  };

  const runBackup = async () => {
    setMsg(null);
    const file = await window.api.backup.run(backupPath || undefined);
    setMsg(`Backup saved: ${file}`);
  };

  const runRestore = async () => {
    if (!restorePath) {
      setMsg('Select a file to restore');
      return;
    }
    await window.api.backup.restore(restorePath);
    await load();
    setMsg('Restore complete');
  };

  if (loading || !settings) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h3>Settings</h3>
      <form className="grid two" style={{ marginTop: 12 }} onSubmit={save}>
        <label className="flex">
          <span style={{ width: 160 }}>Scan default qty</span>
          <input
            className="input"
            type="number"
            min={1}
            value={settings.scanDefaultQty}
            onChange={(e) => setSettings({ ...settings, scanDefaultQty: parseInt(e.target.value, 10) })}
          />
        </label>
        <label className="flex">
          <span style={{ width: 160 }}>Low stock threshold</span>
          <input
            className="input"
            type="number"
            min={1}
            value={settings.lowStockThreshold}
            onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value, 10) })}
          />
        </label>
        <label className="flex">
          <span style={{ width: 160 }}>Currency</span>
          <input
            className="input"
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          />
        </label>
        <div />
        <button className="btn" type="submit">
          Save
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        <h4>Backup &amp; Restore</h4>
        <div className="flex" style={{ marginTop: 8 }}>
          <input
            className="input"
            placeholder="Backup to path (optional)"
            value={backupPath}
            onChange={(e) => setBackupPath(e.target.value)}
          />
          <button className="btn" type="button" onClick={runBackup}>
            Backup Now
          </button>
        </div>
        <div className="flex" style={{ marginTop: 8 }}>
          <input
            className="input"
            placeholder="Path to backup file"
            value={restorePath}
            onChange={(e) => setRestorePath(e.target.value)}
          />
          <button className="btn" type="button" onClick={runRestore}>
            Restore
          </button>
        </div>
      </div>

      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}

