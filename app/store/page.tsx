import Link from "next/link";
import Image from "next/image";

const BOOK = {
  slug: "book1",
  title: "Chain Salad — The Ebook",
  subtitle: "A Guide to Modern Development",
  price: "₹499",
  coverImage: "/book-cover.png",
};

export default function StorePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            The Store
          </h1>
          <p className="text-lg text-black/60 max-w-2xl mx-auto">
            Premium ebooks crafted for modern developers.
          </p>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Book Card */}
          <Link
            href={`/store/${BOOK.slug}`}
            className="group block"
          >
            <div className="bg-white border-3 border-black overflow-hidden transition-all duration-300 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1">
              {/* Cover Image */}
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                <Image
                  src={BOOK.coverImage}
                  alt={BOOK.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <div className="p-6 border-t-3 border-black">
                <h2 className="text-lg font-semibold text-black mb-1 group-hover:underline">
                  {BOOK.title}
                </h2>
                <p className="text-sm text-black/60 mb-4">{BOOK.subtitle}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-black">
                    {BOOK.price}
                  </span>
                  <span className="text-sm text-black/60 group-hover:text-black group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
