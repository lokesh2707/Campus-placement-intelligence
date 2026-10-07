import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-3xl font-bold text-white mb-2">404 - Page Not Found</h2>
      <p className="text-slate-400 mb-6">The requested resource could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition"
      >
        Return Home
      </Link>
    </div>
  );
}
