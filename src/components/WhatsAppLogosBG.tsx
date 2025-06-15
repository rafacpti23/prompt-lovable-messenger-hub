
import React from "react";

// URLs de imagens stock, você pode trocar por SVG real depois
const logos = [
  {
    url: "/placeholder.svg",
    alt: "WhatsApp logo 1",
    style: "left-10 top-72 w-60 opacity-10 blur-sm",
    rotate: "-rotate-6",
  },
  {
    url: "/placeholder.svg",
    alt: "WhatsApp logo 2",
    style: "right-20 top-24 w-36 opacity-5 blur-md",
    rotate: "rotate-12 scale-x-[-1]",
  },
  {
    url: "/placeholder.svg",
    alt: "WhatsApp logo 3",
    style: "left-1/2 bottom-32 w-80 opacity-10 blur-sm",
    rotate: "rotate-2 -translate-x-1/2",
  },
];

export default function WhatsAppLogosBG() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {logos.map((logo, idx) => (
        <img
          key={idx}
          src={logo.url}
          alt={logo.alt}
          className={`absolute ${logo.style} ${logo.rotate}`}
          aria-hidden="true"
          draggable={false}
          loading="lazy"
        />
      ))}
    </div>
  );
}
