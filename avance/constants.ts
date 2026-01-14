
import { Service, Patient, ChartData, Collaborator } from './types';

export const INITIAL_COLLABORATORS: Collaborator[] = [
  { id: 'c1', name: 'Dr. Admin', role: 'Proprietário', color: 'bg-slate-900', avatar: 'https://ui-avatars.com/api/?name=Admin&background=0f172a&color=fff', isActive: true },
  { id: 'c2', name: 'Dra. Júlia', role: 'Especialista', color: 'bg-pink-500', avatar: 'https://ui-avatars.com/api/?name=Julia&background=ec4899&color=fff', isActive: true },
];

export const SERVICES_MOCK: Record<string, Service[]> = {
  nutritionist: [
    { id: '1', name: 'Consulta Inicial', durationMin: 60, price: 350, color: 'bg-emerald-100 text-emerald-700', isActive: true },
    { id: '2', name: 'Retorno', durationMin: 30, price: 150, color: 'bg-blue-100 text-blue-700', isActive: true },
    { id: '3', name: 'Bioimpedância', durationMin: 15, price: 100, color: 'bg-purple-100 text-purple-700', isActive: true },
    { id: '4', name: 'Pacote Acompanhamento (3 meses)', durationMin: 0, price: 900, color: 'bg-orange-100 text-orange-700', isPackage: true, isActive: true },
  ],
  physiotherapist: [
    { id: '1', name: 'Avaliação Funcional', durationMin: 60, price: 300, color: 'bg-emerald-100 text-emerald-700', isActive: true },
    { id: '2', name: 'Sessão Fisioterapia', durationMin: 50, price: 180, color: 'bg-blue-100 text-blue-700', isActive: true },
    { id: '3', name: 'Osteopatia', durationMin: 45, price: 250, color: 'bg-purple-100 text-purple-700', isActive: true },
    { id: '4', name: 'Pacote Reabilitação (10 sessões)', durationMin: 0, price: 1600, color: 'bg-orange-100 text-orange-700', isPackage: true, isActive: true },
  ],
  psychologist: [
    { id: '1', name: 'Terapia Individual', durationMin: 50, price: 250, color: 'bg-indigo-100 text-indigo-700', isActive: true },
    { id: '2', name: 'Terapia de Casal', durationMin: 90, price: 400, color: 'bg-pink-100 text-pink-700', isActive: true },
    { id: '3', name: 'Plantão Psicológico', durationMin: 50, price: 200, color: 'bg-teal-100 text-teal-700', isActive: true },
  ],
  other: [
    { id: '1', name: 'Consulta Geral', durationMin: 30, price: 200, color: 'bg-gray-100 text-gray-700', isActive: true },
  ]
};

export const PATIENTS_MOCK: Patient[] = [
  { id: '1', name: 'Ana Silva', lastVisit: '2023-10-15', phone: '11999999999', avatar: 'https://ui-avatars.com/api/?name=Ana+Silva&background=random' },
  { id: '2', name: 'Carlos Oliveira', lastVisit: '2023-10-20', phone: '11988888888', avatar: 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=random' },
  { id: '3', name: 'Mariana Santos', lastVisit: '2023-09-05', phone: '11977777777', avatar: 'https://ui-avatars.com/api/?name=Mariana+Santos&background=random' },
  { id: '4', name: 'Roberto Souza', lastVisit: '2023-10-25', phone: '11966666666', avatar: 'https://ui-avatars.com/api/?name=Roberto+Souza&background=random' },
  { id: '5', name: 'Fernanda Lima', lastVisit: '2023-10-01', phone: '11955555555', avatar: 'https://ui-avatars.com/api/?name=Fernanda+Lima&background=random' },
];

export const REVENUE_DATA: ChartData[] = [
  { name: 'Jan', value: 12500, prev: 10000 },
  { name: 'Fev', value: 15000, prev: 11000 },
  { name: 'Mar', value: 14000, prev: 13000 },
  { name: 'Abr', value: 18000, prev: 12500 },
  { name: 'Mai', value: 21000, prev: 16000 },
  { name: 'Jun', value: 24500, prev: 19000 },
];

export const USER_STORIES_DOCS = `
## Jornada do Profissional (Dono da Clínica)
1. Como profissional de saúde, quero visualizar um dashboard com faturamento e agenda do dia para organizar minha rotina.
2. Como administrador, quero cadastrar novos colaboradores com cores diferentes para diferenciar na agenda.
3. Como profissional, quero registrar prontuários de pacientes de forma rápida durante a consulta.

## Jornada da Secretária
1. Como secretária, quero agendar consultas filtrando por profissional e horário disponível.
2. Como secretária, quero confirmar presença via WhatsApp (integração futura).

## Jornada do Paciente (Futuro App)
1. Como paciente, quero agendar horário online.
2. Como paciente, quero ver meu histórico de evolução.
`;

export const DB_SCHEMA_DOCS = `
-- #################################################################
-- SUPABASE SCHEMA - HEALTHFLOW (MOBILE FIRST & MULTI-TENANT)
-- #################################################################

-- 1. ENUMS & SETUP
create type user_role as enum ('owner', 'admin', 'collaborator');
create type sub_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type appt_status as enum ('pending', 'confirmed', 'completed', 'canceled');

-- 2. CLINICS (TENANTS)
-- Tabela central. Cada usuário pertence a uma clínica.
create table public.clinics (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROFILES (USERS)
-- Extensão da tabela auth.users.
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  clinic_id uuid references public.clinics on delete cascade,
  email text,
  full_name text,
  role user_role default 'owner',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SUBSCRIPTIONS
-- Controle de pagamento. Vinculado ao usuário dono (que paga).
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status sub_status default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SERVICES
-- Catálogo de serviços da clínica.
create table public.services (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid references public.clinics on delete cascade not null,
  name text not null,
  duration_min integer default 30,
  price decimal(10,2) default 0.00,
  color text default 'bg-blue-100 text-blue-700',
  is_active boolean default true, -- Soft Delete
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PATIENTS
-- Clientes da clínica.
create table public.patients (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid references public.clinics on delete cascade not null,
  name text not null,
  phone text,
  email text,
  cpf text,
  birth_date date,
  address jsonb, -- { street, number, city... }
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. COLLABORATORS (Mock Visual Representation)
-- Em um app real, colaboradores seriam 'profiles', mas mantemos tabela separada para facilitar migração do mock atual.
create table public.collaborators_legacy (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid references public.clinics on delete cascade not null,
  name text not null,
  role text,
  color text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. APPOINTMENTS
-- A tabela mais importante. Relaciona tudo.
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid references public.clinics on delete cascade not null,
  patient_id uuid references public.patients on delete cascade not null,
  collaborator_id text, -- Pode ser ID do profile ou do collaborators_legacy
  service_ids text[], -- Array de IDs dos serviços
  date date not null,
  start_time time not null,
  end_time time not null,
  status appt_status default 'pending',
  price decimal(10,2),
  location text check (location in ('clinic', 'home')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- #################################################################
-- ROW LEVEL SECURITY (RLS) - ISOLAMENTO DE DADOS
-- #################################################################

alter table profiles enable row level security;
alter table clinics enable row level security;
alter table services enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;

-- Helper Function: Pegar ID da clínica do usuário atual
create or replace function get_my_clinic_id()
returns uuid as $$
  select clinic_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

-- POLICIES (Exemplos genéricos, ajustar conforme necessidade)

-- Clinics: Dono vê sua clínica
create policy "Owners can view their clinic" on clinics
  for select using (auth.uid() = owner_id);

-- Profiles: Usuário vê perfis da MESMA clínica
create policy "Users view colleagues" on profiles
  for select using (clinic_id = get_my_clinic_id());

create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- Services/Patients/Appointments: Acesso restrito à clinic_id
create policy "View clinic services" on services
  for select using (clinic_id = get_my_clinic_id());
  
create policy "Manage clinic services" on services
  for all using (clinic_id = get_my_clinic_id());

create policy "View clinic patients" on patients
  for select using (clinic_id = get_my_clinic_id());

create policy "Manage clinic patients" on patients
  for all using (clinic_id = get_my_clinic_id());

create policy "View clinic appointments" on appointments
  for select using (clinic_id = get_my_clinic_id());

create policy "Manage clinic appointments" on appointments
  for all using (clinic_id = get_my_clinic_id());

-- #################################################################
-- TRIGGERS (AUTOMATIONS)
-- #################################################################

-- Função para criar Clínica e Perfil ao registrar usuário
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_clinic_id uuid;
begin
  -- 1. Cria a clínica
  insert into public.clinics (owner_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'clinic_name', 'Minha Clínica'))
  returning id into new_clinic_id;

  -- 2. Cria o perfil vinculado
  insert into public.profiles (id, email, full_name, role, clinic_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'owner', 
    new_clinic_id
  );
  
  -- 3. Cria subscrição Trial
  insert into public.subscriptions (user_id, status, current_period_end)
  values (new.id, 'trialing', now() + interval '7 days');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger disparado pelo Auth do Supabase
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

`;
