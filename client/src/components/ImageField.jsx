import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiImage } from 'react-icons/fi';
import api, { errMsg } from '../api';

// shrink in the browser first so uploads stay small and fast
const shrink = (file, maxW) => new Promise((resolve, reject) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, maxW / img.width), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => reject(new Error('This file could not be read as an image.'));
  img.src = url;
});

export default function ImageField({ value, onChange, maxW = 1600 }) {
  const [busy, setBusy] = useState(false);
  const pick = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.warn('Please choose an image file.');
    setBusy(true);
    try { const { data } = await api.post('/uploads', { data: await shrink(file, maxW) }); onChange(data.url); }
    catch (err) { toast.error(err.response ? errMsg(err) : err.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        {value ? <img src={value} alt="Preview" className="h-full w-full object-cover" /> : <FiImage size={26} />}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <label className="btn-ghost cursor-pointer !py-1.5">
            <FiUpload /> {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={busy} />
          </label>
          {value && <button type="button" className="btn-ghost !py-1.5 !text-red-600" onClick={() => onChange('')}><FiTrash2 /> Remove</button>}
        </div>
        <p className="text-xs text-slate-500">JPG, PNG or WebP. Large photos are resized automatically.</p>
      </div>
    </div>
  );
}
