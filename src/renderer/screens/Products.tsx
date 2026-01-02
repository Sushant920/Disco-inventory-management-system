import { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';
import { Product } from '@shared/types';

export function Products() {
  const { products, refreshAll } = useAppStore();
  const [form, setForm] = useState({
    title: '',
    volume: 750,
    volumeUnit: 'ml',
    category: 'wine',
    price: 0
  });
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, barcodes: barcode ? [{ code: barcode, type: 'custom' }] : [] };
    await window.api.products.create(payload);
    await refreshAll();
    setForm({ title: '', volume: 750, volumeUnit: 'ml', category: 'wine', price: 0 });
    setBarcode('');
  };

  return (
    <div className="card">
      <h3>Products</h3>
      <form onSubmit={saveProduct} className="grid two" style={{ marginTop: 10 }}>
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="flex">
          <input
            className="input"
            type="number"
            value={form.volume}
            onChange={(e) => setForm({ ...form, volume: parseInt(e.target.value, 10) })}
          />
          <select className="select" value={form.volumeUnit} onChange={(e) => setForm({ ...form, volumeUnit: e.target.value })}>
            <option value="ml">ml</option>
            <option value="l">l</option>
          </select>
        </div>
        <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="wine">Wine</option>
          <option value="beer">Beer</option>
          <option value="spirits">Spirits</option>
          <option value="non-liquor">Non-liquor</option>
          <option value="misc">Misc</option>
        </select>
        <input
          className="input"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
        />
        <input className="input" placeholder="Barcode (optional)" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        <button className="btn" type="submit">
          Save Product
        </button>
      </form>

      <table style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Volume</th>
            <th>Category</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p: Product) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>
                {p.volume}
                {p.volumeUnit}
              </td>
              <td>{p.category}</td>
              <td>₹ {p.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

