import { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';

interface Summary {
  total: number;
}

export function Dashboard() {
  const { refreshAll, inventory } = useAppStore();
  const [summary, setSummary] = useState<Summary>({ total: 0 });

  useEffect(() => {
    refreshAll();
    window.api.reports.earnings({}).then(setSummary);
  }, [refreshAll]);

  const lowStock = inventory.filter((i) => i.onHand <= 5);

  return (
    <div className="grid two">
      <div className="card">
        <h3>Today / Period Earnings</h3>
        <p style={{ fontSize: 28, margin: 0 }}>₹ {summary.total.toFixed(2)}</p>
      </div>
      <div className="card">
        <h3>Low Stock</h3>
        {lowStock.length === 0 && <div className="muted">All good.</div>}
        {lowStock.slice(0, 5).map((item) => (
          <div key={item.product.id} className="flex justify-between" style={{ marginTop: 6 }}>
            <div>{item.product.title}</div>
            <span className="badge">{item.onHand} left</span>
          </div>
        ))}
      </div>
    </div>
  );
}

