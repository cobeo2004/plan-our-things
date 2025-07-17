"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { createBrowserClient } from "@/lib/pocketbase/client";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (user) => {
      toast.success("Welcome back!");
      router.replace("/");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDiscordSignIn = async () => {
    const pb = createBrowserClient();
    const auth = await pb.collection("users").authWithOAuth2({
      provider: "discord",
    });

    if (auth.record) {
      toast.success("Welcome back!");
      router.replace("/");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">POT</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDiscordSignIn}
            className="w-full bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.317 4.37C18.7873 3.68087 17.147 3.1982 15.4319 3.00013C15.4007 2.99565 15.3695 3.00962 15.3534 3.03777C15.1424 3.40766 14.9087 3.89148 14.7451 4.26718C12.9004 4.08614 11.0652 4.08614 9.25832 4.26718C9.09465 3.8818 8.85248 3.40766 8.64057 3.03777C8.62448 3.01055 8.59328 2.99658 8.56205 3.00013C6.84703 3.19729 5.20667 3.67996 3.677 4.37C3.66368 4.37543 3.65233 4.38411 3.64479 4.39552C0.533392 9.09901 -0.31895 13.6874 0.0991801 18.2226C0.101072 18.2459 0.11337 18.2677 0.130398 18.2818C2.18321 19.7902 4.17171 20.6986 6.12328 21.2466C6.15451 21.2556 6.18761 21.2443 6.20748 21.2174C6.66913 20.5773 7.08064 19.9026 7.43348 19.1955C7.4543 19.1519 7.43442 19.1006 7.38887 19.0835C6.73667 18.8418 6.1176 18.5453 5.53446 18.2051C5.48412 18.1738 5.48039 18.0986 5.52677 18.0626C5.65446 17.9647 5.78216 17.8625 5.90409 17.7588C5.92577 17.7406 5.95613 17.736 5.98172 17.7466C9.88321 19.5329 14.1415 19.5329 18.0008 17.7466C18.0264 17.7354 18.0568 17.74 18.0795 17.7582C18.2014 17.8619 18.3291 17.9647 18.4578 18.0626C18.5042 18.0986 18.5015 18.1738 18.4511 18.2051C17.868 18.5506 17.2489 18.8418 16.5967 19.0826C16.5511 19.0997 16.5322 19.1519 16.553 19.1955C16.9154 19.9011 17.3269 20.5758 17.7789 21.2166C17.7978 21.2443 17.8319 21.2556 17.8631 21.2466C19.8241 20.6986 21.8126 19.7902 23.8654 18.2818C23.8834 18.2677 23.8948 18.2466 23.8967 18.2233C24.3971 12.8925 23.0585 8.34194 20.3482 4.39645C20.3416 4.38411 20.3303 4.37543 20.317 4.37ZM8.02002 15.3157C6.8375 15.3157 5.86313 14.2318 5.86313 12.8627C5.86313 11.4936 6.8186 10.4097 8.02002 10.4097C9.23087 10.4097 10.1958 11.5029 10.1769 12.8627C10.1769 14.2318 9.22144 15.3157 8.02002 15.3157ZM15.9947 15.3157C14.8123 15.3157 13.8379 14.2318 13.8379 12.8627C13.8379 11.4936 14.7933 10.4097 15.9947 10.4097C17.2056 10.4097 18.1705 11.5029 18.1516 12.8627C18.1516 14.2318 17.2056 15.3157 15.9947 15.3157Z"
                fill="#5865F2"
              />
            </svg>
            Sign in with Discord
          </button>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
