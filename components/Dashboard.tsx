import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDown,
  Users,
  DollarSign,
  CalendarCheck,
  Lightbulb,
  ChevronDown,
  Calendar as CalendarIcon,
  RefreshCw,
  Menu,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "./Sidebar";

// --- INTERFACES ---
interface PlanStatus {
  status: "Ativo" | "Expirado" | "Inativo";
  label: "Trial Gratuito" | "Plano Pro";
  daysUsed: number;
  totalDays: number;
  progress: number;
}

interface DashboardProps {
  planStatus?: PlanStatus; // Deixei opcional para evitar erro se não passar
}

type FilterType = "today" | "yesterday" | "7days" | "30days" | "all" | "custom";

const Dashboard: React.FC<DashboardProps> = ({ planStatus }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  // const [user, setUser] = useState<any>(null); // Não estava sendo usado visualmente

  const [filterType, setFilterType] = useState<FilterType>("today");
  const [filterLabel, setFilterLabel] = useState("Hoje");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [customDate, setCustomDate] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const [metrics, setMetrics] = useState({
    revenue: 0,
    appointments: 0,
    newPatients: 0,
    revenuePct: 0,
    appointmentsPct: 0,
    newPatientsPct: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [topServicesList, setTopServicesList] = useState<any[]>([]);

  // -----------------------------
  // 1. BUSCAR DADOS (CORRIGIDO)
  // -----------------------------
  const fetchData = async () => {
    setIsLoading(true);

    try {
      // 1. Busca Agendamentos
      const { data: aptsData } = await supabase
        .from("appointments")
        .select("*")
        .order("start_time", { ascending: true });

      // 2. Busca Pacientes
      const { data: patientsData } = await supabase
        .from("patients")
        .select("*");

      // 3. (NOVO) Busca Serviços para descobrir os nomes
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name");

      // Cria um mapa para achar nome rápido: { 'ID_DO_SERVICO': 'Nome do Serviço' }
      const servicesMap: Record<string, string> = {};
      if (servicesData) {
        servicesData.forEach((s) => {
          servicesMap[s.id] = s.name;
        });
      }

      // 4. Formata os agendamentos cruzando os dados
      const formattedApts = (aptsData || []).map((apt: any) => {
        let safeDate: Date;

        if (apt.start_time) {
          safeDate = apt.start_time.includes("T")
            ? new Date(apt.start_time)
            : new Date(apt.start_time + "T00:00:00");
        } else if (apt.date) {
          safeDate = apt.date.includes("T")
            ? new Date(apt.date)
            : new Date(apt.date + "T00:00:00");
        } else {
          safeDate = new Date();
        }

        // DESCOBRE O NOME DO SERVIÇO
        // O banco retorna service_ids como array (ex: ["uuid1", "uuid2"]) ou service_id único
        let serviceName = "Serviço Diversos";
        
        if (apt.service_ids && Array.isArray(apt.service_ids) && apt.service_ids.length > 0) {
            // Pega os nomes de todos os serviços do agendamento
            const names = apt.service_ids.map((id: string) => servicesMap[id]).filter(Boolean);
            if (names.length > 0) serviceName = names.join(" + ");
        } else if (apt.service_id && servicesMap[apt.service_id]) {
            serviceName = servicesMap[apt.service_id];
        }

        return {
          ...apt,
          originalDate: safeDate,
          price: Number(apt.price || 0),
          serviceName: serviceName, // Agora temos o nome real!
        };
      });

      setAppointments(formattedApts);
      setPatients(patientsData || []);
    } catch (e) {
      console.error("Error fetching:", e);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) recalcAll();
  }, [appointments, patients, filterType, customDate, isLoading]);

  // -----------------------------
  // 2. CÁLCULOS
  // -----------------------------
  const recalcAll = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let startDate = new Date("2000-01-01");
    let endDate = new Date("2100-01-01");

    switch (filterType) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "7days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "30days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "all":
        startDate = new Date("2000-01-01");
        endDate = new Date("2100-01-01");
        break;

      case "custom":
        startDate = new Date(
          customDate.year,
          customDate.month,
          customDate.day,
          0,
          0,
          0,
          0
        );
        endDate = new Date(
          customDate.year,
          customDate.month,
          customDate.day,
          23,
          59,
          59,
          999
        );
        break;
    }

    // Filtrar atendimentos válidos
    const validApts = appointments.filter((apt) => {
      const d = new Date(apt.originalDate);
      const isCancelled =
        apt.status === "cancelled" || apt.status === "canceled";
      return d >= startDate && d <= endDate && !isCancelled;
    });

    const revenue = validApts.reduce(
      (acc, a) => acc + Number(a.price || 0),
      0
    );

    // Novos pacientes
    const newP = patients.filter((p) => {
      const d = p?.created_at ? new Date(p.created_at) : null;
      if (!d) return false;
      return d >= startDate && d <= endDate;
    }).length;

    // ===== Percentuais =====
    const diffDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
    );

    const prevStart = new Date(startDate);
    const prevEnd = new Date(endDate);

    prevStart.setDate(prevStart.getDate() - diffDays);
    prevEnd.setDate(prevEnd.getDate() - diffDays);

    const prevApts = appointments.filter((apt) => {
      const d = new Date(apt.originalDate);
      const isCancelled =
        apt.status === "cancelled" || apt.status === "canceled";
      return d >= prevStart && d <= prevEnd && !isCancelled;
    });

    const prevRevenue = prevApts.reduce(
      (acc, a) => acc + Number(a.price || 0),
      0
    );

    const prevNewPatients = patients.filter((p) => {
      const d = p?.created_at ? new Date(p.created_at) : null;
      if (!d) return false;
      return d >= prevStart && d <= prevEnd;
    }).length;

    const calcPct = (a: number, b: number) =>
      b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100;

    setMetrics({
      revenue,
      appointments: validApts.length,
      newPatients: newP,
      revenuePct: calcPct(revenue, prevRevenue),
      appointmentsPct: calcPct(validApts.length, prevApts.length),
      newPatientsPct: calcPct(newP, prevNewPatients),
    });

    // TOP SERVIÇOS (Lógica mantida, mas agora 'serviceName' tem valor real)
    const serviceMap: Record<string, { count: number; total: number }> = {};

    validApts.forEach((a) => {
      // Aqui usamos o nome que mapeamos lá no fetchData
      const name = a.serviceName || "Outros"; 
      
      if (!serviceMap[name])
        serviceMap[name] = { count: 0, total: 0 };
      
      serviceMap[name].count++;
      serviceMap[name].total += Number(a.price || 0);
    });

    setTopServicesList(
      Object.entries(serviceMap)
        .map(([k, v]) => ({
          name: k,
          count: v.count,
          price: v.total,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Aumentei para Top 5, fica mais bonito
    );

    // GRÁFICOS
    const chartMap = new Map<string, { rev: number; count: number }>();
    const singleDay = filterType === "today" || filterType === "custom";

    if (singleDay) {
      for (let h = 8; h <= 20; h++)
        chartMap.set(`${h}:00`, { rev: 0, count: 0 });
    }

    validApts.forEach((a) => {
      let key = "";

      if (singleDay)
        key = `${new Date(a.originalDate).getHours()}:00`;
      else
        key = new Date(a.originalDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });

      if (!chartMap.has(key))
        chartMap.set(key, singleDay ? { rev: 0, count: 0 } : { rev: Number(a.price || 0), count: 1 }); // Inicializa se não for singleDay

      // Se for singleDay a inicialização já cuidou, senão precisamos somar
      const item = chartMap.get(key) || { rev: 0, count: 0 };
      
      // Correção para não somar dobrado se acabou de criar
      if (!singleDay && chartMap.get(key)?.count === 1 && chartMap.get(key)?.rev === Number(a.price)) {
          // Já foi inserido na inicialização do Map acima, não faz nada
      } else {
          chartMap.set(key, {
            rev: item.rev + Number(a.price || 0),
            count: item.count + 1,
          });
      }
    });

    let revenueChart = Array.from(chartMap.entries()).map(([k, v]) => ({
      name: k,
      value: v.rev,
    }));

    let attendanceChart = Array.from(chartMap.entries()).map(
      ([k, v]) => ({
        name: k,
        value: v.count,
      })
    );
    
    // Ordenação para garantir que os dias fiquem na ordem certa (se não for hoje)
    if (!singleDay) {
        revenueChart.sort((a,b) => {
            const [dA, mA] = a.name.split('/').map(Number);
            const [dB, mB] = b.name.split('/').map(Number);
            return mA - mB || dA - dB;
        });
    }

    if (revenueChart.length === 0)
      revenueChart = [{ name: "Sem dados", value: 0 }];

    if (attendanceChart.length === 0)
      attendanceChart = [{ name: "Sem dados", value: 0 }];

    setChartData(revenueChart);
    setAttendanceData(attendanceChart);
  };

  const handleFilterChange = (type: FilterType, label: string) => {
    setFilterType(type);
    setFilterLabel(label);
    if (type !== "custom") setShowFilterMenu(false);
  };

  const formatCurrency = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;

  // =============================
  // RENDER (MANTIDO IDÊNTICO)
  // =============================
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        planStatus={planStatus}
        currentView="dashboard" 
        setCurrentView={() => {}}
        niche="outros"
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 relative overflow-y-auto h-screen">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-white border border-slate-200 rounded-lg"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Visão Geral
              </h2>
              <p className="text-sm text-slate-500">
                Acompanhe a performance da clínica.
              </p>
            </div>
          </div>

          {/* FILTRO */}
          <div className="relative flex gap-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between w-48 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-500" />
                {filterLabel}
              </div>
              <ChevronDown size={16} />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border p-2 z-50">
                <div className="space-y-1 mb-3 border-b pb-2">
                  {[
                    ["today", "Hoje"],
                    ["yesterday", "Ontem"],
                    ["7days", "Últimos 7 dias"],
                    ["30days", "Últimos 30 dias"],
                    ["all", "Tempo todo"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() =>
                        handleFilterChange(value as FilterType, label)
                      }
                      className={`w-full text-left px-3 py-3 rounded-lg text-sm ${
                        filterType === value
                          ? "bg-blue-50 text-blue-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* FILTER CUSTOM */}
                <div className="px-3 pb-2">
                  <p className="text-xs font-bold text-slate-400 mb-2">
                    PERSONALIZADO
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={customDate.day}
                      onChange={(e) => {
                        setCustomDate({
                          ...customDate,
                          day: Number(e.target.value),
                        });
                        handleFilterChange("custom", "Personalizado");
                      }}
                      className="border p-2 rounded-lg bg-slate-50 flex-1"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        )
                      )}
                    </select>

                    <select
                      value={customDate.month}
                      onChange={(e) => {
                        setCustomDate({
                          ...customDate,
                          month: Number(e.target.value),
                        });
                        handleFilterChange("custom", "Personalizado");
                      }}
                      className="border p-2 rounded-lg bg-slate-50 flex-1"
                    >
                      {[
                        "Jan",
                        "Fev",
                        "Mar",
                        "Abr",
                        "Mai",
                        "Jun",
                        "Jul",
                        "Ago",
                        "Set",
                        "Out",
                        "Nov",
                        "Dez",
                      ].map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
  value={customDate.year}
  onChange={(e) => {
    setCustomDate({
      ...customDate,
      year: Number(e.target.value),
    });
    handleFilterChange("custom", "Personalizado");
  }}
  className="border p-2 rounded-lg bg-slate-50 flex-1"
>
  {/* GERA DINAMICAMENTE: 2 anos atrás até 1 ano à frente */}
  {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i).map(
    (y) => (
      <option key={y} value={y}>
        {y}
      </option>
    )
  )}
</select>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={fetchData}
              className="bg-white border p-2.5 rounded-xl shadow-sm hover:text-blue-600"
            >
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        {/* LOADING */}
        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-slate-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* INSIGHT */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white mb-8 flex items-start gap-4 shadow-lg">
              <div className="p-3 bg-white/10 rounded-lg">
                <Lightbulb size={24} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Dica Inteligente
                </h3>
                <p className="text-slate-300 text-sm">
                  {metrics.revenue === 0
                    ? "Para ver gráficos e métricas, registre seus primeiros atendimentos."
                    : "Ótimo! Sua clínica está performando bem. Continue acompanhando aqui."}
                </p>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* FATURAMENTO */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <DollarSign className="text-emerald-600" size={24} />
                  </div>
                  <span
                    className={`text-sm font-medium flex items-center ${
                      metrics.revenuePct >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.revenuePct >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDown size={16} />
                    )}
                    {metrics.revenuePct.toFixed(1)}%
                  </span>
                </div>
                <p className="text-slate-500 text-sm">Faturamento</p>
                <h3 className="text-3xl font-bold text-slate-900">
                  {formatCurrency(metrics.revenue)}
                </h3>
              </div>

              {/* ATENDIMENTOS */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <CalendarCheck className="text-blue-600" size={24} />
                  </div>
                  <span
                    className={`text-sm font-medium flex items-center ${
                      metrics.appointmentsPct >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.appointmentsPct >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDown size={16} />
                    )}
                    {metrics.appointmentsPct.toFixed(1)}%
                  </span>
                </div>
                <p className="text-slate-500 text-sm">Atendimentos</p>
                <h3 className="text-3xl font-bold text-slate-900">
                  {metrics.appointments}
                </h3>
              </div>

              {/* NOVOS PACIENTES */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Users className="text-indigo-600" size={24} />
                  </div>
                  <span
                    className={`text-sm font-medium flex items-center ${
                      metrics.newPatientsPct >= 0
                        ? "text-indigo-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.newPatientsPct >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDown size={16} />
                    )}
                    {metrics.newPatientsPct.toFixed(1)}%
                  </span>
                </div>
                <p className="text-slate-500 text-sm">Novos Clientes</p>
                <h3 className="text-3xl font-bold text-slate-900">
                  {metrics.newPatients}
                </h3>
              </div>
            </div>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* FATURAMENTO */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Evolução de Faturamento
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        formatter={(v) => [`R$ ${v}`, "Faturamento"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ATENDIMENTOS */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Volume de Atendimentos
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        width={40}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                        }}
                        formatter={(v) => [v, "Atendimentos"]}
                      />
                      <Bar
                        dataKey="value"
                        name="Atendimentos"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* TOP SERVIÇOS */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Top Serviços
              </h3>

              {topServicesList.length > 0 ? (
                <div className="space-y-6">
                  {topServicesList.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        #{idx + 1}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm truncate">
                          {s.name}
                        </h4>

                        <div className="flex items-center mt-1">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mr-4">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{
                                width: `${
                                  (s.count /
                                    (topServicesList[0].count || 1)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {s.count} agend.
                          </span>
                        </div>
                      </div>

                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-10">
                  Nenhum serviço realizado neste período.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;