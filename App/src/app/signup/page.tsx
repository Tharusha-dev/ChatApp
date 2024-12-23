"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function Signup() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [name, setName] = useState("");
const [successMessage, setSuccessMessage] = useState("");
const router = useRouter();

async function signup() {
    setLoading(true);
    setSuccessMessage("");
    try {   
        const res = await fetch(`${API_URL}/worker/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                },
            body: JSON.stringify({email, password, name}),
        });
        const data = await res.json();
        
        if (res.ok) {
            setSuccessMessage(data.message);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    }catch(error) {
        console.error(error);
    }
    setLoading(false);
}


    return (
        <div className="outer w-full h-screen flex justify-center items-center">
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Signup</CardTitle>
        <CardDescription>Enter your email and password to signup to your account</CardDescription>
      </CardHeader>
      <CardContent> 
        {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {successMessage}
            </div>
        )}
        <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" onClick={signup} disabled={loading}>
            {loading ? "Loading..." : "Signup"}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}