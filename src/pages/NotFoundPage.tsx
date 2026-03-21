import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center text-center">
    <p className="text-8xl font-serif text-foreground">404</p>
    <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
    <Link
      to="/"
      className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 px-6 py-2 text-sm font-bold text-foreground hover:border-primary/40"
    >
      Back to Dashboard
    </Link>
  </div>
);

export default NotFoundPage;
