import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "Caregiver" | "Standard User";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role: "Caregiver" | "Standard User",
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isCaregiver: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isCaregiver = user?.role === "Caregiver";

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          try {
            const response = await fetch("/api/auth/profile", {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });

            if (!response.ok) {
              // Check if it's a service unavailable error (MongoDB down)
              if (response.status === 503) {
                console.log(
                  "🔄 Authentication service unavailable - using demo mode",
                );
                // Keep stored user but mark as demo mode
                const demoUser = {
                  id: "demo-user",
                  username: "DemoUser",
                  email: "demo@example.com",
                  role: "Caregiver" as const,
                  createdAt: new Date().toISOString(),
                };
                setUser(demoUser);
                setToken("demo-token");
                return;
              }

              // Token is invalid, clear storage
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_user");
              setToken(null);
              setUser(null);
            }
          } catch (error) {
            console.error("Token validation error:", error);
            // If network error, try demo mode
            console.log("🔄 Network error - trying demo mode");
            const demoUser = {
              id: "demo-user",
              username: "DemoUser",
              email: "demo@example.com",
              role: "Caregiver" as const,
              createdAt: new Date().toISOString(),
            };
            setUser(demoUser);
            setToken("demo-token");
          }
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      // Check for service unavailable first (before reading body)
      if (response.status === 503) {
        console.log("🔄 Authentication service unavailable - using demo mode");
        const demoUser = {
          id: "demo-user",
          username: username,
          email: "demo@example.com",
          role: "Caregiver" as const,
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        setToken("demo-token");
        localStorage.setItem("auth_token", "demo-token");
        localStorage.setItem("auth_user", JSON.stringify(demoUser));
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token);
      setUser(data.user);

      // Store in localStorage
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      console.log(
        `✅ Login successful: ${data.user.username} (${data.user.role})`,
      );
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: "Caregiver" | "Standard User",
  ): Promise<void> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      // Check for service unavailable first (before reading body)
      if (response.status === 503) {
        console.log("🔄 Authentication service unavailable - using demo mode");
        const demoUser = {
          id: "demo-user",
          username: username,
          email: email,
          role: role,
          createdAt: new Date().toISOString(),
        };
        setUser(demoUser);
        setToken("demo-token");
        localStorage.setItem("auth_token", "demo-token");
        localStorage.setItem("auth_user", JSON.stringify(demoUser));
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setToken(data.token);
      setUser(data.user);

      // Store in localStorage
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      console.log(
        `✅ Registration successful: ${data.user.username} (${data.user.role})`,
      );
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("userVideos"); // Clear user videos on logout

    console.log("✅ Logout successful");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isCaregiver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
