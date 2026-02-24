import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User } from './types';
import { io, Socket } from 'socket.io-client';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  socket: Socket | null;
  onlineUsers: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/tenants/apex');
        if (res.ok) {
          const tenantData = await res.json();
          setTenant(tenantData);
          if (tenantData.primary_color) {
            document.documentElement.style.setProperty('--brand-primary', tenantData.primary_color);
          }
        }

        const token = localStorage.getItem('apex_token');
        if (token) {
          const meRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (meRes.ok) {
            const userData = await meRes.json();
            setUser(userData);
          } else {
            localStorage.removeItem('apex_token');
          }
        }
      } catch (e) {
        console.error("Failed to load tenant or session", e);
      } finally {
        // Ensure loading is always disabled after a short delay to prevent hanging
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io();
      setSocket(newSocket);

      newSocket.emit('join', { user });

      newSocket.on('presence_update', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [user]);

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from login:", text);
        throw new Error(`Server error: Expected JSON but received ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('apex_token', data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error("Login client error:", err);
      throw err;
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from signup:", text);
        throw new Error(`Server error: Expected JSON but received ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      localStorage.setItem('apex_token', data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error("Signup client error:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, isLoading, login, signup, logout, socket, onlineUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
