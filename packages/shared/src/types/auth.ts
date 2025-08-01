export interface User {
  id: string;
  troopId: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "leader" | "scout" | "viewer";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  troopSlug: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Troop {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}