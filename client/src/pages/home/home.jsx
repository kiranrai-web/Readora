import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { QuotationAndArrival } from '../../components'
import { toggleFavorite, getFavorites } from '../../services/favoritesService'

const Home = () => {
  const [booklist, setBookList] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState('');
  const navigate = useNavigate();

  const fetchBookList = async () => {
    setBooksLoading(true);
    setBooksError('');
    try {
      const res = await fetch('http://localhost/Readora_API/api/books.php');
      if (!res.ok) {
        throw new Error('The catalog could not be loaded. Please try again.');
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('The catalog response was invalid. Please try again.');
      }
      setBookList(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setBookList([]);
      setBooksError(error instanceof TypeError
        ? 'Unable to connect to the catalog. Check your connection and try again.'
        : error.message || 'The catalog could not be loaded. Please try again.');
    } finally {
      setBooksLoading(false);
    }
  }

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavoriteIds(favs);
  }

  useEffect(() => {
    fetchBookList();
    loadFavorites();
  }, [])

  const handleToggleFavorite = async (e, bookId) => {
    e.stopPropagation();
    const result = await toggleFavorite(bookId);
    if (result.success) {
      setFavoriteIds((prev) =>
        result.favorited
          ? [...prev, String(bookId)]
          : prev.filter((id) => id !== String(bookId))
      );
    }
  }

  const isFav = (bookId) => favoriteIds.includes(String(bookId));

  return (
    <>
      <QuotationAndArrival className="w-full"/>
      <div className="mainpage__booklist mt-8 min-w-0">
        <div className="mainpage__booklist-header">
          <h1 className='text-2xl font-semibold text-[#4D4D4D] sm:text-4xl'>Good Morning</h1>
          <p className='mt-4 text-lg text-[#4D4D4D] sm:mt-6 sm:text-2xl'>Recommended for You</p>
        </div>
        {booksError ? (
          <div className="mt-5 rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <p role="alert" className="text-sm text-red-600">{booksError}</p>
            <button
              type="button"
              onClick={fetchBookList}
              className="mt-4 rounded-lg bg-[#F16A43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e05831]"
            >
              Retry
            </button>
          </div>
        ) : booksLoading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading books...</p>
        ) : booklist.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No books are available yet.</p>
        ) : (
        <div className="mainpage__booklist-container mt-4 grid min-w-0 grid-cols-2 gap-3 py-4 sm:grid-cols-3 sm:gap-5 sm:py-6 lg:grid-cols-4 xl:grid-cols-5">
          {
              booklist.map((book,index)=>(
                <div
                  key={index}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className='relative flex min-w-0 min-h-[270px] cursor-pointer flex-col gap-3 rounded-lg bg-white px-3 py-4 transition-transform duration-150 hover:scale-[1.02] sm:min-h-[380px] sm:px-5 sm:py-5'
                >
                  <button
                    onClick={(e) => handleToggleFavorite(e, book.id)}
                    className="absolute right-2 top-2 z-10 text-xl sm:right-3 sm:top-3 sm:text-2xl"
                    aria-label={isFav(book.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav(book.id) ? (
                      <AiFillHeart className="text-red-500" />
                    ) : (
                      <AiOutlineHeart className="text-gray-300" />
                    )}
                  </button>
                  <img src={`http://localhost/Readora_API/${book.image}`} alt={book.title}  className="mx-auto h-40 w-full object-contain sm:h-64"/>
                  <h2 className='min-h-10 break-words text-base leading-snug text-[#4D4D4D] sm:text-xl'>{book.title}</h2>
                  <p className='mt-auto flex items-center gap-1 pt-2 text-[10px] text-[#A7A7A7] sm:text-xs'>
                    {book.rating !== null && book.rating !== undefined ? (
                      <>
                        <span className="text-amber-500">★</span>
                        <span>{Number(book.rating).toFixed(1)}/5</span>
                        <span className="text-gray-400">({Number(book.review_count || 0)})</span>
                      </>
                    ) : (
                      <span>No reviews yet</span>
                    )}
                  </p>
                </div>
              ))
          }
        </div>
        )}
      </div>
    </>
  )
}

export default Home
