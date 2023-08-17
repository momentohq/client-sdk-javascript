import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        const user = { id: "1", name: "Mo", email: "mo@momentohq.com" };

        const envUsername = String(process.env.MOMENTO_AUTH_USERNAME);
        const envPassword = String(process.env.MOMENTO_AUTH_PASSWORD);
        if (!envUsername || !envPassword) {
          throw new Error(
            "Username and/or password not detected in environment variables",
          );
        }

        const credUsername = credentials?.username;
        const credPassword = credentials?.password;
        if (!credUsername || !credPassword) {
          throw new Error("Username and/or password not provided by user");
        }

        if (envUsername === credUsername && envPassword === credPassword) {
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
    // Add other providers below, full list here: https://next-auth.js.org/providers/
    // Auth0Provider({
    //   clientId: process.env.AUTH0_CLIENT_ID,
    //   clientSecret: process.env.AUTH0_CLIENT_SECRET,
    //   issuer: process.env.AUTH0_ISSUER
    // }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET
    // }),
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
