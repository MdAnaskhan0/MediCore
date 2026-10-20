import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

export const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const router = Router();
// Admin image upload. The browser sends a resized image as a data URL (png/jpeg/webp only).
router.post('/uploads', (req, res) => {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(req.body?.data || '');
  if (!m) return res.status(400).json({ message: 'Please upload a PNG, JPG or WebP image.' });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ message: 'Image is too large (max 5 MB).' });
  const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.status(201).json({ url: `/uploads/${name}` });
});
export default router;
