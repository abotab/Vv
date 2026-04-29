const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIG ===
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://widboosxeyomotvimfmt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_oXb6cLuU9Sygy_vm_zPSSg_36_5JwOE';
const BOT_TOKEN = process.env.BOT_TOKEN || '6799750674:AAGo5bz1z0X-oiGpP7H7bunSAscF4uPS1I4';
const CHAT_ID = process.env.CHAT_ID || '5802896978';
const SITE_URL = process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === MIDDLEWARE ===
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// === MULTER (file upload) ===
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.py')) {
      return cb(new Error('يُقبل فقط ملفات .py'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// === TELEGRAM ===
async function sendTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
    });
  } catch (e) { console.error('Telegram error:', e.message); }
}

async function sendTelegramVideo(videoUrl, caption) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, video: videoUrl, caption, parse_mode: 'HTML' })
    });
  } catch (e) { console.error('Telegram video error:', e.message); }
}

// === RUNNING PROCESSES ===
const runningProcesses = {};

// === ROUTES ===

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'alive', uptime: process.uptime(), site: SITE_URL });
});

// Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });

    const filename = req.file.originalname;
    const filepath = req.file.path;
    const content = fs.readFileSync(filepath, 'utf8');

    // Detect libraries
    const libs = detectLibraries(content);

    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(filepath);
    const { error: uploadError } = await supabase.storage
      .from('python-files')
      .upload(`files/${Date.now()}_${filename}`, fileBuffer, { contentType: 'text/plain', upsert: true });

    if (uploadError && uploadError.message !== 'The resource already exists') {
      console.error('Supabase upload error:', uploadError);
    }

    // Save to DB
    const { data: fileData, error: dbError } = await supabase
      .from('hosted_files')
      .insert([{ name: filename, size: req.file.size, status: 'installing', libraries: libs }])
      .select()
      .single();

    if (dbError) console.error('DB error:', dbError);

    // Notify Telegram
    await sendTelegram(`<b>رفع ملف جديد</b>\n\nاسم الملف: <code>${filename}</code>\nالمكتبات: ${libs.length > 0 ? libs.join(', ') : 'لا توجد'}`);

    // Install & run
    const fileId = fileData?.id || Date.now();
    installAndRun(filepath, filename, fileId, libs, content);

    // Cleanup temp file
    setTimeout(() => { try { fs.unlinkSync(filepath); } catch(e){} }, 30000);

    res.json({ success: true, fileId, filename, libraries: libs });
  } catch (e) {
    await sendTelegram(`<b>خطأ في رفع الملف</b>\n\n${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// Get all files
app.get('/api/files', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hosted_files')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ files: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Run file
app.post('/api/files/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: file } = await supabase.from('hosted_files').select('*').eq('id', id).single();
    if (!file) return res.status(404).json({ error: 'الملف غير موجود' });

    await sendTelegram(`<b>تشغيل بوت</b>\n\n<code>${file.name}</code>`);
    await supabase.from('hosted_files').update({ status: 'running' }).eq('id', id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stop file
app.post('/api/files/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    if (runningProcesses[id]) {
      runningProcesses[id].kill();
      delete runningProcesses[id];
    }
    await supabase.from('hosted_files').update({ status: 'stopped' }).eq('id', id);
    const { data: file } = await supabase.from('hosted_files').select('name').eq('id', id).single();
    await sendTelegram(`<b>إيقاف بوت</b>\n\n<code>${file?.name}</code>`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (runningProcesses[id]) { runningProcesses[id].kill(); delete runningProcesses[id]; }
    const { data: file } = await supabase.from('hosted_files').select('name').eq('id', id).single();
    await supabase.from('hosted_files').delete().eq('id', id);
    await sendTelegram(`<b>حذف ملف</b>\n\n<code>${file?.name}</code>`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === HELPERS ===
function detectLibraries(content) {
  const stdlib = new Set(['os','sys','re','json','time','datetime','math','random','string','io','pathlib','collections','itertools','functools','typing','abc','copy','enum','dataclasses','threading','multiprocessing','subprocess','socket','ssl','http','urllib','email','html','xml','csv','sqlite3','hashlib','hmac','base64','struct','binascii','logging','unittest','argparse','configparser','pickle','shelve','tempfile','shutil','glob','fnmatch','stat','platform','signal','ctypes','traceback','inspect','ast','dis','gc','weakref','array','queue','heapq','bisect','pprint','textwrap','difflib','uuid','decimal','fractions','statistics','builtins','__future__']);
  const libs = new Set();
  content.split('\n').forEach(line => {
    const m = line.match(/^(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (m && !stdlib.has(m[1])) libs.add(m[1]);
  });
  return [...libs];
}

async function installAndRun(filepath, filename, fileId, libs, content) {
  // Create working file
  const workDir = path.join(__dirname, 'running');
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });
  const runFile = path.join(workDir, filename);
  fs.writeFileSync(runFile, content);

  // Install libraries
  if (libs.length > 0) {
    await supabase.from('hosted_files').update({ status: 'installing' }).eq('id', fileId);
    for (const lib of libs) {
      await new Promise(resolve => {
        exec(`pip install ${lib} --quiet`, (err) => {
          if (err) console.error(`Failed to install ${lib}: ${err.message}`);
          resolve();
        });
      });
    }
  }

  // Run file
  try {
    const proc = spawn('python3', [runFile], { detached: false });
    runningProcesses[fileId] = proc;

    proc.stdout.on('data', async (data) => {
      console.log(`[${filename}] ${data}`);
    });

    proc.stderr.on('data', async (data) => {
      const errMsg = data.toString();
      console.error(`[${filename}] ERROR: ${errMsg}`);
      await sendTelegram(`<b>خطأ في البوت</b>\n\n<code>${filename}</code>\n\n<code>${errMsg.slice(0, 500)}</code>`);
    });

    proc.on('close', async (code) => {
      delete runningProcesses[fileId];
      const status = code === 0 ? 'stopped' : 'error';
      await supabase.from('hosted_files').update({ status }).eq('id', fileId);
      await sendTelegram(`<b>توقف البوت</b>\n\n<code>${filename}</code>\nكود الخروج: ${code}`);

      // Auto-restart if crashed
      if (code !== 0 && code !== null) {
        console.log(`Auto-restarting ${filename} in 5 seconds...`);
        await sendTelegram(`<b>اعادة تشغيل تلقائي</b>\n\n<code>${filename}</code>\nيتم اعادة التشغيل خلال 5 ثواني...`);
        setTimeout(() => installAndRun(filepath, filename, fileId, libs, content), 5000);
      }
    });

    await supabase.from('hosted_files').update({ status: 'running' }).eq('id', fileId);
    await sendTelegram(`<b>تم تشغيل البوت</b>\n\n<code>${filename}</code>\nالمكتبات المثبتة: ${libs.length > 0 ? libs.join(', ') : 'لا توجد'}\n\nالحالة: يعمل`);
  } catch (e) {
    await supabase.from('hosted_files').update({ status: 'error' }).eq('id', fileId);
    await sendTelegram(`<b>فشل تشغيل البوت</b>\n\n<code>${filename}</code>\n${e.message}`);
  }
}

// === START SERVER ===
app.listen(PORT, async () => {
  console.log(`Nimrod Iraq Hosting running on port ${PORT}`);

  // Send alive message + video on start
  await sendTelegramVideo(
    'https://h.top4top.io/m_3769b3hre0.mp4',
    `الموقع قيد الحياه\n\nخُلِقت الخيالات كي يرى الإنسان مافاته\n\n${SITE_URL}`
  );

  // Heartbeat every hour
  setInterval(async () => {
    const { data: files } = await supabase.from('hosted_files').select('*');
    const running = (files || []).filter(f => f.status === 'running').length;
    await sendTelegram(`الموقع قيد الحياه\n\nالبوتات النشطة: ${running}\nالإجمالي: ${(files||[]).length}\n\n${SITE_URL}`);
  }, 3600000);

  // Self-ping to stay alive (prevents sleeping)
  setInterval(() => {
    fetch(`http://localhost:${PORT}/health`).catch(() => {});
  }, 5 * 60 * 1000);
});

// === ERROR HANDLING ===
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await sendTelegram(`<b>خطأ في السيرفر</b>\n\n${err.message}`);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled Rejection:', reason);
  await sendTelegram(`<b>خطأ غير متوقع</b>\n\n${reason}`);
});
