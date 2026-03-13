import Link from "next/link";
import Image from "next/image";

import { BOOKS } from "@/lib/books";

export default function StorePage() {
  // Take only the first 6 books to fill the 2x3 grid
  const displayedBooks = BOOKS.slice(0, 6);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* 2x3 Grid with thick dark borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-3 border-black dark:border-white">
          {displayedBooks.map((book) => (
            <Link
              key={book.id}
              href={`/store/${book.id}`}
              className="group block border-3 border-black dark:border-white -mt-[3px] -ml-[3px] transition-all duration-200 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:-translate-x-1"
            >
              <div className="bg-white dark:bg-black h-full flex flex-col">
                {/* Cover Image - fixed aspect ratio */}
                <div className="aspect-[3/4] w-full relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Text info with thick top border */}
                <div className="p-5 border-t-3 border-black dark:border-white flex-1 flex flex-col">
                  <h2 className="text-base font-semibold text-black dark:text-white mb-1 group-hover:underline leading-tight">
                    {book.title}
                  </h2>
                  <p className="text-xs text-black/60 dark:text-white/60 mb-3 line-clamp-2">
                    {book.subtitle}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-base font-bold text-black dark:text-white">
                      {book.priceDisplay}
                    </span>
                    <span className="text-xs text-black/60 dark:text-white/60 group-hover:text-black group-hover:dark:text-white group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}