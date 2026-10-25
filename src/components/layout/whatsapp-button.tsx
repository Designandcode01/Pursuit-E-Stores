import { whatsappLink } from "@/lib/utils";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink("Assalam-o-Alaikum! I need help with an order on Hunar Bazaar.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Hunar Bazaar on WhatsApp"
      className="group fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-[#25d366] py-3 pl-3 pr-4 text-white shadow-lg shadow-black/20 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128c7e] focus-visible:ring-offset-2 md:bottom-6"
    >
      <span className="grid size-8 place-items-center rounded-full bg-white/15">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.47.71.3 1.26.49 1.69.63.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 19.05 4.9 9.83 9.83 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21Z" />
        </svg>
      </span>
      <span className="hidden text-sm font-semibold sm:inline">Need help?</span>
    </a>
  );
}
