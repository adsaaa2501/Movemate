
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'data.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(
    dataFile,
    JSON.stringify({ users: [], orders: [] }, null, 2)
  );
}

function readData() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    if (!raw || !raw.trim()) {
      return { users: [], orders: [] };
    }
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], orders: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const sessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function checkPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');

  return actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected);
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : '';

  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({
      message: 'Token tidak ada atau tidak valid.'
    });
  }

  req.userId = userId;
  req.token = token;
  next();
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MoveMate API aktif.'
  });
});

// Endpoint debug untuk UJI TIMEOUT (Week 6):
// server sengaja menunda jawaban `ms` milidetik. Dengan default 15000 ms,
// klien yang memiliki timeout 8000 ms akan membatalkan request lebih dulu.
app.get('/api/debug/slow', (req, res) => {
  const ms = Math.min(Number(req.query.ms) || 15000, 60000);
  console.log(`[DEBUG] Menunda respons ${ms} ms …`);
  setTimeout(() => {
    res.json({
      status: 'ok',
      message: `Respons datang setelah ${ms} ms (kemungkinan sudah melewati timeout klien).`
    });
  }, ms);
});

app.get('/api/vehicles', (req, res) => {
  res.json([
    { id: 'motor', name: 'Motor', price: 25000 },
    { id: 'pickup', name: 'Pickup', price: 100000 },
    { id: 'truck', name: 'Truk', price: 200000 }
  ]);
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({
      message: 'Nama, email, dan password minimal 8 karakter wajib diisi.'
    });
  }

  const data = readData();
  const normalizedEmail = String(email).trim().toLowerCase();

  if (data.users.some(user => user.email === normalizedEmail)) {
    return res.status(409).json({
      message: 'Email sudah terdaftar.'
    });
  }

  const credentials = hashPassword(String(password));

  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    salt: credentials.salt,
    passwordHash: credentials.hash
  };

  data.users.push(user);
  saveData(data);

  console.log(`[REGISTER BERHASIL] Akun baru: ${user.name} (${user.email}) | ID: ${user.id}`);

  res.status(201).json({
    message: 'Registrasi berhasil.',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const data = readData();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = data.users.find(item => item.email === normalizedEmail);

  if (!user || !password ||
      !checkPassword(String(password), user.salt, user.passwordHash)) {
    return res.status(401).json({
      message: 'Email atau password salah.'
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user.id);

  console.log(`[LOGIN BERHASIL] User: ${user.name} (${user.email}) | Sesi Aktif: ${sessions.size}`);

  res.json({
    message: 'Login berhasil.',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get('/api/auth/me', auth, (req, res) => {
  const data = readData();
  const user = data.users.find(item => item.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

app.post('/api/auth/logout', auth, (req, res) => {
  sessions.delete(req.token);
  res.json({ message: 'Logout berhasil.' });
});

app.get('/api/orders', auth, (req, res) => {
  const data = readData();
  res.json(data.orders.filter(order => order.userId === req.userId));
});

app.post('/api/orders', auth, (req, res) => {
  const {
    pickup,
    destination,
    vehicle,
    vehicleId,
    vehicleName,
    itemName,
    weightKg,
    notes,
    schedule,
  } = req.body || {};

  if (!pickup || !destination || (!vehicle && !vehicleId) || !schedule) {
    return res.status(400).json({
      message: 'Lokasi, kendaraan, dan jadwal wajib diisi.'
    });
  }

  if (weightKg !== undefined && Number(weightKg) <= 0) {
    return res.status(400).json({
      message: 'Berat barang harus berupa angka positif.'
    });
  }

  const data = readData();

  const order = {
    id: crypto.randomUUID(),
    userId: req.userId,
    // Detail barang (extended)
    itemName: itemName ? String(itemName) : '',
    weightKg: weightKg !== undefined ? Number(weightKg) : 0,
    notes: notes ? String(notes) : '',
    // Armada
    vehicleId: vehicleId ? String(vehicleId) : '',
    vehicle: vehicle || vehicleName || '',
    vehicleName: vehicleName ? String(vehicleName) : '',
    // Lokasi & jadwal
    pickup: String(pickup),
    destination: String(destination),
    itemDescription: notes ? String(notes) : '',
    schedule: String(schedule),
    status: 'menunggu_pembayaran',
    paymentStatus: 'belum_dibayar',
    createdAt: new Date().toISOString()
  };

  data.orders.push(order);
  saveData(data);

  console.log(`[PESANAN BARU] ${req.userId} → ${order.pickup} → ${order.destination} | ${order.vehicleName}`);

  res.status(201).json({
    message: 'Pesanan berhasil dibuat.',
    order
  });
});

app.patch('/api/orders/:id/payment', auth, (req, res) => {
  const { method } = req.body || {};

  if (!['QRIS', 'Transfer'].includes(method)) {
    return res.status(400).json({
      message: 'Metode pembayaran harus QRIS atau Transfer.'
    });
  }

  const data = readData();
  const order = data.orders.find(
    item => item.id === req.params.id && item.userId === req.userId
  );

  if (!order) {
    return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
  }

  order.paymentMethod = method;
  order.paymentStatus = 'simulasi_berhasil';
  order.status = 'diproses';

  saveData(data);

  res.json({ message: 'Simulasi pembayaran berhasil.', order });
});

app.patch('/api/orders/:id/status', auth, (req, res) => {
  const allowed = ['diproses', 'dalam_perjalanan', 'selesai', 'dibatalkan'];
  const { status } = req.body || {};

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }

  const data = readData();
  const order = data.orders.find(
    item => item.id === req.params.id && item.userId === req.userId
  );

  if (!order) {
    return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
  }

  order.status = status;
  saveData(data);

  res.json({ message: 'Status pesanan diperbarui.', order });
});

// ─── Monitoring Akun & Sesi untuk Backend Developer ────────────────────────

app.get('/api/admin/users', (req, res) => {
  const data = readData();
  const safeUsers = data.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email
  }));
  res.json({
    totalUsers: safeUsers.length,
    users: safeUsers
  });
});

app.get('/api/admin/sessions', (req, res) => {
  const data = readData();
  const activeSessions = [];

  for (const [token, userId] of sessions.entries()) {
    const user = data.users.find(u => u.id === userId);
    activeSessions.push({
      tokenPreview: token.substring(0, 10) + '...',
      userId,
      userName: user ? user.name : 'Unknown',
      userEmail: user ? user.email : 'Unknown'
    });
  }

  res.json({
    totalActiveSessions: sessions.size,
    sessions: activeSessions
  });
});

app.listen(PORT, HOST, () => {
  console.log(`MoveMate API berjalan di http://localhost:${PORT}`);
  console.log(`Pantau User Terdaftar : http://localhost:${PORT}/api/admin/users`);
  console.log(`Pantau Sesi Login     : http://localhost:${PORT}/api/admin/sessions`);
});
