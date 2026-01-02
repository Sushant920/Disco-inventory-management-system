import { contextBridge, ipcRenderer } from 'electron';

const api = {
  products: {
    list: () => ipcRenderer.invoke('products:list'),
    create: (payload: any) => ipcRenderer.invoke('products:create', payload),
    update: (id: string, patch: any) => ipcRenderer.invoke('products:update', id, patch),
    remove: (id: string) => ipcRenderer.invoke('products:delete', id),
    assignBarcode: (productId: string, code: string) => ipcRenderer.invoke('products:assign-barcode', productId, code),
    lookupBarcode: (code: string) => ipcRenderer.invoke('products:lookup-barcode', code)
  },
  inventory: {
    add: (productId: string, units: number, reason: 'intake' | 'adjustment' = 'intake') =>
      ipcRenderer.invoke('inventory:add', productId, units, reason),
    list: () => ipcRenderer.invoke('inventory:list')
  },
  sales: {
    scan: (code: string, units?: number, opts?: { force?: boolean; note?: string }) => ipcRenderer.invoke('sales:scan', code, units, opts),
    list: (from?: string, to?: string) => ipcRenderer.invoke('sales:list', from, to)
  },
  reports: {
    earnings: (filters: any) => ipcRenderer.invoke('reports:earnings', filters),
    salesByProduct: (filters: any) => ipcRenderer.invoke('reports:salesByProduct', filters)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: any) => ipcRenderer.invoke('settings:update', patch)
  },
  backup: {
    run: (targetPath?: string) => ipcRenderer.invoke('backup:run', targetPath),
    restore: (fromPath: string) => ipcRenderer.invoke('backup:restore', fromPath)
  }
};

contextBridge.exposeInMainWorld('api', api);

export type PreloadApi = typeof api;

