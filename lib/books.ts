export interface Book {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  priceDisplay: string;
  coverImage: string;
  description: string;
  pages: string;
  format: string;
  lastUpdated: string;
  s3Key: string;
}

export const BOOKS: Book[] = [
  {
    id: "item-1",
    title: "Chain Salad — The Ebook",
    subtitle: "A Guide to Modern Development",
    price: 499,
    priceDisplay: "₹499",
    coverImage: "/book-cover.png",
    description: `Chain Salad is a comprehensive guide to modern development practices. Whether you're a beginner looking to level up or an experienced developer wanting to stay current, this ebook covers everything you need to know.

Inside you'll find:
• Modern project architecture and design patterns
• Full-stack development workflows
• Payment integration strategies
• Cloud deployment and infrastructure
• Security best practices
• And much more...

Written in a clear, practical style with real-world examples and battle-tested approaches.`,
    pages: "250+",
    format: "PDF",
    lastUpdated: "March 2026",
    s3Key: process.env.S3_EBOOK_KEY || "book-1.pdf", // Default fallback if env not provided
  },
  {
    id: "item-2",
    title: "Advanced React Patterns",
    subtitle: "Mastering Component Architecture",
    price: 599,
    priceDisplay: "₹599",
    coverImage: "/book-cover.png", // Assuming same cover for now
    description: `Take your React skills to the next level with Advanced React Patterns. This deep dive into component architecture will teach you how to build flexible, reusable, and performant user interfaces.

Inside you'll find:
• Compound Components
• Render Props & Higher-Order Components
• Advanced Hooks strategies
• Performance optimization techniques
• Managing complex state effectively

Perfect for developers who are comfortable with React fundamentals and want to master enterprise-grade patterns.`,
    pages: "300+",
    format: "PDF",
    lastUpdated: "March 2026",
    s3Key: "book-2.pdf",
  },
];

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id);
}
