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
    <div className="px-14 py-1 bg-white shadow rounded-full w-fit text-[#4D4D4D] font-medium space-y-2 flex items-center gap-10">
      <div className="flex items-center space-x-2 gap-2">
        <FaClock className="text-[#F76A56]" />
        <span>
          <span className="font-semibold"></span> {timeString}
        </span>
      </div>
      <div className="flex items-center space-x-2 gap-2">
        <FaCalendarAlt className="text-[#F76A56]" />
        <span>
          <span className="font-semibold"></span> {dateString}
        </span>
      </div>
    </div>
  );
};

export default TimeDateDisplay;
