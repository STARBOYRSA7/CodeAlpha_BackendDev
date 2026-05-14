'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const PORT = process.env.PORT || 3002;

// ── Database ──────────────────────────────────────────
const adapter = new FileSync(path.join(__dirname, 'db/db.json'));
const db = low(adapter);
db.defaults({ menu: [], orders: [], tables: [], reservations: [], inventory: [] }).write();

// Seed data
if (!db.get('menu').value().length) {
  db.get('menu').push(
    { id: 'm1', name: 'Grilled Chicken Burger', category: 'Mains', price: 89, description: 'Flame-grilled chicken breast, brioche bun, lettuce, tomato, house mayo', available: true, prepTime: 15 },
    { id: 'm2', name: 'Margherita Pizza', category: 'Mains', price: 119, description: 'San Marzano tomato, fresh mozzarella, basil, extra virgin olive oil', available: true, prepTime: 20 },
    { id: 'm3', name: 'Beef Steak (300g)', category: 'Mains', price: 219, description: 'Grass-fed sirloin, chimichurri, seasonal veg, hand-cut chips', available: true, prepTime: 25 },
    { id: 'm4', name: 'Prawn Linguine', category: 'Mains', price: 159, description: 'Tiger prawns, garlic, chilli, white wine, cherry tomato, fresh parsley', available: true, prepTime: 20 },
    { id: 'm5', name: 'Caesar Salad', category: 'Starters', price: 69, description: 'Romaine, parmesan, croutons, classic caesar dressing', available: true, prepTime: 8 },
    { id: 'm6', name: 'Calamari', category: 'Starters', price: 79, description: 'Lightly battered, tartare sauce, lemon', available: true, prepTime: 10 },
    { id: 'm7', name: 'Garlic Bread', category: 'Starters', price: 39, description: 'Toasted baguette, garlic butter, fresh herbs', available: true, prepTime: 5 },
    { id: 'm8', name: 'Malva Pudding', category: 'Desserts', price: 59, description: 'Traditional SA dessert, warm custard, vanilla ice cream', available: true, prepTime: 10 },
    { id: 'm9', name: 'Cheesecake', category: 'Desserts', price: 65, description: 'New York style, berry coulis, whipped cream', available: true, prepTime: 5 },
    { id: 'm10', name: 'Coke / Fanta / Sprite', category: 'Drinks', price: 29, description: '330ml can', available: true, prepTime: 1 },
    { id: 'm11', name: 'Fresh Juice', category: 'Drinks', price: 45, description: 'Orange, apple or mango', available: true, prepTime: 3 },
    { id: 'm12', name: 'Sparkling Water', category: 'Drinks', price: 25, description: '500ml bottle', available: true, prepTime: 1 }
  ).write();
}

if (!db.get('tables').value().length) {
  for (let i = 1; i <= 10; i++) {
    db.get('tables').push({ id: 't' + i, number: i, capacity: i <= 4 ? 2 : i <= 7 ? 4 : 6, status: 'available' });
  }
  db.write();
}

if (!db.get('inventory').value().length) {
  db.get('inventory').push(
    { id: 'inv1', name: 'Chicken Breast', unit: 'kg', quantity: 15, minLevel: 5, cost: 89 },
    { id: 'inv2', name: 'Beef Sirloin', unit: 'kg', quantity: 8, minLevel: 4, cost: 245 },
    { id: 'inv3', name: 'Tiger Prawns', unit: 'kg', quantity: 4, minLevel: 2, cost: 320 },
    { id: 'inv4', name: 'Mozzarella', unit: 'kg', quantity: 6, minLevel: 2, cost: 180 },
    { id: 'inv5', name: 'Pizza Dough', unit: 'units', quantity: 24, minLevel: 8, cost: 12 },
    { id: 'inv6', name: 'Linguine Pasta', unit: 'kg', quantity: 10, minLevel: 3, cost: 45 },
    { id: 'inv7', name: 'Olive Oil', unit: 'L', quantity: 5, minLevel: 2, cost: 120 },
    { id: 'inv8', name: 'Garlic', unit: 'kg', quantity: 3, minLevel: 1, cost: 30 },
    { id: 'inv9', name: 'Soft Drinks (cans)', unit: 'units', quantity: 120, minLevel: 24, cost: 12 }
  ).write();
}

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MENU ──────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  let items = db.get('menu').value();
  if (category) items = items.filter(i => i.category === category);
  res.json(items);
});

app.post('/api/menu', (req, res) => {
  const { name, category, price, description, prepTime } = req.body;
  if (!name || !category || !price) return res.status(400).json({ error: 'name, category and price required.' });
  const item = { id: 'm' + Date.now(), name, category, price: parseFloat(price), description: description || '', available: true, prepTime: parseInt(prepTime) || 10 };
  db.get('menu').push(item).write();
  res.status(201).json(item);
});

app.patch('/api/menu/:id', (req, res) => {
  const item = db.get('menu').find({ id: req.params.id }).value();
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  db.get('menu').find({ id: req.params.id }).assign(req.body).write();
  res.json(db.get('menu').find({ id: req.params.id }).value());
});

app.delete('/api/menu/:id', (req, res) => {
  db.get('menu').remove({ id: req.params.id }).write();
  res.json({ message: 'Deleted.' });
});

// ── ORDERS ────────────────────────────────────────────
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let orders = db.get('orders').orderBy('createdAt', 'desc').value();
  if (status) orders = orders.filter(o => o.status === status);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { tableId, items, customerName } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Order must have at least one item.' });

  const menuItems = db.get('menu').value();
  const orderItems = items.map(i => {
    const mi = menuItems.find(m => m.id === i.menuItemId);
    if (!mi) throw new Error(`Menu item ${i.menuItemId} not found`);
    return { menuItemId: i.menuItemId, name: mi.name, quantity: i.quantity, unitPrice: mi.price, subtotal: mi.price * i.quantity };
  });

  const total = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const order = { id: 'o' + Date.now(), tableId: tableId || null, customerName: customerName || 'Walk-in', items: orderItems, total, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.get('orders').push(order).write();

  if (tableId) db.get('tables').find({ id: tableId }).assign({ status: 'occupied' }).write();

  res.status(201).json(order);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  db.get('orders').find({ id: req.params.id }).assign({ status, updatedAt: new Date().toISOString() }).write();
  if (status === 'served' && order.tableId) db.get('tables').find({ id: order.tableId }).assign({ status: 'available' }).write();
  res.json(db.get('orders').find({ id: req.params.id }).value());
});

// ── TABLES ────────────────────────────────────────────
app.get('/api/tables', (req, res) => res.json(db.get('tables').value()));

app.patch('/api/tables/:id', (req, res) => {
  db.get('tables').find({ id: req.params.id }).assign(req.body).write();
  res.json(db.get('tables').find({ id: req.params.id }).value());
});

// ── RESERVATIONS ──────────────────────────────────────
app.get('/api/reservations', (req, res) => {
  const reservations = db.get('reservations').orderBy('date', 'asc').value();
  res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
  const { customerName, phone, date, time, guests, tableId } = req.body;
  if (!customerName || !date || !time || !guests) return res.status(400).json({ error: 'customerName, date, time and guests required.' });

  // Check if table is already reserved at that time
  if (tableId) {
    const clash = db.get('reservations').find(r => r.tableId === tableId && r.date === date && r.time === time && r.status === 'confirmed').value();
    if (clash) return res.status(409).json({ error: 'Table already reserved at that time.' });
  }

  const reservation = { id: 'res' + Date.now(), customerName, phone: phone || '', date, time, guests: parseInt(guests), tableId: tableId || null, status: 'confirmed', createdAt: new Date().toISOString() };
  db.get('reservations').push(reservation).write();
  res.status(201).json(reservation);
});

app.patch('/api/reservations/:id', (req, res) => {
  const res2 = db.get('reservations').find({ id: req.params.id }).value();
  if (!res2) return res.status(404).json({ error: 'Reservation not found.' });
  db.get('reservations').find({ id: req.params.id }).assign(req.body).write();
  res.json(db.get('reservations').find({ id: req.params.id }).value());
});

app.delete('/api/reservations/:id', (req, res) => {
  db.get('reservations').remove({ id: req.params.id }).write();
  res.json({ message: 'Cancelled.' });
});

// ── INVENTORY ─────────────────────────────────────────
app.get('/api/inventory', (req, res) => res.json(db.get('inventory').value()));

app.patch('/api/inventory/:id', (req, res) => {
  const item = db.get('inventory').find({ id: req.params.id }).value();
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  db.get('inventory').find({ id: req.params.id }).assign(req.body).write();
  res.json(db.get('inventory').find({ id: req.params.id }).value());
});

// ── REPORTS ───────────────────────────────────────────
app.get('/api/reports/daily', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = db.get('orders').filter(o => o.createdAt.startsWith(today) && o.status !== 'cancelled').value();
  const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const lowStock = db.get('inventory').filter(i => i.quantity <= i.minLevel).value();
  res.json({ date: today, ordersCount: todayOrders.length, revenue, lowStockItems: lowStock });
});

app.listen(PORT, () => console.log(`Restaurant API running on http://localhost:${PORT}`));
