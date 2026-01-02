import { useEffect, useRef, useState } from 'react';

export function ScanAndSell() {
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;
    try {
      const result = await window.api.sales.scan(barcode);
      setStatus(`Sold ${result.units} of ${result.product.title}. On-hand: ${result.newOnHand}`);
    } catch (err: any) {
      if (err.message === 'UNKNOWN_BARCODE') {
        setStatus('Unknown barcode. Please assign.');
      } else if (err.message === 'INSUFFICIENT_STOCK') {
        const confirmOverride = window.confirm('Low/No stock. Override and continue sale?');
        if (confirmOverride) {
          const note = window.prompt('Enter override reason (optional):') || '';
          try {
            const result = await window.api.sales.scan(barcode, undefined, { force: true, note });
            setStatus(`Override sale. Sold ${result.units} of ${result.product.title}. On-hand: ${result.newOnHand}`);
          } catch (err2: any) {
            setStatus(err2?.message ?? 'Error processing override sale.');
          }
        } else {
          setStatus('Sale blocked due to low stock.');
        }
      } else {
        setStatus('Error processing sale.');
      }
    } finally {
      setBarcode('');
    }
  };

  return (
    <div className="card">
      <h3>Scan &amp; Sell</h3>
      <form onSubmit={handleScan} className="flex" style={{ marginTop: 12 }}>
        <input
          ref={inputRef}
          autoFocus
          className="input"
          placeholder="Focus here and scan barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <button className="btn" type="submit">
          Sell
        </button>
      </form>
      {status && <div style={{ marginTop: 10 }}>{status}</div>}
    </div>
  );
}

