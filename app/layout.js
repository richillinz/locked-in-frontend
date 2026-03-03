import '@livekit/components-styles';
import './globals.css';

export const metadata = {
  title: "Locked-In",
  description: "Bid for your hour. Own the frequency.",
};

import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
