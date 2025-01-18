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
import {API_URL} from '@/lib/config'
import SettingsDropdown from "./settings";
import { WHATSAPP_CLIENTS } from "@/lib/config";

export default function WhatsappManager({socket}: {socket: any}) {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "authenticated">("idle");

  useEffect(() => {
    if (!open) {
      setQrCode(null);
      setStatus("idle");
      return;
    }

    // Check authentication status
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/whatsapp-status?id=${selectedClient}`);
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

  return (
    <div className="container mx-auto py-10">
       <div className="flex flex-col gap-2 items-end justify-end">
       <SettingsDropdown />
       </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client ID</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WHATSAPP_CLIENTS.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.id}</TableCell>
              <TableCell>{client.number}</TableCell>
              <TableCell>
                <Button onClick={() => handleScanClick(client.id)}>
                  Scan QR Code
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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