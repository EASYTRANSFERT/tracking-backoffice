/** Données imprimées sur l'affiche du QR code d'un site. */
export interface PrintableQrCode {
  siteName: string
  location?: string
  /** Image PNG (URI de données) renvoyée par l'API à la génération. */
  image: string
  generatedAt?: string
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

/**
 * Imprime l'affiche du QR code (format A4) par une iframe cachée : pas de fenêtre
 * surgissante bloquée par le navigateur, et la page en cours reste intacte.
 */
export function printQrCode({ siteName, location, image, generatedAt }: PrintableQrCode): Promise<void> {
  const date = generatedAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(generatedAt)) : null
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>QR code · ${escapeHtml(siteName)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Poppins, Arial, sans-serif; color: #252830; text-align: center; }
  .brand { font-size: 13pt; font-weight: 700; letter-spacing: .12em; color: #D80F16; }
  h1 { margin: 10mm 0 2mm; font-size: 28pt; }
  .location { margin: 0; font-size: 13pt; color: #535865; }
  img { display: block; width: 120mm; height: 120mm; margin: 12mm auto; image-rendering: pixelated; }
  .hint { font-size: 16pt; font-weight: 600; margin: 0; }
  .date { margin-top: 8mm; font-size: 10pt; color: #848484; }
</style></head><body>
  <div class="brand">KAYBIC</div>
  <h1>${escapeHtml(siteName)}</h1>
  ${location ? `<p class="location">${escapeHtml(location)}</p>` : ''}
  <img src="${image}" alt="QR code du site">
  <p class="hint">Scannez ce code avec l’application pour pointer sur ce site.</p>
  ${date ? `<p class="date">Généré le ${escapeHtml(date)}. Un nouveau code rend celui-ci inutilisable.</p>` : ''}
</body></html>`

  return new Promise((resolve) => {
    const frame = Object.assign(document.createElement('iframe'), { title: 'Impression du QR code' })
    Object.assign(frame.style, { position: 'fixed', width: '0', height: '0', border: '0', right: '0', bottom: '0' })
    document.body.appendChild(frame)
    const cleanUp = () => { frame.remove(); resolve() }
    frame.onload = () => {
      const view = frame.contentWindow
      if (!view) return cleanUp()
      // Imprime une fois l'image décodée, puis retire l'iframe après la boîte d'impression.
      const qr = view.document.querySelector('img')
      const go = () => { view.focus(); view.print(); window.setTimeout(cleanUp, 500) }
      if (qr && !qr.complete) qr.addEventListener('load', go, { once: true })
      else go()
    }
    frame.srcdoc = html
  })
}
