import { User, InsertUser, Ticket, InsertTicket } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getAllTickets(): Promise<Ticket[]>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private userId: number;
  private ticketId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.userId = 1;
    this.ticketId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.ticketId++;
    const now = new Date();
    const ticket: Ticket = {
      ...insertTicket,
      id,
      status: "New",
      suggestedResponse: "",
      createdAt: now,
      updatedAt: now,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const ticket = await this.getTicket(id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
}

export const storage = new MemStorage();
