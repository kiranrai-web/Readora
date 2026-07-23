import React, { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 4;

const QuotationAndArrival = () => {
  const [quotes, setQuotes] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeQuote, setFadeQuote] = useState(true);

  const [newArrival, setNewArrival] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fadeNew, setFadeNew] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('http://localhost/Readora_API/api/quotes.php');
        const data = await res.json();
        setQuotes(data);
      } catch (error) {
        console.error("Failed to fetch quotes: ", error);
      }
    };

    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('http://localhost/Readora_API/api/newArrival.php');
        const booklist = await res.json();
        setNewArrival(booklist);
      } catch (error) {
        console.error("Failed to fetch books: ", error);
      }
    };

    fetchQuotes();
    fetchNewArrivals();
  }, []);

  // Auto-cycle quotes (unchanged)
  useEffect(() => {
    if (quotes.length === 0) return;

    const timer = setInterval(() => {
      setFadeQuote(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFadeQuote(true);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, [quotes]);

  const totalPages = Math.ceil(newArrival.length / ITEMS_PER_PAGE);

  // Auto-cycle new arrival pages
  useEffect(() => {
    if (newArrival.length === 0) return;

    const timer = setInterval(() => {
      setFadeNew(false);
      setTimeout(() => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
        setFadeNew(true);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, [newArrival, totalPages]);

  const currentBooks = newArrival.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <div className="h-[230px] my-3 flex justify-between items-center text-white">

      {/* QUOTE SECTION (unchanged) */}
      <div className="h-full quotation my-2 mx-6 relative py-8 px-7 rounded-lg bg-gradient-to-br  from-[#EB5231] to-[#571FCF] w-[35%]">
        {quotes.length > 0 ? (
          <>
            <h1 className="mb-4 text-xl">Today's Quote</h1>
            <div className={`transition-opacity duration-300 ${fadeQuote ? 'opacity-100' : 'opacity-0'}`}>
              <p className="mb-3">“{quotes[currentQuoteIndex].quote}”</p>
              <p className="text-right">- {quotes[currentQuoteIndex].author}</p>
            </div>

           <div className="mt-4">
  <div className="flex justify-start absolute bottom-10 left-8">
    {quotes.map((_, idx) => (
      <span
        key={idx}
        onClick={() => {
          setFadeQuote(false);
          setTimeout(() => {
            setCurrentQuoteIndex(idx);
            setFadeQuote(true);
          }, 300);
        }}
        className={`h-2 w-2 mx-1 rounded-full cursor-pointer  ${
          idx === currentQuoteIndex ? 'bg-white' : 'border'
        }`}
      />
    ))}
  </div>
  </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* NEW ARRIVALS SECTION */}
      <div className="h-full flex border border-purple-300 rounded-lg overflow-hidden bg-white w-[68%] mr-4 relative">
        <div className="flex items-center justify-center bg-gradient-to-br from-[#EB5231] to-[#571FCF] px-2">
          <span className="text-white font-semibold text-lg [writing-mode:vertical-rl] rotate-180">
            New Arrivals
          </span>
        </div>

        <div className={`flex overflow-x-hidden gap-4 p-4 transition-opacity duration-500 ease-in-out ${fadeNew ? 'opacity-100' : 'opacity-0'}`}>
          {currentBooks.length > 0 ? (
            currentBooks.map((book, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-40 h-48 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center"
              >
                <img
                 src={`http://localhost/Readora_API/${book.image}`}
                  alt={book.title}
                  className="rounded-lg object-contain h-full cursor-pointer"
                />
              </div>
            ))
          ) : (
            <p className="text-black">No new arrivals yet.</p>
          )}
        </div>

        {/* Navigation dots */}
        <div className="flex flex-col justify-center items-center absolute right-0 top-[40%] gap-2 px-4 pb-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <span
              key={idx}
              onClick={() => {
                setFadeNew(false);
                setTimeout(() => {
                  setCurrentPage(idx);
                  setFadeNew(true);
                }, 300);
              }}
              className={`h-2 w-2 rounded-full cursor-pointer ${
                idx === currentPage ? 'bg-[#EB5231]' : 'border border-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationAndArrival;
