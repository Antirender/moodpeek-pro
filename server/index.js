require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set; authentication requests will fail until it is configured.');
}

app.use(cors());
app.use(express.json());

// Serve the img-cache directory statically under /imgcache
app.use('/imgcache', express.static(path.join(__dirname, '../img-cache')));

// routes
const authRouter = require('./routes/auth');
const entriesRouter = require('./routes/entries');
const insightsRouter = require('./routes/insights');
const imagesRouter = require('./routes/images');
const preferencesRouter = require('./routes/preferences');

app.use('/api/auth', authRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/preferences', preferencesRouter);

const PORT = process.env.PORT || 5174;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set in environment; skipping mongoose connect for now.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Development routes
const { seedEntries } = require('./devSeed');
app.post('/dev/seed', async (_req, res) => {
  try { 
    await seedEntries(); 
    res.json({ ok: true, message: 'Seed data created successfully' }); 
  } catch(e) { 
    console.error('Seed error:', e);
    res.status(500).json({ error: String(e) }); 
  }
});

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await connectDB();
});

module.exports = app;
