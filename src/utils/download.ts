/** Déclenche le téléchargement d'une URL (signée) sous le nom indiqué. */
export function openDownload(url: string, filename: string) {
  const link = Object.assign(document.createElement('a'), { href: url, download: filename, rel: 'noopener' })
  document.body.append(link)
  link.click()
  link.remove()
}
