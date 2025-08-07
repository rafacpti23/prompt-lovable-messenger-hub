import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const CountdownBanner = () => {
  const calculateTimeLeft = () => {
    const fiveDaysFromNow = new Date().getTime() + 5 * 24 * 60 * 60 * 1000;
    const difference = fiveDaysFromNow - new Date().getTime();
    
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: any[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval as keyof typeof timeLeft]) {
      return;
    }
    timerComponents.push(
      <span key={interval} className="mx-1">
        {timeLeft[interval as keyof typeof timeLeft]} {interval}
      </span>
    );
  });

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white text-center p-2 text-sm font-semibold animate-pulse">
      <div className="flex items-center justify-center">
        <Zap className="h-5 w-5 mr-2" />
        <span>Oferta Especial! Desconto no Plano Starter termina em: {timerComponents.length ? timerComponents : <span>Oferta Expirada!</span>}</span>
      </div>
    </div>
  );
};

export default CountdownBanner;