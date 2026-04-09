import React from 'react';

export default function HeroImage({ currentMonth }) {
  // We can dynamically select images depending on the month
  // But for now, we'll use our generated beautiful scenery as the default
  // Add a neat quote of the month functionality
  const getQuote = (month) => {
    const quotes = [
      "A new beginning.", // Jan
      "Embrace the cold, find the warmth.", // Feb
      "Spring whispers.", // Mar
      "Blossom and bloom.", // Apr
      "The sun rises on new adventures.", // May
      "Radiance and light.", // Jun
      "Midsummer dreams.", // Jul
      "Golden hours.", // Aug
      "Harvest thoughts.", // Sep
      "Autumn leaves fall like gold.", // Oct
      "Gather and reflect.", // Nov
      "Winter's serene slumber." // Dec
    ];
    return quotes[month.getMonth()] || "Time moves forward.";
  };

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-[28rem] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden group">
      <img 
        src="/hero_image.png" 
        alt="Calendar hero scenery" 
        className="w-full h-full object-cover transition-transform duration-[20s] ease-linear group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
      <div className="absolute bottom-6 left-6 right-6">
        <h2 className="text-white text-3xl md:text-5xl font-serif font-medium drop-shadow-md">
          {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentMonth)}
        </h2>
        <p className="text-white/90 text-sm md:text-base font-medium mt-1 tracking-wide font-sans">
          {getQuote(currentMonth)}
        </p>
      </div>
    </div>
  );
}
