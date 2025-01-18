"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { setCookie, hasCookie, getCookie } from "cookies-next/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (hasCookie("userToken") && getCookie("userToken") !== 'undefined') {
      router.push("/");
    }
  }, []);


  async function login() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/worker/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (res.status === 401) {
        setError("Invalid email or password");
    setLoading(false);

        return;
      }
      
      const data = await res.json();
      setCookie("userToken", data.token);
      router.push("/");
    } catch (error) {
      console.error(error);
      setError("An error occurred. Please try again.");
    setLoading(false);

    }
    setLoading(false);
  }

  return (
    <div className="outer w-full h-screen flex justify-center items-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              onClick={login}
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </Button>
          </div>
        
            <div className="mt-4">
              <Link href="/signup">
                Register instead
              </Link>
            </div>
       
        </CardContent>
      </Card>
    </div>
  );
}
