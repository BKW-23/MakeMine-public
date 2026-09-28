import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { hydrateStickerCatalog } from '@/lib/stickers'
import { BKW } from '@/api/bkwClient'

const syncStickerCatalog = async () => {
  try {
    const stickers = await BKW.entities.Sticker.list();
    hydrateStickerCatalog(stickers || []);
  } catch {
    // Ignore fetch failures here; the built-in sticker set remains available.
  }
};

syncStickerCatalog();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
