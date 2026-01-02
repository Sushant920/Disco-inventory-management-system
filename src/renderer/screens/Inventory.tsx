import { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';

export function Inventory() {
  const { inventory, refreshAll } = useAppStore();
  const [productId, setProductId] = useState('');
  const [units, setUnits] = useState(1);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || units <= 0) return;
    await window.api.inventory.add(productId, units, 'intake');
    await refreshAll();
    setUnits(1);
    setProductId('');
  };

  return (
    <div className="card">
      <h3>Inventory</h3>
      <form onSubmit={addStock} className="flex" style={{ marginTop: 10 }}>
        <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Select product</option>
          {inventory.map((item) => (
            <option key={item.product.id} value={item.product.id}>
              {item.product.title} ({item.onHand} on hand)
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min={1}
          value={units}
          onChange={(e) => setUnits(parseInt(e.target.value, 10))}
        />
        <button className="btn" type="submit">
          Add Stock
        </button>
      </form>

      <table style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Volume</th>
            <th>Category</th>
            <th>On hand</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.product.id}>
              <td>{item.product.title}</td>
              <td>
                {item.product.volume}
                {item.product.volumeUnit}
              </td>
              <td>{item.product.category}</td>
              <td>{item.onHand}</td>
              <td>₹ {item.product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

