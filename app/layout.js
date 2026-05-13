export const metadata = {
  title: 'Party Mode Sync',
  description: 'Host-controlled synced YouTube watch lobby',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
