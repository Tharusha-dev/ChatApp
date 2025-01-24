"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/stores/store";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import { useUppyEvent } from "@uppy/react";
import Tus from "@uppy/tus";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import SettingsDropdown from "./settings";

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
  const updateWebsiteMetadata = useStore(
    (state) => state.updateWebsiteMetadata
  );
  const fetchWebsiteMetadata = useStore((state) => state.fetchWebsiteMetadata);

  // Initialize Uppy
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        allowedFileTypes: ["image/*"],
        maxNumberOfFiles: 1,
      },
    }).use(Tus, { endpoint: "https://app.chatzu.ai/files/" })
  );

  // Handle successful file upload
  useUppyEvent(uppy, "upload-success", (file, response) => {
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h2 className="text-3xl font-bold mb-4 sm:mb-0">Website Metadata</h2>
        <SettingsDropdown />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription className="text-lg">
            Update the website's title and favicon. Changes will be applied globally for all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6">
              <div className="grid sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right hidden sm:block">
                  Website Title
                </Label>
                <div className="sm:col-span-3">
                  <Label htmlFor="title" className="sm:hidden mb-2 block">
                    Website Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter website title"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-4 items-start gap-4">
                <Label htmlFor="favicon" className="text-right hidden sm:block pt-2">
                  Favicon
                </Label>
                <div className="sm:col-span-3 space-y-4">
                  <Label htmlFor="favicon" className="sm:hidden mb-2 block">
                    Favicon
                  </Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Upload Favicon
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[850px] w-[90vw] sm:w-[800px]">
                      <Dashboard uppy={uppy} />
                    </DialogContent>
                  </Dialog>
                  {favicon && (
                    <div className="flex items-center gap-3 bg-muted p-3 rounded-md">
                      <img
                        src={favicon || "/placeholder.svg"}
                        alt="Favicon preview"
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm text-muted-foreground">Current favicon preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                {isUpdating ? "Updating..." : "Update Website Data"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
