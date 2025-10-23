import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'ngo';
}

interface Report {
  reportId: string;
  userId: string;
  username: string;
  photo: string;
  description: string;
  location: { lat: number; lng: number };
  address: string;
  timestamp: string;
  status: 'Reported' | 'Active' | 'Completed';
  ngoList: string[];
  completionImage?: string;
  citizenApproval?: boolean;
}

interface NGOAction {
  reportId: string;
  ngoUsername: string;
  actionType: 'accepted' | 'completed';
  timestamp: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  reports: Report[];
  ngoActions: NGOAction[];
  addReport: (report: Omit<Report, 'reportId' | 'timestamp' | 'status' | 'ngoList'>) => void;
  acceptReport: (reportId: string, ngoUsername: string) => void;
  uploadCompletionImage: (reportId: string, imageUrl: string, ngoUsername: string) => void;
  approveCompletion: (reportId: string) => void;
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
  const [reports, setReports] = useState<Report[]>([]);
  const [ngoActions, setNgoActions] = useState<NGOAction[]>([]);

  // Mock users for demonstration
  const mockUsers = [
    { _id: '1', name: 'Pranav Pillai', email: 'pranav.pillai@somaiya.edu', password: 'password', role: 'citizen' as const },
    { _id: '2', name: 'Green NGO', email: 'pranav.pillai@somaiya.com', password: 'password', role: 'ngo' as const },
  ];

  const addReport = (reportData: Omit<Report, 'reportId' | 'timestamp' | 'status' | 'ngoList'>) => {
    const newReport: Report = {
      ...reportData,
      reportId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'Reported',
      ngoList: [],
    };
    setReports(prev => [newReport, ...prev]);
  };

  const acceptReport = (reportId: string, ngoUsername: string) => {
    setReports(prev => prev.map(report => {
      if (report.reportId === reportId && !report.ngoList.includes(ngoUsername)) {
        return {
          ...report,
          status: 'Active',
          ngoList: [...report.ngoList, ngoUsername]
        };
      }
      return report;
    }));

    const newAction: NGOAction = {
      reportId,
      ngoUsername,
      actionType: 'accepted',
      timestamp: new Date().toISOString()
    };
    setNgoActions(prev => [...prev, newAction]);
  };

  const uploadCompletionImage = (reportId: string, imageUrl: string, ngoUsername: string) => {
    setReports(prev => prev.map(report => {
      if (report.reportId === reportId) {
        return {
          ...report,
          completionImage: imageUrl
        };
      }
      return report;
    }));

    const newAction: NGOAction = {
      reportId,
      ngoUsername,
      actionType: 'completed',
      timestamp: new Date().toISOString()
    };
    setNgoActions(prev => [...prev, newAction]);
  };

  const approveCompletion = (reportId: string) => {
    setReports(prev => prev.map(report => {
      if (report.reportId === reportId) {
        return {
          ...report,
          status: 'Completed',
          citizenApproval: true
        };
      }
      return report;
    }));
  };
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

    // Initialize with some mock reports for demonstration
    if (reports.length === 0) {
      const mockReports: Report[] = [
        {
          reportId: '1',
          userId: '1',
          username: 'John Citizen',
          photo: 'https://images.pexels.com/photos/3560167/pexels-photo-3560167.jpeg',
          description: 'Stagnant water with algae growth near Thane Creek',
          location: { lat: 19.2183, lng: 72.9781 },
          address: 'Thane Creek, Thane',
          timestamp: '2025-01-15T10:30:00Z',
          status: 'Reported',
          ngoList: [],
        },
        {
          reportId: '2',
          userId: '1',
          username: 'Jane Smith',
          photo: 'https://images.pexels.com/photos/3560168/pexels-photo-3560168.jpeg',
          description: 'Chemical contamination in Thane Creek, unusual foam and discoloration',
          location: { lat: 19.2083, lng: 72.9681 },
          address: 'Creek Bank, Thane',
          timestamp: '2025-01-14T15:45:00Z',
          status: 'Active',
          ngoList: ['Green NGO'],
        },
      ];
      setReports(mockReports);
    }
  }, []);

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    reports,
    ngoActions,
    addReport,
    acceptReport,
    uploadCompletionImage,
    approveCompletion,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};