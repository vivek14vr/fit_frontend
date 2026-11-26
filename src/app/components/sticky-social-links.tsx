import s from "./sticky-social-links.module.css";

function InstagramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" /></svg>;
}

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.3 8.3 0 0 1-12.3 7.2L3.5 20l1.2-4.5A8.3 8.3 0 1 1 20.5 11.7Z" /><path d="M8.4 7.6c.3-.4.6-.4.9-.4.2 0 .4 0 .6.5l.8 1.8c.1.3.1.5-.1.8l-.6.8c-.2.2-.1.4 0 .7.7 1.4 1.8 2.5 3.3 3.1.3.1.5.1.7-.1l.9-1c.2-.3.5-.3.8-.2l1.8.9c.3.2.5.3.5.6 0 .6-.3 1.5-.8 1.9-.6.5-1.4.8-2.2.7-1.2-.2-2.8-.7-4.6-2.3-2-1.7-3.2-3.9-3.5-5.4-.2-1 .1-1.8.6-2.4Z" /></svg>;
}

const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || "/contact";
const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim() || "/contact";

function isExternal(value: string) {
  return /^https?:\/\//.test(value);
}

export default function StickySocialLinks() {
  return (
    <aside className={s.rail} aria-label="Connect with Deepti">
      <a href={instagramUrl} target={isExternal(instagramUrl) ? "_blank" : undefined} rel={isExternal(instagramUrl) ? "noopener noreferrer" : undefined} aria-label="Follow Deepti on Instagram">
        <InstagramMark /><span>Instagram</span>
      </a>
      <a href={whatsappUrl} target={isExternal(whatsappUrl) ? "_blank" : undefined} rel={isExternal(whatsappUrl) ? "noopener noreferrer" : undefined} aria-label="Contact Deepti on WhatsApp">
        <WhatsAppMark /><span>WhatsApp</span>
      </a>
    </aside>
  );
}
