import './globals.css';
import Providers from './providers';

export const metadata = {
  title: "Locked-In",
  description: "Bid for your hour. Own the frequency.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
