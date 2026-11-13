import React, { useEffect, useState } from 'react';
import { FaClock, FaCalendarAlt } from 'react-icons/fa';

const TimeDateDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString();
  const dateString = currentTime.toLocaleDateString();

  return (
    <div className="flex w-fit max-w-full items-center gap-3 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[10px] font-medium text-[#4D4D4D] shadow sm:gap-5 sm:px-5 sm:text-xs lg:gap-8 lg:px-8">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <FaClock className="text-[#F76A56]" />
        <span>
          <span className="font-semibold"></span> {timeString}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <FaCalendarAlt className="text-[#F76A56]" />
        <span>
          <span className="font-semibold"></span> {dateString}
        </span>
      </div>
    </div>
  );
};

export default TimeDateDisplay;
