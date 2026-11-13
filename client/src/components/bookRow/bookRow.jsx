import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { FiUser } from 'react-icons/fi';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

const StatusBadge = ({ status }) => {
  const isAvailable = status === 'in-shelf';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
        isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {isAvailable ? 'In-Shelf' : 'Borrowed'}
    </span>
  );
};

const FavoriteButton = ({ isFavorite, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-gray-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
      type="button"
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? (
        <AiFillHeart className="text-red-500" />
      ) : (
        <AiOutlineHeart className="text-gray-300" />
      )}
    </button>
  );
};

const BookRow = ({ book, onToggleFavorite }) => {
  const navigate = useNavigate();

  const handlePreview = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <tr className="border-b border-gray-100/80 last:border-0 transition-colors hover:bg-orange-50/35">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <img
            src={book.cover}
            alt={book.title}
            className="h-[68px] w-12 flex-shrink-0 rounded-md bg-gray-50 object-cover shadow-sm ring-1 ring-black/5"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 font-semibold leading-snug text-gray-800">
              {book.title}
            </p>
            <p className="mt-1 truncate text-xs text-gray-500">
              <span>{book.author}</span><span className="text-gray-300"> · </span><span className="text-gray-400">{book.year}</span>
            </p>
            {book.edition && (
              <p className="mt-0.5 truncate text-[11px] text-gray-400">{book.edition}</p>
            )}
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">
        {book.rating !== null && book.rating !== undefined ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 font-medium text-amber-800">
            <span className="text-amber-500">★</span>
            {Number(book.rating).toFixed(1)}
            <span className="text-xs text-amber-700/70">({book.reviewCount || 0})</span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">No reviews yet</span>
        )}
      </td>

      <td className="px-4 py-3.5 text-sm">
        <span className="inline-block max-w-[190px] truncate rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {book.category}
        </span>
      </td>

      <td className="whitespace-nowrap px-4 py-3.5 text-sm">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
            book.hardCopy.available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              book.hardCopy.available ? 'bg-emerald-500' : 'bg-gray-300'
            }`} />
          </span>
          <span className="text-xs font-medium">Hard copy</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={book.status} />
          {book.status === 'borrowed' && book.borrowedBy && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <FiUser /> {book.borrowedBy}
            </span>
          )}
          {book.status === 'in-shelf' && book.hardCopy.location && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <HiOutlineLocationMarker /> {book.hardCopy.location}
            </span>
          )}
        </div>
      </td>

      <td className="px-2 py-3.5">
        <FavoriteButton
          isFavorite={book.isFavorite}
          onToggle={() => onToggleFavorite(book.id)}
        />
      </td>

      <td className="px-4 py-3.5">
        <button
          type="button"
          onClick={handlePreview}
          disabled={book.isBorrowed}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            book.isBorrowed
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-orange-50 text-[#D95531] ring-1 ring-inset ring-orange-200 hover:bg-[#F16A43] hover:text-white hover:ring-[#F16A43]'
          }`}
        >
          {book.isBorrowed ? 'Borrowed' : 'Preview'}
        </button>
      </td>
    </tr>
  );
};

export const BookCard = ({ book, onToggleFavorite }) => {
  const navigate = useNavigate();

  return (
    <article className="flex min-w-0 gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-orange-100 hover:shadow-md">
      <img
        src={book.cover}
        alt={book.title}
        className="h-28 w-20 flex-shrink-0 rounded object-cover shadow-sm"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="break-words text-sm font-semibold leading-snug text-[#4D4D4D]">
              {book.title}
            </h2>
            <p className="mt-1 break-words text-xs text-gray-400">
              {book.author}, {book.year}
            </p>
          </div>
          <FavoriteButton
            isFavorite={book.isFavorite}
            onToggle={() => onToggleFavorite(book.id)}
          />
        </div>

        <p className="mt-2">
          <span className="inline-block max-w-full truncate rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
            {book.category}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {book.rating !== null && book.rating !== undefined ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
              <span className="text-amber-500">★</span> {Number(book.rating).toFixed(1)}
              <span className="text-amber-700/70">({book.reviewCount || 0})</span>
            </span>
          ) : (
            <span className="text-xs text-gray-400">No reviews</span>
          )}
          <StatusBadge status={book.status} />
        </div>

        <button
          type="button"
          onClick={() => navigate(`/book/${book.id}`)}
          disabled={book.isBorrowed}
          className={`mt-auto self-start rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            book.isBorrowed
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'bg-orange-50 text-[#D95531] ring-1 ring-inset ring-orange-200 hover:bg-[#F16A43] hover:text-white hover:ring-[#F16A43]'
          }`}
        >
          {book.isBorrowed ? 'Borrowed' : 'Preview'}
        </button>
      </div>
    </article>
  );
};

export default BookRow;