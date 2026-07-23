import React, { useEffect, useState } from 'react'
import { QuotationAndArrival } from '../../components'

const Home = () => {
  const [booklist, setBookList] = useState([]);

  const fetchBookList = async () => {
    try {
      const res = await fetch('http://localhost/Readora_API/api/books.php');
      const data = await res.json();
      setBookList(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }

  useEffect(() => {
    fetchBookList();
  }, [])

  return (
    <>
      <QuotationAndArrival className="w-full"/>
      <div className="mainpage__booklist mt-12 pl-6">
        <div className="mainpage__booklist-header">
          <h1 className='text-4xl font-semibold text-[#4D4D4D]'>Good Morning</h1>
          <p className='text-2xl text-[#4D4D4D] mt-6'>Recommended for You</p>
        </div>
        <div className="mainpage__booklist-container container mt-4 py-6 px-2 grid grid-cols-5 gap-6">
          {
            booklist.length > 0 ? 
              booklist.map((book,index)=>(
                <div key={index} className='bg-white flex flex-col py-5 px-5 cursor-pointer gap-3 rounded-lg relative transform transition-transform duration-50 hover:scale-105'>
                  <img src={`http://localhost/Readora_API/${book.image}`} alt={book.title}  className="w-full h-64 object-contain mx-auto"/>
                  <h1 className='text-[#4D4D4D] text-xl mb-4'>{book.title}</h1>
                  <p className='text-[#A7A7A7] absolute bottom-2'>
                    {book.rating ? `${book.rating}/5` : '?/5'}
                  </p>
                </div>
              ))
            : <p>Loading...</p>
          }
        </div>
      </div>
    </>
  )
}

export default Home
