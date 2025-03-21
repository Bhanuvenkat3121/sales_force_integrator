import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { analyzeTicket } from "./openai";
import { notifyNewTicket } from "./slack";
import { insertTicketSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast ticket updates to all connected clients
  function broadcastTicketUpdate() {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        storage.getAllTickets().then((tickets) => {
          client.send(JSON.stringify({ type: "tickets", data: tickets }));
        });
      }
    });
  }

  // Tickets API routes
  app.post("/api/tickets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const ticketData = insertTicketSchema.parse(req.body);
      
      // Analyze ticket with AI
      const analysis = await analyzeTicket(ticketData.description);
      
      // Create ticket with AI suggestions
      const ticket = await storage.createTicket({
        ...ticketData,
        category: analysis.category,
        priority: analysis.priority,
      });

      // Update ticket with AI response
      const updatedTicket = await storage.updateTicket(ticket.id, {
        suggestedResponse: analysis.suggestedResponse
      });

      // Send Slack notification
      await notifyNewTicket(updatedTicket);

      // Broadcast update
      broadcastTicketUpdate();

      res.status(201).json(updatedTicket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tickets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const ticket = await storage.updateTicket(parseInt(req.params.id), req.body);
      broadcastTicketUpdate();
      res.json(ticket);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  });

  return httpServer;
}
