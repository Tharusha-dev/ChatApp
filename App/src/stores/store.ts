import { API_URL } from '@/lib/config';
import { create } from 'zustand';
import { Worker, Website } from '@/types/types';

interface StoreState {
  workers: Worker[];
  websites: Website[];

  // Actions
  initializeStore: (initialWorkers: Worker[], initialWebsites: Website[]) => void;
  addWorker: (worker: Worker) => void;
  updateWorker: (workerId: string, field: keyof Worker, value: any) => void;
  removeWorker: (_id: string) => void;

  addWebsite: (website: Website) => void;
  updateWebsite: (websiteId: string, field: keyof Website, value: any) => void;
  removeWebsite: (_id: string) => void;

  assignWorkerToWebsite: (workerId: string, websiteId: string) => void;
  removeWorkerFromWebsite: (workerId: string, websiteId: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  workers: [],
  websites: [],


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
  removeWorker: (_id) =>
    set((state) => ({
      workers: state.workers.filter((w) => w._id !== _id),
      websites: state.websites.map((website) => ({
        ...website,
        workers: website.workers.filter((w) => w._id !== _id),
      })),
    })),

  // Add a website
  addWebsite: async (website) => {
    console.log("Adding website:", website);
    let newId = "";
    try {
      const response = await fetch(`${API_URL}/admin/websites/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: website.domain, metadata: website.metadata }),
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
  removeWebsite: (_id) =>
    set((state) => ({
      websites: state.websites.filter((w) => w._id !== _id),
    })),

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
