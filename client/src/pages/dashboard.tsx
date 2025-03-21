import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainNav from "@/components/layout/main-nav";
import TicketForm from "@/components/tickets/ticket-form";
import TicketList from "@/components/tickets/ticket-list";
import TicketStats from "@/components/tickets/ticket-stats";
import { Card } from "@/components/ui/card";
import { Ticket } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "tickets") {
        queryClient.setQueryData(["/api/tickets"], data.data);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 col-span-2">
            <TicketStats tickets={tickets} />
          </Card>
          <Card className="p-4">
            <TicketForm />
          </Card>
        </div>
        <Card className="p-4">
          <TicketList tickets={tickets} />
        </Card>
      </main>
    </div>
  );
}
