import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { FiUser } from 'react-icons/fi';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

const StatusBadge = ({ status }) => {
  const isAvailable = status === 'in-shelf';

  return (
    <span
      className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
        isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}
    >
      {isAvailable ? 'In-Shelf' : 'Borrowed'}
    </span>
  );
};

const FavoriteButton = ({ isFavorite, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="text-xl leading-none"
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

const bookRow = ({ book, onToggleFavorite }) => {
  const navigate = useNavigate();

  const handlePreview = () => {
    // Send only the id, the preview page fetches full details 
    navigate(`/book/${book.id}`);
  };

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <img
            src={book.cover}
            alt={book.title}
            className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
          />
          <div>
            <p className="font-semibold text-[#4D4D4D] text-sm leading-tight">
              {book.title}
            </p>
            <p className="text-xs text-gray-400">
              {book.author}, {book.year}
            </p>
            {book.edition && (
              <p className="text-xs text-gray-400">{book.edition}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-4 text-sm text-[#4D4D4D] whitespace-nowrap">
        {book.rating}
        <span className="text-gray-400">/5</span>
      </td>

      <td className="py-4 px-4 text-sm text-[#4D4D4D]">
        <p>{book.category}</p>
        {book.subCategory && (
          <p className="text-xs text-gray-400">{book.subCategory}</p>
        )}
      </td>

      <td className="py-4 px-4 text-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              book.hardCopy.available ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span className="text-[#4D4D4D]">Hard Copy</span>
        </div>
      </td>

      <td className="py-4 px-4">
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

      <td className="py-4 px-4">
        <FavoriteButton
          isFavorite={book.isFavorite}
          onToggle={() => onToggleFavorite(book.id)}
        />
      </td>

      <td className="py-4 px-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={book.isBorrowed}
          className={`px-4 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
            book.isBorrowed
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'border border-[#FA7C54] text-[#FA7C54] hover:bg-[#FA7C54] hover:text-white'
          }`}
        >
          {book.isBorrowed ? 'Borrowed' : 'Preview'}
        </button>
      </td>
    </tr>
  );
};

export default bookRow;