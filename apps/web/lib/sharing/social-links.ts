/**
 * Social platform share URL generators
 */

export interface ShareContent {
  title: string;
  description: string;
  url: string;
}

/**
 * Generate Twitter/X share intent URL
 */
export function getTwitterShareUrl(content: ShareContent): string {
  const params = new URLSearchParams({
    text: `${content.title}\n\n${content.description}`,
    url: content.url,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(content: ShareContent): string {
  const params = new URLSearchParams({
    u: content.url,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(content: ShareContent): string {
  const params = new URLSearchParams({
    url: content.url,
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(content: ShareContent): string {
  const text = `${content.title}\n${content.description}\n${content.url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Generate email share URL (mailto)
 */
export function getEmailShareUrl(content: ShareContent): string {
  const subject = encodeURIComponent(content.title);
  const body = encodeURIComponent(`${content.description}\n\n${content.url}`);
  return `mailto:?subject=${subject}&body=${body}`;
}
