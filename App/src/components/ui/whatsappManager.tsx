import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
// import { socket } from "@/lib/socket"; // Assuming you have socket setup
import { API_URL } from "@/lib/config";
import SettingsDropdown from "./settings";
import { WHATSAPP_CLIENTS } from "@/lib/config";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";

export default function WhatsappManager({ socket }: { socket: any }) {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "authenticated">(
    "idle"
  );

  useEffect(() => {
    if (!open) {
      setQrCode(null);
      setStatus("idle");
      return;
    }

    // Check authentication status
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/whatsapp-status?id=${selectedClient}`
        );
        const data = await response.json();
        if (data.authenticated) {
          setStatus("authenticated");
        } else {
          setStatus("waiting");
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    if (selectedClient) {
      checkStatus();
    }
  }, [open, selectedClient]);

  useEffect(() => {
    // Socket listeners
    const handleQR = (data: { qr: string; id: string }) => {
      console.log("qr received", data);
      if (data.id === selectedClient) {
        setQrCode(data.qr);
      }
    };

    const handleAuthenticated = (data: { id: string }) => {
      if (data.id === selectedClient) {
        setStatus("authenticated");
      }
    };

    socket.on("qr", handleQR);
    socket.on("authenticated", handleAuthenticated);

    return () => {
      socket.off("qr", handleQR);
      socket.off("authenticated", handleAuthenticated);
    };
  }, [selectedClient]);

  const handleScanClick = (clientId: string) => {
    setSelectedClient(clientId);
    setOpen(true);
  };

  const columns: ColumnDef<(typeof WHATSAPP_CLIENTS)[0]>[] = [
    {
      accessorKey: "id",
      header: "Client ID",
    },
    {
      accessorKey: "number",
      header: "Number",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button onClick={() => handleScanClick(row.original.id)}>
            Scan QR Code
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: WHATSAPP_CLIENTS,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">WhatsApp Manager</h2>

        <div className="flex flex-col gap-2 items-end justify-end">
          <SettingsDropdown />
        </div>
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

      <div className="flex items-center justify-end space-x-2 mt-4">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>WhatsApp QR Code Scanner</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            {status === "authenticated" ? (
              <div className="text-green-600 font-medium">
                WhatsApp is authenticated successfully!
              </div>
            ) : status === "waiting" && !qrCode ? (
              <div className="text-gray-600">Waiting for QR code...</div>
            ) : (
              qrCode && <QRCodeSVG value={qrCode} size={256} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
