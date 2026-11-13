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
    <div className="my-3 grid min-w-0 grid-cols-1 gap-4 text-white lg:h-[230px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.8fr)] lg:items-center">

      {/* QUOTE SECTION (unchanged) */}
      <div className="quotation relative min-h-[190px] min-w-0 rounded-lg bg-gradient-to-br from-[#EB5231] to-[#571FCF] px-5 py-6 sm:min-h-[210px] sm:px-7 sm:py-8 lg:my-2 lg:h-full lg:px-7">
        {quotes.length > 0 ? (
          <>
            <h1 className="mb-4 text-lg sm:text-xl">Today's Quote</h1>
            <div className={`transition-opacity duration-300 ${fadeQuote ? 'opacity-100' : 'opacity-0'}`}>
              <p className="mb-3">“{quotes[currentQuoteIndex].quote}”</p>
              <p className="text-right">- {quotes[currentQuoteIndex].author}</p>
            </div>

            <div className="absolute bottom-5 left-5 flex justify-start sm:left-8 sm:bottom-8">
              {quotes.map((_, idx) => (
                <button
                  type="button"
                  key={idx}
                  aria-label={`Show quote ${idx + 1}`}
                  onClick={() => {
                    setFadeQuote(false);
                    setTimeout(() => {
                      setCurrentQuoteIndex(idx);
                      setFadeQuote(true);
                    }, 300);
                  }}
                  className={`mx-1 h-2 w-2 rounded-full ${
                    idx === currentQuoteIndex ? 'bg-white' : 'border'
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* NEW ARRIVALS SECTION */}
      <div className="relative flex h-[200px] min-w-0 w-full overflow-hidden rounded-lg border border-purple-300 bg-white sm:h-[230px] lg:mr-0 lg:h-full">
        <div className="flex items-center justify-center bg-gradient-to-br from-[#EB5231] to-[#571FCF] px-2">
          <span className="rotate-180 text-sm font-semibold text-white [writing-mode:vertical-rl] sm:text-lg">
            New Arrivals
          </span>
        </div>

        <div className={`flex min-w-0 flex-1 gap-3 overflow-x-auto p-3 transition-opacity duration-500 ease-in-out sm:gap-4 sm:p-4 ${fadeNew ? 'opacity-100' : 'opacity-0'}`}>
          {currentBooks.length > 0 ? (
            currentBooks.map((book, idx) => (
              <div
                key={idx}
                className="flex h-full w-28 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-md sm:w-40"
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
