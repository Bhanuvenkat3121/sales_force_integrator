import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Support tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // High, Medium, Low
  category: text("category").notNull(), // Billing, Technical, General
  status: text("status").notNull().default("New"), // New, In Progress, Resolved
  assignedTeam: text("assigned_team").notNull(),
  suggestedResponse: text("suggested_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  subject: true,
  description: true,
  priority: true,
  category: true,
  assignedTeam: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export const ticketPriorities = ["High", "Medium", "Low"] as const;
export const ticketCategories = ["Billing", "Technical", "General"] as const;
export const ticketStatuses = ["New", "In Progress", "Resolved"] as const;
export const teamNames = ["Billing Team", "Technical Team", "General Support"] as const;
