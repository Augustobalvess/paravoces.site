
export type Niche = 'nutritionist' | 'physiotherapist' | 'psychologist' | 'other' | null;

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password?: string;
  clinicName: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due';
  trialEndDate: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar: string;
  isActive: boolean; // Added for Soft Delete
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  color: string;
  isPackage?: boolean;
  isActive: boolean; // Added for Soft Delete
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'appointment' | 'note' | 'return';
  title: string;
  description: string;
}

export interface Patient {
  id: string;
  name: string;
  lastVisit: string;
  phone: string;
  email?: string;
  cpf?: string;
  birthDate?: string;
  age?: number;
  avatar: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
  };
  medicalRecords?: MedicalRecord[];
}

export interface Appointment {
  id: string;
  patientId: string;
  serviceIds: string[]; 
  collaboratorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'completed' | 'canceled';
  price: number;
  location: 'clinic' | 'home';
}

export interface ChartData {
  name: string;
  value: number;
  prev: number;
}