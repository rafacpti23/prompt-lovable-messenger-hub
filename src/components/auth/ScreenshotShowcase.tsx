import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const screenshots = [
  { src: '/pasted-image-2025-08-07T23-48-12-511Zz.png', alt: 'Dashboard Screenshot' },
  { src: '/pasted-image-2025-08-07T23-48-42-946Z.png', alt: 'Contacts Page Screenshot' },
  { src: '/pasted-image-2025-08-07T23-49-03-483Z.png', alt: 'Campaigns Page Screenshot' },
  { src: '/pasted-image-2025-08-07T23-49-17-007Z.png', alt: 'Media Repository Screenshot' },
];

const ScreenshotShowcase: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % screenshots.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="relative w-full max-w-2xl h-[400px] mx-auto mt-8 perspective-1000"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <AnimatePresence>
        <motion.img
          key={index}
          src={screenshots[index].src}
          alt={screenshots[index].alt}
          initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: -50, scale: 0.9, rotateX: 20 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-contain rounded-lg shadow-2xl border-4 border-white/10"
          style={{ transformStyle: 'preserve-3d' }}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default ScreenshotShowcase;