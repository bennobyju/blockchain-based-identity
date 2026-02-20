import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ethers } from "ethers";

// Message that user will sign
const MESSAGE_TO_SIGN = "Sign this message to verify your identity with BlockID.";

/**
 * NextAuth configuration with Ethereum wallet authentication
 */
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: "web3",
      name: "Web3",
      credentials: {
        address: { label: "Address", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.address || !credentials?.signature) {
            return null;
          }

          // Verify the signature
          const address = await ethers.verifyMessage(
            MESSAGE_TO_SIGN,
            credentials.signature
          );

          // Check if the recovered address matches the provided address
          if (address.toLowerCase() !== credentials.address.toLowerCase()) {
            console.error("Signature verification failed");
            return null;
          }

          // Return the user object
          return {
            id: credentials.address,
            address: credentials.address,
            name: `${credentials.address.substring(0, 6)}...${credentials.address.substring(38)}`,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.address) {
        session.user.address = token.address;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Custom sign-in page
    error: "/", // Error page
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 