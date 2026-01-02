import { useEffect, useMemo, useState } from 'react';
import { SalesReportItem } from '@shared/types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

export function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sales, setSales] = useState<SalesReportItem[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);

  const load = async () => {
    const filters = { from: from || undefined, to: to || undefined };
    const [earn, list] = await Promise.all([
      window.api.reports.earnings(filters),
      window.api.reports.salesByProduct(filters)
    ]);
    setEarnings(earn.total);
    setSales(list);
    const unitsSum = list.reduce((acc, s) => acc + s.units, 0);
    setTotalUnits(unitsSum);
  };

  useEffect(() => {
    load();
  }, []);

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTo(end.toISOString().slice(0, 10));
    setFrom(start.toISOString().slice(0, 10));
  };

  const exportCsv = () => {
    const csv = Papa.unparse(
      sales.map((s) => ({
        Product: s.title,
        Units: s.units,
        Revenue: s.revenue
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 10, 10);
    doc.text(`Total Earnings: ${earnings.toFixed(2)}`, 10, 20);
    doc.text(`Total Units Sold: ${totalUnits}`, 10, 28);
    let y = 40;
    sales.forEach((s) => {
      doc.text(`${s.title} | Units: ${s.units} | Revenue: ${s.revenue.toFixed(2)}`, 10, y);
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('sales-report.pdf');
  };

  const topSellers = useMemo(() => [...sales].sort((a, b) => b.units - a.units).slice(0, 5), [sales]);
  const topRevenue = useMemo(() => [...sales].sort((a, b) => b.revenue - a.revenue).slice(0, 5), [sales]);

  return (
    <div className="card">
      <h3>Reports</h3>
      <div className="flex" style={{ marginTop: 10 }}>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn" onClick={load}>
          Refresh
        </button>
        <button className="btn" type="button" onClick={() => setPreset(7)}>
          Last 7d
        </button>
        <button className="btn" type="button" onClick={() => setPreset(30)}>
          Last 30d
        </button>
        <button className="btn" type="button" onClick={() => setPreset(90)}>
          Last 90d
        </button>
      </div>
      <div style={{ marginTop: 12, fontSize: 18 }}>Total Earnings: ₹ {earnings.toFixed(2)}</div>
      <div style={{ marginTop: 4 }}>Total Units Sold: {totalUnits}</div>
      <div className="flex" style={{ marginTop: 8 }}>
        <button className="btn" type="button" onClick={exportCsv}>
          Export CSV
        </button>
        <button className="btn" type="button" onClick={exportPdf}>
          Export PDF
        </button>
      </div>
      <div className="grid two" style={{ marginTop: 12 }}>
        <div className="card" style={{ background: '#fff', color: '#000', border: '1px solid #dcdcdc' }}>
          <h4>Top Sellers (Units)</h4>
          {topSellers.map((s) => (
            <div key={s.productId} className="flex justify-between" style={{ marginTop: 6 }}>
              <span>{s.title}</span>
              <span>{s.units} units</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ background: '#fff', color: '#000', border: '1px solid #dcdcdc' }}>
          <h4>Top Revenue</h4>
          {topRevenue.map((s) => (
            <div key={s.productId} className="flex justify-between" style={{ marginTop: 6 }}>
              <span>{s.title}</span>
              <span>₹ {s.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      <table style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Units</th>
            <th>Revenue</th>
            <th>Share of Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.productId}>
              <td>{s.title}</td>
              <td>{s.units}</td>
              <td>₹ {s.revenue.toFixed(2)}</td>
              <td>{earnings > 0 ? ((s.revenue / earnings) * 100).toFixed(1) : '0'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

