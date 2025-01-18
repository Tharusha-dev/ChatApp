"use client"
import { API_URL } from '@/lib/config';
import { create } from 'zustand';
import { Worker, Website } from '@/types/types';
import { getCookie } from 'cookies-next';

const token = getCookie("userToken") as string;

interface WebsiteMetadata {
  title: string;
  favicon: string;
}

interface StoreState {
  workers: Worker[];
  websites: Website[];
  websiteMetadata: WebsiteMetadata;
  updateWebsiteMetadata: (metadata: Partial<WebsiteMetadata>) => Promise<void>;
  fetchWebsiteMetadata: () => Promise<void>;
  // Actions
  initializeStore: (initialWorkers: Worker[], initialWebsites: Website[]) => void;
  addWorker: (worker: Worker) => Promise<void>;
  updateWorker: (workerId: string, field: keyof Worker, value: any) => Promise<void>;
  removeWorker: (_id: string) => Promise<void>;

  addWebsite: (website: Website) => Promise<void>;
  updateWebsite: (websiteId: string, field: keyof Website, value: any) => Promise<void>;
  removeWebsite: (_id: string) => Promise<void>;

  assignWorkerToWebsite: (workerId: string, websiteId: string) => Promise<void>;
  removeWorkerFromWebsite: (workerId: string, websiteId: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  workers: [],
  websites: [],
  websiteMetadata: {
    title: "",
    favicon: "",
  },
  fetchWebsiteMetadata: async () => {
    try {
      const response = await fetch(`${API_URL}/website-metadata`, {
        headers: {
          auth: token,
        },
      });
      const data = await response.json();
      set({ websiteMetadata: data });
    } catch (error) {
      console.error('Failed to fetch website metadata:', error);
    }
  },

  updateWebsiteMetadata: async (metadata) => {
    try {
      const response = await fetch(`${API_URL}/admin/website-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          auth: token,
        },
        body: JSON.stringify(metadata),
      });
      
      if (!response.ok) throw new Error('Failed to update website metadata');
      
      const data = await response.json();
      set({ websiteMetadata: data });
    } catch (error) {
      console.error('Failed to update website metadata:', error);
      throw error;
    }
  },
  initializeStore: (initialWorkers: Worker[], initialWebsites: Website[]) =>
    set(() => ({
      workers: initialWorkers,
      websites: initialWebsites,
    })),


  // Add a worker
  addWorker: async (worker) => {
    console.log("Adding worker:", worker);
    let newId = "";
    try {
      const response = await fetch(`${API_URL}/worker/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({email: worker.email, password: worker.password, name: worker.name}),
      });
      const data = await response.json();
      console.log("Worker added:", data);
      newId = data;
    } catch (error) {
      console.error("Error adding worker:", error);
    }
    set((state) => ({
      workers: [...state.workers, {...worker, _id: newId}],
    }));
  },


  // Remove a worker
  removeWorker: async (_id) => {
    try {
      const response = await fetch(`${API_URL}/admin/worker/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({ workerId: _id }),
      });
      const data = await response.json();
      console.log("Worker removed:", data);
    } catch (error) {
      console.error("Error removing worker:", error);
    }

    set((state) => ({
      workers: state.workers.filter((w) => w._id !== _id),
      websites: state.websites.map((website) => ({
        ...website,
        workers: website.workers.filter((w) => w._id !== _id),
      })),
    }));
  },

  // Add a website
  addWebsite: async (website) => {
    console.log("Adding website:", website);
    let newId = "";
    try {
      const response = await fetch(`${API_URL}/admin/websites/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({ domain: website.domain, metadata: website.metadata, chat_icon: website.chat_icon }),
      });
      const data = await response.json();
      console.log("Website added:", data);
      newId = data;
    } catch (error) {
      console.error("Error adding website:", error);
    }



    set((state) => ({
      websites: [...state.websites, {...website, _id: newId}],
    }));
  },


  updateWorker: async (workerId: string, field: keyof Worker, value: any) =>
  {

    try{
      const response = await fetch(`${API_URL}/admin/worker/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({workerId, field, value}),
      });
      const data = await response.json();
      console.log("Worker updated:", data);
    } catch (error) {
      console.error("Error updating worker:", error);
    }

    set((state) => ({
      workers: state.workers.map((worker) =>
        worker._id === workerId ? { ...worker, [field]: value } : worker
      ),
    }))
  },

  // Update a specific field of a website
  updateWebsite: async (websiteId: string, field: keyof Website, value: any) => {

    try{
      const response = await fetch(`${API_URL}/admin/websites/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({websiteId, field, value}),
      });
      const data = await response.json();
      console.log("Website updated:", data);
    } catch (error) {
      console.error("Error updating website:", error);
    }

    set((state) => ({
      websites: state.websites.map((website) =>
        website._id === websiteId ? { ...website, [field]: value } : website
      ),
    }))
  },


  // Remove a website
  removeWebsite: async (_id) => {

    try{
      const response = await fetch(`${API_URL}/admin/websites/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({websiteId: _id}),
      });
      const data = await response.json();
      console.log("Website removed:", data);
    } catch (error) {
      console.error("Error removing website:", error);
    }
    
    set((state) => ({
      websites: state.websites.filter((w) => w._id !== _id),
    }));
  },

  // Assign a worker to a website
  assignWorkerToWebsite: async (workerId, websiteId) => {
    const worker = get().workers.find((w) => w._id === workerId);
    const website = get().websites.find((w) => w._id === websiteId);
    if (!worker || !website) return;

    try {
      const response = await fetch(`${API_URL}/admin/websites/add-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({websiteId, workerId}),
      });
      const data = await response.json();
      console.log("Worker assigned to website:", data);
    } catch (error) {
      console.error("Error assigning worker to website:", error);
    }

    set((state) => ({
      websites: state.websites.map((website) =>
        website._id === websiteId
          ? {
              ...website,
              workers: [...website.workers, worker],
            }
          : website
      ),
      workers: state.workers.map((w) =>
        w._id === workerId
          ? {
              ...w,
              websites: [...w.websites, website],
            }
          : w
      ),
    }));
  },

  // Remove a worker from a website
  removeWorkerFromWebsite: async (workerId, websiteId) => {
    try {
      const response = await fetch(`${API_URL}/admin/websites/remove-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: token,
        },
        body: JSON.stringify({websiteId, workerId}),
      });
      const data = await response.json();
      console.log("Worker removed from website:", data);
    } catch (error) {
      console.error("Error removing worker from website:", error);
    }

    set((state) => ({
      websites: state.websites.map((website) =>
        website._id === websiteId
          ? {
              ...website,
              workers: website.workers.filter((w) => w._id !== workerId),
            }
          : website
      ),
      workers: state.workers.map((worker) =>
        worker._id === workerId
          ? {
              ...worker,
              websites: worker.websites.filter((w) => w._id !== websiteId),
            }
          : worker
      ),
    }));
  },
}));
