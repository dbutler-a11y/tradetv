import { Role, SubscriptionTier, VerificationTier } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      subscriptionTier: SubscriptionTier;
      tradovateLinked: boolean;
      trader?: {
        id: string;
        displayName: string;
        verificationTier: VerificationTier;
      } | null;
    };
  }

  interface User {
    id: string;
    role?: Role;
    subscriptionTier?: SubscriptionTier;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: Role;
    subscriptionTier?: SubscriptionTier;
  }
}
