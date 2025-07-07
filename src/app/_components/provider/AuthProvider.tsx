"use client";

import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/pocketbase/client";
import type {
  AuthProviderInfo,
  BaseAuthStore,
  RecordModel as PbRecord,
} from "pocketbase";

interface PbUser {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: PbUser | null;
  pbAuthStore: BaseAuthStore;
  isLoading: boolean;
  googleSignIn: VoidFunction;
  githubSignIn: VoidFunction;
  discordSignIn: VoidFunction;
  setUserData: (user: PbRecord) => void;
  signOut: VoidFunction;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const pb = createBrowserClient();
  const router = useRouter();

  const [user, setUser] = useState<PbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthProvider, setGoogleAuthProvider] =
    useState<AuthProviderInfo | null>(null);
  const [githubAuthProvider, setGithubAuthProvider] =
    useState<AuthProviderInfo | null>(null);
  const [discordAuthProvider, setDiscordAuthProvider] =
    useState<AuthProviderInfo | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authMethods = await pb.collection("users").listAuthMethods();

        if (authMethods) {
          for (const provider of authMethods.oauth2.providers) {
            if (provider.name === "google") setGoogleAuthProvider(provider);
            if (provider.name === "github") setGithubAuthProvider(provider);
            if (provider.name === "discord") setDiscordAuthProvider(provider);
          }
        }

        if (pb.authStore.isValid) {
          await setUserData(pb.authStore.record as PbRecord);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setUserData = async (pbUser: PbRecord) => {
    const { id, name, email, username, avatarUrl } = pbUser;
    setUser({ id, name, email, username, avatarUrl });
  };

  const googleSignIn = () => {
    signOut();
    localStorage.setItem("provider", JSON.stringify(googleAuthProvider));
    const redirectUrl = `${location.origin}/signin`;
    const url = googleAuthProvider?.authURL + redirectUrl;

    router.push(url);
  };

  const githubSignIn = () => {
    signOut();
    localStorage.setItem("provider", JSON.stringify(githubAuthProvider));
    const redirectUrl = `${location.origin}/signin`;
    const url = githubAuthProvider?.authURL + redirectUrl;

    router.push(url);
  };

  const discordSignIn = () => {
    signOut();
    localStorage.setItem("provider", JSON.stringify(discordAuthProvider));
    const redirectUrl = `${location.origin}/signin`;
    const url = discordAuthProvider?.authURL + redirectUrl;

    router.push(url);
  };

  const signOut = () => {
    setUser(null);
    pb.authStore.clear();
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        pbAuthStore: pb.authStore,
        isLoading,
        googleSignIn,
        githubSignIn,
        discordSignIn,
        setUserData,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const usePbAuth = () => useContext(AuthContext) as AuthContextType;
export default AuthWrapper;
