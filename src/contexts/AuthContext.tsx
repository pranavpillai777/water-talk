import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'ngo';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Mock users for demonstration
  const mockUsers = [
    { _id: '1', name: 'Pranav Pillai', email: 'pranav.pillai@somaiya.edu', password: 'password', role: 'citizen' as const },
    { _id: '2', name: 'Green NGO', email: 'ngo@example.com', password: 'password123', role: 'ngo' as const },
  ];

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password && u.role === role);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const signup = async (userData: any): Promise<boolean> => {
    // Mock signup - in real app, this would call API
    const newUser = {
      _id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check for existing user on load
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};