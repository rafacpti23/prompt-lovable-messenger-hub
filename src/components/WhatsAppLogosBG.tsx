import React from "react";

const logoUrl = "/lovable-uploads/c9bbdaa6-c367-4489-8438-ef65ccaf62f2.png";

const logos = [
  {
    url: logoUrl,
    alt: "WhatsApp Pro logo background 1",
    style: "left-10 top-72 w-60 opacity-10 blur-sm",
    rotate: "-rotate-6",
  },
  {
    url: logoUrl,
    alt: "WhatsApp Pro logo background 2",
    style: "right-20 top-24 w-36 opacity-5 blur-md",
    rotate: "rotate-12 scale-x-[-1]",
  },
  {
    url: logoUrl,
    alt: "WhatsApp Pro logo background 3",
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