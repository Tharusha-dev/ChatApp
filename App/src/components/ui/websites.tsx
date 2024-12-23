"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/stores/store";
import { Worker, Website } from "@/types/types";
import { EditWebsiteMetadata } from "./editWebsiteMetadata";
import { CodeDialog } from "./copy-code";
import { useToast } from "@/hooks/use-toast"
import { ChatIconDropdown } from "./chatIconDropdown";


export default function Websites() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);

  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);


  const [newWebsite, setNewWebsite] = useState<any>({
    _id: "",
    domain: "",
    chat_icon: "https://www.svgrepo.com/show/529481/chat-round-dots.svg ",
    workers: [],
    metadata: {
      title: "Welcome to Support",
      description: "Ask us anything",
      msg_1: `Welcome to support. How do you want to contact us? Whatsapp, Telegram, Live chat.`,
      msg_2: "What is your name?",
      msg_3: "What is your email?",
      msg_4: "How can we help?",
    }
  })

  const [msg_4, setMsg_4] = useState<string>("")

  const workers = useStore((state) => state.workers);
  const websites = useStore((state) => state.websites);
  const addWebsite = useStore((state) => state.addWebsite);

  const [domainError, setDomainError] = useState<string>("");

  const [isAddingWebsite, setIsAddingWebsite] = useState(false);
  const [isEditingWorkers, setIsEditingWorkers] = useState(false);
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRemovingWebsite, setIsRemovingWebsite] = useState(false);

  async function handleAddWebsite(){
    const domainExists = websites.some(
      (website) => website.domain.toLowerCase() === newWebsite.domain.toLowerCase()
    );

    if (domainExists) {
      setDomainError("A website with this domain already exists");
      return;
    }

    setDomainError("");
    setIsAddingWebsite(true);
    
    try {
      await addWebsite({
        _id: "",
        domain: newWebsite.domain,
        chat_icon: newWebsite.chat_icon,
        workers: [],
        metadata: {
          title: newWebsite.metadata.title,
          description: newWebsite.metadata.description,
          msg_1: newWebsite.metadata.msg_1,
          msg_2: newWebsite.metadata.msg_2,
          msg_3: newWebsite.metadata.msg_3,
          msg_4: newWebsite.metadata.msg_4,
        }
      });
      
      toast({
        title: "Success",
        description: "Website added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add website",
        variant: "destructive",
      });
    } finally {
      setIsAddingWebsite(false);
    }
  }


  const assignWorkerToWebsite = useStore(
    (state) => state.assignWorkerToWebsite
  );

  const removeWorkerFromWebsite = useStore(
    (state) => state.removeWorkerFromWebsite
  );

  const removeWebsite = useStore(
    (state) => state.removeWebsite
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  // const handleAddWorker = (websiteId: string, workerId: string) => {
  //   assignWorkerToWebsite(workerId, websiteId);
  // };

  const handleRemoveWorker = (websiteId: string, workerId: string) => {
    // Implementation here
  };

 
  async function handleEditConfirm(){
    if(!selectedWebsite?._id) return;
    
    setIsEditingWorkers(true);
    
    try {
      const addedWorkers = selectedWorkers.filter(
        worker => !selectedWebsite.workers.some(
          originalWorker => originalWorker._id === worker._id
        )
      );
    
      const removedWorkers = selectedWebsite.workers.filter(
        originalWorker => !selectedWorkers.some(
          worker => worker._id === originalWorker._id
        )
      );
    
      console.log("Added workers:", addedWorkers);
      console.log("Removed workers:", removedWorkers);

      await Promise.all([
        ...addedWorkers.map(worker => 
          assignWorkerToWebsite(worker._id, selectedWebsite._id)
        ),
        ...removedWorkers.map(worker => 
          removeWorkerFromWebsite(worker._id, selectedWebsite._id)
        )
      ]);

      toast({
        title: "Success",
        description: "Workers updated successfully",
      });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workers",
        variant: "destructive",
      });
    } finally {
      setIsEditingWorkers(false);
    }
  }

  async function handleRemoveWebsite() {
    if (!selectedWebsite?._id) return;
    
    setIsRemovingWebsite(true);
    try {
      await removeWebsite(selectedWebsite._id);
      toast({
        title: "Success",
        description: "Website removed successfully",
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove website",
        variant: "destructive",
      });
    } finally {
      setIsRemovingWebsite(false);
    }
  }

  const columns: ColumnDef<Website>[] = [
    {
      accessorKey: "domain",
      header: "URL",
    },
    {
      id: "workers",
      header: "Workers",
      cell: ({ row }) => {
        const website = row.original;
        return (
          <div>
            {website.workers.map((worker) => (
              <span
                key={worker._id}
                className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
              >
                {worker.name}
                
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const website = row.original;
        return (
          <div className="flex gap-2">
            <CodeDialog website={website} />
            <EditWebsiteMetadata website={website} />
            <Button
              onClick={() => {
                setSelectedWebsite(website);
                setSelectedWorkers(website.workers);
                setDialogOpen(true);
              }}
            >
              Edit Workers
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSelectedWebsite(website);
                setDeleteDialogOpen(true);
              }}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: websites,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Websites</h2>
          <Input
            placeholder="Filter URLs..."
            value={
              (table.getColumn("domain")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("domain")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Website</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Website</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="domain" className="text-right">Domain</Label>
                <div className="col-span-3">
                  <Input
                    id="domain"
                    value={newWebsite.domain}
                    onChange={(e) => {
                      setDomainError("");
                      setNewWebsite({ ...newWebsite, domain: e.target.value });
                    }}
                    className={domainError ? "border-red-500" : ""}
                  />
                  {domainError && (
                    <p className="text-sm text-red-500 mt-1">{domainError}</p>
                  )}
                </div>
              </div>
        
             

              <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={newWebsite.metadata.title}
              className="col-span-3"
              onChange={(e) => setNewWebsite({ ...newWebsite, metadata: { ...newWebsite.metadata, title: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={newWebsite.metadata.description}
              className="col-span-3"
              onChange={(e) => setNewWebsite({ ...newWebsite, metadata: { ...newWebsite.metadata, description: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_1" className="text-right">
              Message 1
            </Label>
            <Input
              id="msg_1"
              value={newWebsite.metadata.msg_1}
              className="col-span-3"
              onChange={(e) => setNewWebsite({ ...newWebsite, metadata: { ...newWebsite.metadata, msg_1: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_2" className="text-right">
              Message 2
            </Label>
            <Input
              id="msg_2"
              
              value={newWebsite.metadata.msg_2}
              className="col-span-3"
              onChange={(e) => setNewWebsite({ ...newWebsite, metadata: { ...newWebsite.metadata, msg_2: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_3" className="text-right">
              Message 3
            </Label>
            <Input
              id="msg_3"
              
              value={newWebsite.metadata.msg_3}
              className="col-span-3"
              onChange={(e) => setNewWebsite({ ...newWebsite, metadata: { ...newWebsite.metadata, msg_3: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="msg_4" className="text-right">
              Message 4
            </Label>
            <Input
              id="msg_4"
              
              value={newWebsite.metadata.msg_4}
              className="col-span-3"
              onChange={(e) => setNewWebsite({ ...newWebsite, metadata: { ...newWebsite.metadata, msg_4: e.target.value } })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chat_icon" className="text-right">
              Chat Icon
            </Label>
            <ChatIconDropdown onSelect={(url)=>{setNewWebsite({...newWebsite, chat_icon: url})}} /> 
          </div>
            </div>
            <Button onClick={handleAddWebsite}>Add Website</Button>
          </DialogContent>
        </Dialog>

      </div>
    

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Worker to {selectedWebsite?.domain}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {workers.map((worker) => (
              <div key={worker._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`worker-${worker._id}`}
                  checked={selectedWorkers.some(selectedWorker => selectedWorker.email === worker.email)}
                  onCheckedChange={(e) => {
                    if (e) {
                      setSelectedWorkers([...selectedWorkers, worker]);
                    } else {
                      setSelectedWorkers(
                        selectedWorkers.filter((w) => w._id !== worker._id)
                      );
                    }
                  }}
                />
                <Label htmlFor={`worker-${worker._id}`}>{worker.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
          <Button
            onClick={handleEditConfirm}
          >
           Confirm
          </Button>
        </DialogFooter>
        </DialogContent>
    
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Website</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to remove {selectedWebsite?.domain}?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveWebsite}
              disabled={isRemovingWebsite}
            >
              {isRemovingWebsite ? "Removing..." : "Remove Website"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
