// Shared helpers for fields edited via <RichTextEditor> (intro note, closing
// note, per-team action text), which store raw contentEditable HTML
// (<b>/<i>/<u>/<ul><li>/<div>...) rather than plain strings.

// Outlook's Word rendering engine doesn't reliably inherit font-family/size
// into nested tags, so stamp the given font style onto every tag below. Tags
// that already carry a style (e.g. a highlight <span style="background-color:...">
// from the toolbar's highlight command) get the font declarations merged in
// rather than skipped, so a highlighted run doesn't lose the app's font.
export function styleRichText(html: string, font: string): string {
  return html.replace(/<(div|p|li|ul|ol|b|i|u|strong|em|span|font)((?:\s+[^>]*)?)>/gi, (_match, tag, attrs) => {
    const styleMatch = attrs.match(/style\s*=\s*"([^"]*)"/i);
    if (styleMatch) {
      return `<${tag}${attrs.replace(styleMatch[0], `style="${font}${styleMatch[1]}"`)}>`;
    }
    return `<${tag} style="${font}"${attrs}>`;
  });
}

// Reduces rich-text HTML to readable plain text for contexts that can't
// render HTML at all (WhatsApp message text, clipboard text/plain fallback).
export function richTextToPlainText(html: string): string {
  if (!html) return "";
  let text = html
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(div|p)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  text = text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
