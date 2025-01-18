"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/stores/store";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import { useUppyEvent } from '@uppy/react';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

interface WebsiteMetadata {
  title: string;
  favicon: string;
}

export default function WebsiteData() {
  const [title, setTitle] = useState<string>("");
  const [favicon, setFavicon] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const websiteMetadata = useStore((state) => state.websiteMetadata);
  const updateWebsiteMetadata = useStore((state) => state.updateWebsiteMetadata);
  const fetchWebsiteMetadata = useStore((state) => state.fetchWebsiteMetadata);

  // Initialize Uppy
  const [uppy] = useState(() => new Uppy({
    restrictions: {
      allowedFileTypes: ['image/*'],
      maxNumberOfFiles: 1
    }
  }).use(Tus, { endpoint: 'https://app.chatzu.ai/files/' }));

  // Handle successful file upload
  useUppyEvent(uppy, 'upload-success', (file, response) => {
    const fileUrl = response.uploadURL;
    console.log(fileUrl);
    setFavicon(fileUrl as string);
    toast({
      title: "Success",
      description: "Favicon uploaded successfully",
    });
  });

  // Load saved values from backend on mount
  useEffect(() => {
    fetchWebsiteMetadata();
  }, []);

  // Update local state when store data changes
  useEffect(() => {
    if (websiteMetadata) {
      setTitle(websiteMetadata.title || "");
      setFavicon(websiteMetadata.favicon || "");
    }
  }, [websiteMetadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
        console.log(title, favicon);
      await updateWebsiteMetadata({
        title,
        favicon,
      });

      toast({
        title: "Success",
        description: "Website data updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update website data",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
   

      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Website Data</CardTitle>
            <CardDescription>
              Update your website's title and favicon. Changes will be applied globally for all users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Website Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter website title"
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="favicon" className="text-right">
                    Favicon
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Upload Favicon
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[850px] w-[800px]">
                        <Dashboard uppy={uppy} />
                      </DialogContent>
                    </Dialog>
                    {favicon && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={favicon} 
                          alt="Favicon preview" 
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm text-muted-foreground">
                          Current favicon preview
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Website Data"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
