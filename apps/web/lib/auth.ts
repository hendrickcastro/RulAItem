import { NextAuthOptions, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GitHubProvider from 'next-auth/providers/github';
import { usersRepository } from '@kontexto/db';
import { UserSchema } from '@kontexto/core';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  pages: {
    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
    error: '/api/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        try {
          // Create or update user in our database
          const userData = {
            email: user.email!,
            name: user.name!,
            avatar: user.image,
            githubId: String(profile.id),
          };

          // Validate user data
          const validatedData = UserSchema.omit({ 
            id: true, 
            createdAt: true, 
            updatedAt: true 
          }).parse(userData);

          await usersRepository.createOrUpdate(validatedData);
          
          return true;
        } catch (error) {
          console.error('Error creating/updating user:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, account, profile, user }): Promise<JWT> {
      // Initial sign in
      if (account && profile) {
        token.githubId = profile.id as string;
        token.accessToken = account.access_token;
      }

      // Get user from database
      if (token.githubId) {
        try {
          const dbUser = await usersRepository.findByGithubId(token.githubId as string);
          if (dbUser) {
            token.userId = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.avatar;
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.userId as string;
        session.user.githubId = token.githubId as string;
        session.accessToken = token.accessToken as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      githubId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
  }

  interface User {
    githubId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    githubId?: string;
    accessToken?: string;
  }
}