# Disco Wine Shop Inventory Manager — Product Requirements Document (PRD)

## 1. Product Overview
- **Application**: Electron.js desktop app for managing wine shop inventory, sales, barcodes, and earnings; offline-first with local storage.
- **Primary Users**: Shop owner and staff (cashier / inventory clerk).
- **Problem Statement**: Manual logs and ad-hoc spreadsheets cause stock errors, slow billing, and lost revenue. Need a fast, offline desktop tool that works seamlessly with barcode scanners.
- **Purpose**: Provide an easy, reliable, scanner-friendly system to intake stock, sell quickly, track earnings, and report performance.
- **Goals**
  - Fast intake and sale flows with minimal clicks.
  - Accurate stock levels with real-time deduction on scan.
  - Clear earnings and sales visibility (daily/weekly/monthly).
  - Offline-first reliability on Windows.
- **Non-goals**
  - Cloud sync and multi-branch management (future).
  - Complex CRM/loyalty programs.
  - Mobile app.
- **High-level Workflow**
  1. Add/edit products with price, volume, barcode(s).
  2. Intake inventory: select product → enter units → stock increases.
  3. Sell by scanning barcode: product lookup → stock decreases → sale recorded → earnings updated.
  4. View inventory tables and earnings dashboards → export reports.
- **Why Electron.js**
  - Cross-platform UI with web tech, packaged for Windows.
  - Easy hardware integration (barcode as keyboard input).
  - Single codebase with Node.js backend and React renderer.

## 2. Core Features
### 2.1 Inventory Intake & Management
- Intake form: dropdown + live search (by brand/title/barcode).
- Input: brand name → bottle size (ML/L) → units.
- Action: “Add Stock” increases on-hand quantity; logs an inventory transaction.
- Inventory table: searchable, filterable (by category/liquor/non-liquor), sortable (brand, volume, stock, last updated).
- Real-time stock visualization: badges/thermometers and sparkline of recent movement.
- Validation: prevent negative stock; confirmation on large adjustments.

### 2.2 Dynamic Bottle Catalog
- Product fields: Title/Brand, Volume (ML/L), Category (wine/beer/spirits/non-liquor), Price per unit, Cost (optional), Barcode(s), SKU, Notes.
- Supports miscellaneous items (snacks, glasses, accessories).
- Add/edit/delete products anytime; audit timestamps.

### 2.3 Barcode Scanner Integration
- Scanner acts as keyboard input; listens in focused “Scan” field.
- On scan: barcode lookup → auto-select product → deduct default quantity 1 (configurable) → create sale record → update inventory + earnings.
- Graceful handling: unknown barcode prompts assignment; zero/low stock shows alert and optional override with reason.

### 2.4 Earnings Calculation & Sales Records
- Earnings = Σ(price per unit × units sold) per sale line.
- Real-time dashboard: today, week, month; top products; low-stock alerts.
- Reports: daily/weekly/monthly filters; export CSV/PDF.
- Revenue per product, gross margin (if cost provided).

### 2.5 Custom Barcode Support
- Generate/assign dummy barcodes for items lacking codes.
- Store multiple barcodes per product; treat equally for lookup.
- Optional barcode print/export list.

### 2.6 Desktop Application Requirements
- Platform: Windows (Electron packager).
- Offline-first; no internet required for core flows.
- Local DB: SQLite (preferred) via better-sqlite3; fallback to lowdb if needed.
- Performance: <200ms for scan-to-deduct; app idle memory target <300MB.

### 2.7 User Experience Requirements
- Clean, minimal UI with large buttons, high-contrast typography.
- Primary flows optimized for mouse + scanner; keyboard shortcuts for add stock (Ctrl+I), add product (Ctrl+N), scan (Ctrl+S).
- Confirmations for destructive edits; toasts for success.
- Inline validation errors; empty and loading states.

## 3. Technical Requirements
### 3.1 Architecture
- **Shell**: Electron main process handles window, IPC, file system, auto-launch.
- **Renderer**: React (or lightweight renderer) for UI; state via Redux/Zustand.
- **Backend (in-app)**: Node.js modules accessed via preload + IPC; encapsulate DB, reporting, barcode utilities.
- **Storage**: SQLite file stored under app data directory; backups to user-selected folder.
- **Scanner**: Treated as keyboard input; configurable prefix/suffix handling; debounce to detect scan vs manual typing.

### 3.2 Modules
- **Inventory Module**: Manage stock levels, transactions, low-stock alerts.
- **Product Catalog Module**: CRUD products, volumes, categories, barcodes.
- **Sales & Billing Module**: Scan-to-sale, manual sale entry, receipts (optional).
- **Barcode Module**: Listen/parse scans, map to product, generate custom codes.
- **Reporting Module**: Earnings, sales trends, exports.
- **Settings Module**: Defaults (scan quantity, low-stock threshold), data backup/restore, currency, printer settings (future).

### 3.3 Database Schema (SQLite)
**Products**
- id (PK, uuid)
- title (text)
- volume_ml (integer, nullable if volume_l used)
- volume_l (real, nullable)
- category (text; wine/beer/spirits/non-liquor)
- price (real, not null)
- cost (real, nullable)
- sku (text, unique nullable)
- default_barcode_id (text, FK to Barcodes.id, nullable)
- created_at (datetime), updated_at (datetime)
**Sample**: `Merlot Reserve`, 750ml, price 1200, barcode ABC123.

**Barcodes**
- id (PK, uuid)
- product_id (FK Products.id, cascade delete)
- code (text, unique)
- type (text; e.g., ean13/custom)
- created_at, updated_at

**InventoryTransactions**
- id (PK, uuid)
- product_id (FK)
- change (integer; positive for intake, negative for adjustment)
- reason (text; intake/sale/adjustment/return)
- reference_id (text; links to Sales.id when sale)
- created_at (datetime)

**Sales**
- id (PK, uuid)
- product_id (FK)
- units (integer, >0)
- unit_price (real)
- barcode_id (FK Barcodes.id, nullable)
- created_at (datetime)

**EarningsLog** (denormalized for dashboard speed)
- id (PK, uuid)
- sale_id (FK Sales.id)
- product_id (FK)
- amount (real) // units × unit_price
- created_at (datetime)

**Settings**
- id (PK, singleton row)
- currency (text)
- scan_default_qty (integer, default 1)
- low_stock_threshold (integer, default 5)
- data_path (text)
- backup_path (text, nullable)
- theme (text; light/dark)
- created_at, updated_at

### 3.4 Data Access Patterns
- Use prepared statements; wrap in repository layer.
- Transactions for scan-to-sale (barcode lookup → stock check → insert sale → inventory transaction → earnings log).
- Indexes: `Products(title, category)`, `Barcodes(code)`, `Sales(created_at)`.

### 3.5 IPC & Security
- Preload exposes safe APIs: `productAPI`, `inventoryAPI`, `salesAPI`, `settingsAPI`.
- Validate all renderer inputs; sanitize barcode strings.
- Restrict file system access to app data and configured backup path.
- Enable contextIsolation, disable nodeIntegration in renderer.

## 4. User Stories with Acceptance Criteria
- **Add new product**
  - Given user opens “Add Product” modal, when they enter title, volume, price, and barcode, then product saves and appears in catalog with confirmation toast.
- **Add inventory**
  - Given user selects a product and enters units, when they click “Add Stock”, then on-hand quantity increases and an inventory transaction is recorded.
- **Scan product to sell**
  - Given scan field is focused, when user scans a known barcode, then product is identified, stock decreases by default qty, sale and earnings log are created, and UI shows success with updated stock.
- **Deduct stock automatically**
  - Given stock is >0, when sale is recorded, inventory decreases accordingly; if resulting stock <0, transaction is blocked unless override is enabled with reason.
- **Add custom barcode**
  - Given product exists, when user enters a new code, then barcode is stored and usable immediately for scans.
- **View inventory**
  - Given user opens Inventory tab, table lists products with stock, sortable and filterable; low-stock items are highlighted.
- **View sales report**
  - Given date range is selected, report shows totals, per-product revenue, and export buttons; export downloads CSV/PDF.
- **Edit or delete items**
  - Edit: fields update and persist; history shows updated_at. Delete: requires confirmation; prevents delete if referenced in sales unless soft-delete; default is soft-delete (mark inactive).
- **Error cases**
  - Invalid/unknown barcode: prompt to create/assign product.
  - Zero/low stock: show alert, block sale unless override.
  - DB write failure: show error toast and do not change stock.

## 5. UX/UI Requirements
- **Navigation**: Left sidebar with sections: Dashboard, Scan & Sell, Inventory, Products, Reports, Settings.
- **Data Tables**: Sticky header, column sort, search box, pill filters (category, low stock), pagination or virtual scroll.
- **Modals**: Add/Edit Product, Add Stock, Assign Barcode; large inputs, barcode field auto-focus for scan.
- **Barcode UX**: Dedicated “Scan Mode” input with big focus ring; audible/visual feedback on success/error; debounce 50–100ms to group scan keystrokes.
- **Color Palette**: Modern minimal—Background #0F172A/white modes; Primary #7C3AED; Accent #22D3EE; Success #10B981; Danger #EF4444.
- **Typography**: Sans (Inter/Segoe UI); sizes 14–18 for body, 20–24 for headings.
- **Icons**: Simple line icons (Heroicons/Feather); clear affordances for add/edit/delete.
- **States**: Empty states with CTA; skeleton loaders for tables; toasts for actions; confirmation dialogs for destructive actions.

## 6. Non-functional Requirements
- **Reliability**: ACID via SQLite; crash-safe writes; auto-retry for transient errors.
- **Security**: Local-only data; file permissions aligned to user; IPC validation; no remote code execution.
- **Data Backup**: Manual and scheduled backup to chosen folder; restore flow with confirmation.
- **Error Logging**: Local log file (rotating); optional user-friendly error dialog with copyable stack.
- **Performance**: Scan-to-update <200ms; initial load <3s on mid-tier hardware; tables handle 50k rows with virtualization.
- **Scalability**: Single-machine scope; schema indexed for growth; future-ready for sync service.

## 7. Future Enhancements (Optional)
- GST/Tax handling per line item.
- Multi-user roles with audit logs.
- Cloud sync/remote backup.
- POS receipt printer integration.
- Supplier management and purchase orders.

## 8. Deliverables
- This PRD in `PRD.md`.
- **Diagrams (textual)**
  - Architecture: `[Barcode Scanner] -> [Renderer Scan Input] -> IPC -> [Main Process] -> [DB Layer(SQLite)] -> [Store] -> [Renderer UI/Dashboard]`
  - Scan Workflow: `Scan -> Lookup Barcode -> Validate Stock -> Create Sale + Inventory Txn -> Update EarningsLog -> Refresh UI`
  - DB Schema (relationships): `Products 1--n Barcodes`, `Products 1--n InventoryTransactions`, `Products 1--n Sales`, `Sales 1--1 EarningsLog`.
- **Wireframes (text description)**
  - Dashboard: cards (Today/Week/Month earnings), top products list, low-stock list.
  - Scan & Sell: large scan input at top, last scanned product card, quick totals, small table of recent scans.
  - Inventory: table with search/filter, “Add Stock” button top-right, low-stock badges.
  - Products: table with add/edit actions, barcode list per row.
  - Reports: date range picker, charts (bar/line), export buttons.
  - Settings: form for thresholds, backup path chooser, theme toggle, default scan quantity.
