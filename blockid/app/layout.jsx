import './globals.css';
import { AuthProvider } from './contexts/AuthContext';
import LoadingScreenWrapper from './components/LoadingScreenWrapper';
import { Providers } from './providers';

export const metadata = {
  title: 'BlockID - Secure Digital Identity on Blockchain',
  description: 'A secure digital identity solution built on blockchain technology',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AuthProvider>
            <LoadingScreenWrapper>
              {children}
            </LoadingScreenWrapper>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
} 