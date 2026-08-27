// Shared helpers for fields edited via <RichTextEditor> (intro note, closing
// note, per-team action text), which store raw contentEditable HTML
// (<b>/<i>/<u>/<ul><li>/<div>...) rather than plain strings.

// Outlook's Word rendering engine doesn't reliably inherit font-family/size
// into nested tags, so stamp the given font style onto every tag that
// doesn't already carry one before dropping the HTML into an email.
export function styleRichText(html: string, font: string): string {
  return html.replace(/<(div|p|li|ul|ol|b|i|u|strong|em)(?![^>]*style=)([^>]*)>/gi, `<$1 style="${font}"$2>`);
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
