"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  BarChart3,
  Calendar,
  ChevronDown,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Home,
  LogOut,
  Menu,
  PieChart,
  Plus,
  Settings,
  ShoppingCart,
  Sliders,
  Store,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import axios from "axios"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

// Helper funksiya token mavjudligini tekshirish va header olish uchun
const getAuthHeader = (currentRouter) => {
  const currentToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  if (!currentToken) {
    console.warn("Token topilmadi. Avtorizatsiya headeri bo'sh bo'ladi.");
    toast.error("Avtorizatsiya tokeni topilmadi. Iltimos, qayta kiring.", { toastId: 'no-token-error' });
    if (currentRouter) {
      currentRouter.push("/auth");
    }
    return null;
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${currentToken}`,
  }
}


export default function AdminDashboard() {
  const router = useRouter()
  const [token, setToken] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [dateRange, setDateRange] = useState("weekly")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showAllOrders, setShowAllOrders] = useState(false)

  // State'lar
  const [recentOrders, setRecentOrders] = useState([])
  const [orders, setOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState({
    todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" },
    todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" },
    average_check: { value: 0, change_percent: 0, comparison_period: "N/A" },
    active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" },
  })
  const [xodim, setXodim] = useState([])
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    first_name: "",
    last_name: "",
    role_id: "",
    pin_code: "",
    is_active: true,
  })
  const [newRole, setNewRole] = useState({ name: "" })
  const [rolesList, setRolesList] = useState([])
  const [employeeReport, setEmployeeReport] = useState([])
  const [customerReport, setCustomerReport] = useState({
    regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
    new_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
    one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
  })
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [orderTypes, setOrderTypes] = useState([])
  const [fetchedRoles, setFetchedRoles] = useState([])
  const [isDeleteRoleConfirmOpen, setIsDeleteRoleConfirmOpen] = useState(false); // Modal state
  const [roleToDelete, setRoleToDelete] = useState(null); // O'chiriladigan rol state

  // --- Utility Functions ---
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token");
    }
    setToken(null);
    toast.info("Tizimdan chiqdingiz.");
    router.push("/auth");
  }

  const handleApiError = (error, contextMessage) => {
    console.error(`${contextMessage} xatolik:`, error);
    let errorDetail = `${contextMessage} xatolik yuz berdi.`;
    let shouldLogout = false;

    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        errorDetail = "Sessiya muddati tugagan yoki ruxsat yo'q. Iltimos, qayta kiring.";
        shouldLogout = true;
      } else {
        if (typeof error.response.data === 'object' && error.response.data !== null) {
          if (Array.isArray(error.response.data)) {
            errorDetail = error.response.data.map(err => `${err.field || 'Error'}: ${err.message}`).join('; ');
          } else {
            errorDetail = Object.entries(error.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
          }
        } else if (error.response.data?.detail) {
          errorDetail = error.response.data.detail;
        } else if (typeof error.response.data === 'string') {
          errorDetail = error.response.data;
        } else {
          errorDetail = `Serverdan kutilmagan javob (status: ${error.response.status}).`;
        }
        if (!shouldLogout) {
          errorDetail = `${contextMessage} xatolik: ${errorDetail}`;
        }
      }
    } else if (error.request) {
      errorDetail = `${contextMessage}: Serverdan javob olinmadi. Internet aloqasini tekshiring.`;
    } else {
      errorDetail = `${contextMessage} xatolik: ${error.message}`;
    }

    toast.error(errorDetail, { toastId: contextMessage.replace(/\s+/g, '-') });

    if (shouldLogout) {
      handleLogout();
    }
  }


  // --- useEffect Hooks ---

  useEffect(() => {
    setIsClient(true)
    const storedToken = localStorage.getItem("token")
    if (!storedToken) {
      router.push("/auth");
    } else {
      setToken(storedToken)
    }
  }, [router])


  // 1. Buyurtmalarni olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/orders/`, { headers })
        .then((res) => {
          const data = res.data ?? [];
          setRecentOrders(data);
          setOrders(data);
        })
        .catch((err) => {
          handleApiError(err, "Buyurtmalarni yuklashda");
          setRecentOrders([]);
          setOrders([]);
        })
    }
  }, [token, isClient, router]);

  // 2. Dashboard Statistika olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/stats/`, { headers })
        .then((res) => {
          const defaultStats = {
            todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" },
            todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" },
            average_check: { value: 0, change_percent: 0, comparison_period: "N/A" },
            active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" },
          };
          const receivedStats = res.data || {};
          setStats({
            todays_sales: receivedStats.todays_sales ?? defaultStats.todays_sales,
            todays_orders: receivedStats.todays_orders ?? defaultStats.todays_orders,
            average_check: receivedStats.average_check ?? defaultStats.average_check,
            active_employees: receivedStats.active_employees ?? defaultStats.active_employees,
          });
        })
        .catch((err) => {
          handleApiError(err, "Statistikani yuklashda");
          setStats({
            todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" },
            todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" },
            average_check: { value: 0, change_percent: 0, comparison_period: "N/A" },
            active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" },
          });
        })
    }
  }, [token, isClient, router]);

  // 3. Xodimlarni olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, { headers })
        .then((res) => {
          setXodim(res.data ?? []);
        })
        .catch((err) => {
          handleApiError(err, "Xodimlarni yuklashda");
          setXodim([]);
        })
    }
  }, [token, isClient, router]);

  // 4. Rollar ro'yxatini olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, { headers })
        .then((res) => {
          const rolesData = res.data ?? [];
          setRolesList(rolesData);
          setFetchedRoles(rolesData);
        })
        .catch((err) => {
          handleApiError(err, "Rollar ro'yxatini yuklashda");
          setRolesList([]);
          setFetchedRoles([]);
        })
    }
  }, [token, isClient, router]);

  // 5. Xodimlar hisobotini olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/employees/`, { headers })
        .then((res) => {
          setEmployeeReport(res.data ?? []);
        })
        .catch((err) => {
          handleApiError(err, "Xodimlar hisobotini yuklashda");
          setEmployeeReport([]);
        })
    }
  }, [token, isClient, router]);

  // 6. Mahsulotlar hisobotini olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/products/`, { headers })
        .then((res) => {
          setProducts(res.data ?? []);
        })
        .catch((err) => {
          handleApiError(err, "Mahsulotlar hisobotini yuklashda");
          setProducts([]);
        })
    }
  }, [token, isClient, router]);

  // 7. Mijozlar hisobotini olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/customers/`, { headers })
        .then((res) => {
          const defaultReport = {
            regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            new_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
          };
          const receivedReport = res.data || {};
          setCustomerReport({
            regular_customers: receivedReport.regular_customers ?? defaultReport.regular_customers,
            new_customers: receivedReport.new_customers ?? defaultReport.new_customers,
            one_time_customers: receivedReport.one_time_customers ?? defaultReport.one_time_customers,
          });
        })
        .catch((err) => {
          handleApiError(err, "Mijozlar hisobotini yuklashda");
          setCustomerReport({
            regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            new_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
          });
        })
    }
  }, [token, isClient, router]);

  // 8. Diagrammalar ma'lumotini olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/charts/`, { headers })
        .then((res) => {
          setPaymentMethods(res.data?.payment_methods || []);
          setOrderTypes(res.data?.order_types || []);
        })
        .catch((err) => {
          handleApiError(err, "Diagrammalar ma'lumotlarini yuklashda");
          setPaymentMethods([]);
          setOrderTypes([]);
        })
    }
  }, [token, isClient, router]);

  // 9. Savdo grafigi ma'lumotini olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/sales-chart/`, { headers })
        .then((res) => {
          setSalesData(res.data ?? []);
        })
        .catch((err) => {
          handleApiError(err, "Savdo grafigini yuklashda");
          setSalesData([]);
        })
    }
  }, [token, isClient, router]);


  // 10. Eng ko'p sotilgan mahsulotlarni olish
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router);
      if (!headers) return;
      const source = axios.CancelToken.source();
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/top-products/?period=${dateRange}`, {
        headers,
        cancelToken: source.token
      })
        .then((res) => {
          setTopProducts(res.data ?? []);
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            handleApiError(err, "Eng ko'p sotilgan mahsulotlarni yuklashda");
            setTopProducts([]);
          }
        })
      return () => {
        source.cancel("Request cancelled due to dependency change or unmount.");
      };
    }
  }, [dateRange, token, isClient, router]);

  // --- Ma'lumotlarni yangilash funksiyalari ---
  const refreshOrders = () => {
    const headers = getAuthHeader(router);
    if (!headers) return;
    axios.get(`https://oshxonacopy.pythonanywhere.com/api/orders/`, { headers })
      .then((res) => { const data = res.data ?? []; setRecentOrders(data); setOrders(data); })
      .catch((err) => handleApiError(err, "Buyurtmalarni yangilashda"));
  };

  const refreshEmployees = () => {
    const headers = getAuthHeader(router);
    if (!headers) return;
    axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, { headers })
      .then((res) => setXodim(res.data ?? []))
      .catch((err) => handleApiError(err, "Xodimlarni yangilashda"));
  };

  const refreshRoles = () => {
    const headers = getAuthHeader(router);
    if (!headers) return;
    axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, { headers })
      .then((res) => {
        const rolesData = res.data ?? [];
        setRolesList(rolesData);
        setFetchedRoles(rolesData);
      })
      .catch((err) => {
        handleApiError(err, "Rollarni yangilashda");
        setRolesList([]);
        setFetchedRoles([]);
      });
  };


  // --- Handler funksiyalar (POST, DELETE uchun) ---

  const handleCancelOrder = async (orderId) => {
    const headers = getAuthHeader(router);
    if (!headers) return;
    try {
      const response = await axios.post(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/cancel_order/`,
        {},
        { headers }
      )
      if (response.status === 200 || response.status === 204) {
        toast.success(`Buyurtma #${orderId} muvaffaqiyatli bekor qilindi!`);
        refreshOrders();
      } else {
        toast.warning(`Buyurtmani bekor qilishda kutilmagan javob: ${response.status}`)
      }
    } catch (err) {
      handleApiError(err, "Buyurtmani bekor qilishda");
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployee.username || !newEmployee.first_name || !newEmployee.last_name || !newEmployee.role_id || !newEmployee.pin_code) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring")
      return
    }
    if (newEmployee.pin_code.length !== 4) {
      toast.error("PIN-kod 4 ta raqamdan iborat bo'lishi kerak.");
      return;
    }
    const headers = getAuthHeader(router);
    if (!headers) return;
    try {
      await axios.post(
        "https://oshxonacopy.pythonanywhere.com/api/admin/users/",
        {
          username: newEmployee.username,
          first_name: newEmployee.first_name,
          last_name: newEmployee.last_name,
          role_id: parseInt(newEmployee.role_id),
          pin_code: newEmployee.pin_code,
          is_active: newEmployee.is_active,
        },
        { headers }
      )
      toast.success("Xodim muvaffaqiyatli qo'shildi!")
      setNewEmployee({ username: "", first_name: "", last_name: "", role_id: "", pin_code: "", is_active: true })
      setShowAddEmployeeDialog(false)
      refreshEmployees();
    } catch (err) {
      handleApiError(err, "Xodim qo'shishda");
    }
  }

  const handleAddRole = async () => {
    if (!newRole.name || newRole.name.trim() === "") {
      toast.error("Iltimos, rol nomini kiriting")
      return
    }
    const headers = getAuthHeader(router);
    if (!headers) return;
    try {
      await axios.post(
        "https://oshxonacopy.pythonanywhere.com/api/admin/roles/",
        { name: newRole.name.trim() },
        { headers }
      )
      toast.success("Rol muvaffaqiyatli qo'shildi!")
      setNewRole({ name: "" })
      setShowAddRoleDialog(false)
      refreshRoles();
    } catch (err) {
      handleApiError(err, "Rol qo'shishda");
    }
  }

  const handleDeleteEmployee = async (id) => {
    // Hozircha confirm() ishlatiladi, kerak bo'lsa modalga o'tkazish mumkin
    if (!confirm(`Haqiqatan ham IDsi ${id} bo'lgan xodimni o'chirmoqchimisiz?`)) return

    const headers = getAuthHeader(router);
    if (!headers) return;
    try {
      const response = await axios.delete(`https://oshxonacopy.pythonanywhere.com/api/admin/users/${id}/`, { headers })
      if (response.status === 204) {
        toast.success("Xodim muvaffaqiyatli o'chirildi!")
        refreshEmployees();
      } else {
        toast.warning(`Xodimni o'chirishda kutilmagan javob: ${response.status}`)
      }
    } catch (err) {
      handleApiError(err, "Xodimni o'chirishda");
    }
  }

  // Modalni ochish uchun
  const handleDeleteRole = (role) => {
    const employeeCount = role?.employee_count ?? role?.count ?? 0;
    setRoleToDelete({
        id: role.id,
        name: role.name,
        employee_count: employeeCount
    });
    setIsDeleteRoleConfirmOpen(true);
  };

  // Modal tasdiqlanganda o'chirish uchun
  const confirmDeleteRole = async () => {
    if (!roleToDelete || !roleToDelete.id) return;

    const headers = getAuthHeader(router);
    if (!headers) return;

    try {
      const response = await axios.delete(
        `https://oshxonacopy.pythonanywhere.com/api/admin/roles/${roleToDelete.id}/`,
        { headers }
      );

      if (response.status === 204) {
        toast.success(`Rol "${roleToDelete.name}" (ID: ${roleToDelete.id}) muvaffaqiyatli o'chirildi!`);
        refreshRoles();
      } else {
        toast.warning(`Rolni o'chirishda kutilmagan javob: ${response.status}`);
      }
    } catch (err) {
      if (err.response?.status === 400 && (err.response?.data?.detail?.includes("Cannot delete role with assigned users") || err.response?.data?.error?.includes("Cannot delete role with assigned users"))) {
        toast.error(`"${roleToDelete.name}" rolini o'chirib bo'lmaydi, chunki unga xodimlar biriktirilgan.`);
      } else {
        handleApiError(err, `"${roleToDelete.name}" rolini o'chirishda`);
      }
    } finally {
      setIsDeleteRoleConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  // --- Rendering Logic ---

  const displayedOrders = showAllOrders ? orders : (orders || []).slice(0, 5)

  // Ma'lumotlar massiv ekanligini tekshirish
  const validSalesData = Array.isArray(salesData) ? salesData : []
  const validPaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : []
  const validOrderTypes = Array.isArray(orderTypes) ? orderTypes : []
  const validFetchedRoles = Array.isArray(fetchedRoles) ? fetchedRoles : [];
  const validXodim = Array.isArray(xodim) ? xodim : [];
  const validOrders = Array.isArray(orders) ? orders : [];
  const validEmployeeReport = Array.isArray(employeeReport) ? employeeReport : [];
  const validProducts = Array.isArray(products) ? products : [];
  const validRolesList = Array.isArray(rolesList) ? rolesList : [];
  const validTopProducts = Array.isArray(topProducts) ? topProducts : [];

  // Boshlang'ich yuklanish holati yoki token yo'qligi
  if (!isClient || !token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-lg">Yuklanmoqda...</p>
        <ToastContainer />
      </div>
    )
  }

  // ==================================
  //      JSX START (FORMATTED)
  // ==================================
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Sidebar (Desktop) */}
      <div className="hidden w-64 flex-col bg-slate-900 text-white md:flex dark:bg-slate-800">
        {/* Sidebar Header */}
        <div className="flex h-14 items-center border-b border-slate-700 px-4 dark:border-slate-600">
          <Store className="mr-2 h-6 w-6 text-sky-400" />
          <h1 className="text-lg font-bold">SmartResto Admin</h1>
        </div>

        {/* Sidebar Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4">
            {/* Main Navigation */}
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Asosiy
            </h2>
            <div className="space-y-1">
              <Button variant={activeTab === "dashboard" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'dashboard' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab("dashboard")}><BarChart3 className="mr-2 h-4 w-4" />Boshqaruv paneli</Button>
              <Button variant={activeTab === "reports" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'reports' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab("reports")}><FileText className="mr-2 h-4 w-4" />Hisobotlar</Button>
              <Button variant={activeTab === "employees" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'employees' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab("employees")}><Users className="mr-2 h-4 w-4" />Xodimlar</Button>
              <Button variant={activeTab === "roles" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'roles' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab("roles")}><Sliders className="mr-2 h-4 w-4" />Rollar</Button>
              <Button variant={activeTab === "orders" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'orders' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab("orders")}><ShoppingCart className="mr-2 h-4 w-4" />Buyurtmalar</Button>
            </div>

            {/* System Navigation */}
            <h2 className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tizim
            </h2>
            <div className="space-y-1">
              <Button variant={activeTab === "settings" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'settings' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab("settings")}><Settings className="mr-2 h-4 w-4" />Sozlamalar</Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-slate-700/50 dark:hover:bg-slate-700" onClick={() => router.push("/pos")}><Home className="mr-2 h-4 w-4" />POS ga qaytish</Button>
              <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-900/30 hover:text-red-400" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Chiqish</Button>
            </div>
          </nav>
        </ScrollArea>

        {/* Sidebar Footer (User Info) */}
        <div className="border-t border-slate-700 p-4 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarImage src="/placeholder-user.jpg" /><AvatarFallback>AD</AvatarFallback></Avatar>
            <div><p className="text-sm font-medium">Admin User</p><p className="text-xs text-slate-400 dark:text-slate-500">Administrator</p></div>
          </div>
        </div>
      </div>

      {/* Sidebar (Mobile) */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMobileSidebar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="fixed left-0 top-0 h-full w-64 flex-col bg-slate-900 text-white dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            {/* Mobile Sidebar Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-700 px-4 dark:border-slate-600">
              <div className="flex items-center"><Store className="mr-2 h-6 w-6 text-sky-400" /><h1 className="text-lg font-bold">SmartResto</h1></div>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)}><X className="h-6 w-6" /></Button>
            </div>
            {/* Mobile Sidebar Navigation */}
            <ScrollArea className="flex-1">
              <nav className="px-3 py-4">
                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Asosiy</h2>
                <div className="space-y-1">
                  {[ { name: 'dashboard', label: 'Boshqaruv paneli', icon: BarChart3 }, { name: 'reports', label: 'Hisobotlar', icon: FileText }, { name: 'employees', label: 'Xodimlar', icon: Users }, { name: 'roles', label: 'Rollar', icon: Sliders }, { name: 'orders', label: 'Buyurtmalar', icon: ShoppingCart }, ].map(item => (<Button key={item.name} variant={activeTab === item.name ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === item.name ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => { setActiveTab(item.name); setShowMobileSidebar(false); }}><item.icon className="mr-2 h-4 w-4" />{item.label}</Button>))}
                </div>
                <h2 className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tizim</h2>
                <div className="space-y-1">
                  <Button variant={activeTab === "settings" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'settings' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`} onClick={() => { setActiveTab("settings"); setShowMobileSidebar(false); }}><Settings className="mr-2 h-4 w-4" />Sozlamalar</Button>
                  <Button variant="ghost" className="w-full justify-start hover:bg-slate-700/50 dark:hover:bg-slate-700" onClick={() => { router.push("/pos"); setShowMobileSidebar(false); }}><Home className="mr-2 h-4 w-4" />POS ga qaytish</Button>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-900/30 hover:text-red-400" onClick={() => { handleLogout(); setShowMobileSidebar(false); }}><LogOut className="mr-2 h-4 w-4" />Chiqish</Button>
                </div>
              </nav>
            </ScrollArea>
            {/* Mobile Sidebar Footer */}
            <div className="border-t border-slate-700 p-4 dark:border-slate-600">
              <div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src="/placeholder-user.jpg" /><AvatarFallback>AD</AvatarFallback></Avatar><div><p className="text-sm font-medium">Admin User</p><p className="text-xs text-slate-400 dark:text-slate-500">Administrator</p></div></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 dark:bg-slate-900 dark:border-slate-700">
          {/* Mobile Header Left */}
          <div className="flex items-center gap-2 md:hidden"><Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(true)}><Menu className="h-6 w-6" /></Button><div className="flex items-center"><Store className="h-6 w-6 text-sky-400" /><h1 className="ml-2 text-lg font-bold">SmartResto</h1></div></div>
          {/* Desktop Header Right / Mobile Right (pushed) */}
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="outline" size="sm" className="hidden md:inline-flex"><Calendar className="mr-2 h-4 w-4" />{new Date().toLocaleDateString("uz-UZ", { day: '2-digit', month: 'long', year: 'numeric' })}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-8 w-8 rounded-full"><Avatar className="h-8 w-8"><AvatarImage src="/placeholder-user.jpg" /><AvatarFallback>AD</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem disabled>Profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('settings')}><Settings className="mr-2 h-4 w-4" /><span>Sozlamalar</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-400"><LogOut className="mr-2 h-4 w-4" /><span>Chiqish</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">

          {/* ======================== */}
          {/* == DASHBOARD TAB == */}
          {/* ======================== */}
          {activeTab === "dashboard" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Stat Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bugungi savdo</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{(stats.todays_sales.value ?? 0).toLocaleString()} so'm</div><p className="text-xs text-muted-foreground">{stats.todays_sales.change_percent ?? 0}% vs {stats.todays_sales.comparison_period || "N/A"}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bugungi Buyurtmalar</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">+{stats.todays_orders.value ?? 0}</div><p className="text-xs text-muted-foreground">{stats.todays_orders.change_percent ?? 0}% vs {stats.todays_orders.comparison_period || "N/A"}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faol xodimlar</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.active_employees.value ?? 0}</div><p className="text-xs text-muted-foreground">{stats.active_employees.change_absolute ?? 0} vs {stats.active_employees.comparison_period || "N/A"}</p></CardContent>
              </Card>

              {/* Sales Chart */}
              <Card className="col-span-full md:col-span-2">
                <CardHeader><CardTitle>Savdo dinamikasi (Oxirgi 7 kun)</CardTitle></CardHeader>
                <CardContent className="pl-2">
                  {validSalesData.length > 0 && isClient ? (
                    <div className="h-[250px] w-full">
                      <Chart options={{ chart: { id: "weekly-sales-chart", toolbar: { show: false } }, xaxis: { categories: validSalesData.map((day) => new Date(day.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })), labels: { rotate: -45, style: { fontSize: "10px", colors: '#9ca3af' }, offsetY: 5 }, axisBorder: { show: false }, axisTicks: { show: false } }, yaxis: { labels: { formatter: (value) => `${(value / 1000).toFixed(0)}k`, style: { colors: '#9ca3af' } } }, dataLabels: { enabled: false }, stroke: { curve: "smooth", width: 2 }, colors: ["#3b82f6"], grid: { borderColor: "#e5e7eb", strokeDashArray: 4, row: { colors: ['transparent', 'transparent'], opacity: 0.5 } }, tooltip: { theme: 'light', y: { formatter: (value) => `${value.toLocaleString()} so'm` } }, fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3, stops: [0, 90, 100] } }, }} series={[{ name: "Savdo", data: validSalesData.map((day) => day.sales) }]} type="area" height={250}/>
                    </div>) : (<div className="flex h-[250px] items-center justify-center text-muted-foreground">Ma'lumotlar yuklanmoqda yoki mavjud emas...</div>)}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="col-span-full md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-4"><CardTitle className="text-base font-semibold">Eng ko'p sotilgan mahsulotlar</CardTitle><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-1">{dateRange === "daily" ? "Kunlik" : dateRange === "weekly" ? "Haftalik" : "Oylik"}<ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDateRange("daily")}>Kunlik</DropdownMenuItem><DropdownMenuItem onClick={() => setDateRange("weekly")}>Haftalik</DropdownMenuItem><DropdownMenuItem onClick={() => setDateRange("monthly")}>Oylik</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardHeader>
                <CardContent className="p-0"><ScrollArea className="h-[250px]"><Table><TableHeader><TableRow><TableHead>Mahsulot</TableHead><TableHead className="text-right">Miqdor</TableHead><TableHead className="text-right">Savdo</TableHead></TableRow></TableHeader><TableBody>{validTopProducts.length > 0 ? (validTopProducts.map((product, index) => (<TableRow key={product.product_id || index}><TableCell className="font-medium">{product.product_name || "Noma'lum Mahsulot"}</TableCell><TableCell className="text-right">{product.quantity ?? 0}</TableCell><TableCell className="text-right">{(product.sales ?? 0).toLocaleString()} so'm</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Bu davr uchun ma'lumot yo'q</TableCell></TableRow>)}</TableBody></Table></ScrollArea></CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="col-span-full">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>So'nggi buyurtmalar</CardTitle><CardDescription>Oxirgi {displayedOrders.length} ta buyurtma.</CardDescription></CardHeader>
                <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="w-[80px]">ID</TableHead><TableHead>Mijoz</TableHead><TableHead className="hidden sm:table-cell">Turi</TableHead><TableHead className="text-right">Jami</TableHead><TableHead className="hidden md:table-cell">Holat</TableHead><TableHead className="hidden lg:table-cell text-right">Sana</TableHead><TableHead className="text-right w-[100px]">Amallar</TableHead></TableRow></TableHeader><TableBody>{displayedOrders.length > 0 ? (displayedOrders.map((order) => (<TableRow key={order.id}><TableCell className="font-medium">#{order.id}</TableCell><TableCell>{order.customer_name || "Noma'lum"}</TableCell><TableCell className="hidden sm:table-cell">{order.order_type_display || 'N/A'}</TableCell><TableCell className="text-right">{parseFloat(order.final_price || 0).toLocaleString()} so'm</TableCell><TableCell className="hidden md:table-cell"><Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : order.status === 'pending' ? 'warning' : 'outline'}>{order.status_display || 'N/A'}</Badge></TableCell><TableCell className="hidden lg:table-cell text-right">{new Date(order.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /><span className="sr-only">Amallar</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled>Batafsil</DropdownMenuItem><DropdownMenuItem disabled>Chek chiqarish</DropdownMenuItem>{order.status !== 'completed' && order.status !== 'cancelled' && (<><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => handleCancelOrder(order.id)}>Bekor qilish</DropdownMenuItem></>)}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Hozircha buyurtmalar mavjud emas</TableCell></TableRow>)}</TableBody></Table></CardContent>
                {validOrders.length > 5 && (<CardFooter className="flex items-center justify-center border-t px-6 py-3 dark:border-slate-700">{showAllOrders ? (<Button size="sm" variant="outline" className="w-full" onClick={() => setShowAllOrders(false)}>Kamroq ko'rsatish</Button>) : (<Button size="sm" variant="outline" className="w-full" onClick={() => setShowAllOrders(true)}>Barcha {validOrders.length} buyurtmani ko'rish</Button>)}</CardFooter>)}
              </Card>
            </div>
          )}

          {/* ======================== */}
          {/* == REPORTS TAB == */}
          {/* ======================== */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><h2 className="text-2xl font-bold tracking-tight">Hisobotlar</h2></div>
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4"><TabsTrigger value="sales">Savdo</TabsTrigger><TabsTrigger value="products">Mahsulotlar</TabsTrigger><TabsTrigger value="employees">Xodimlar</TabsTrigger><TabsTrigger value="customers">Mijozlar</TabsTrigger></TabsList>
                {/* --- Sales Report --- */}
                <TabsContent value="sales" className="space-y-4 pt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Jami savdo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(stats.todays_sales.value ?? 0).toLocaleString()} so'm</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Buyurtmalar soni</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.todays_orders.value ?? 0}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Faol xodimlar</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active_employees.value ?? 0}</div></CardContent></Card>
                  </div>
                  <Card>
                    <CardHeader><CardTitle>Savdo dinamikasi (Diagramma)</CardTitle></CardHeader>
                    <CardContent className="pl-2">{validSalesData.length > 0 && isClient ? (<div className="h-[300px]"><Chart options={{ chart: { id: "sales-dynamics-bar", toolbar: { show: true, tools: { download: true } } }, plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } }, xaxis: { categories: validSalesData.map((day) => new Date(day.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })), labels: { style: { colors: '#9ca3af' } } }, yaxis: { title: { text: "Savdo (ming so'm)", style: { color: '#9ca3af' } }, labels: { formatter: (value) => `${(value / 1000).toFixed(0)}k`, style: { colors: '#9ca3af' } } }, dataLabels: { enabled: false }, colors: ["#3b82f6"], grid: { borderColor: "#e5e7eb", strokeDashArray: 4, row: { colors: ['transparent', 'transparent'], opacity: 0.5 } }, tooltip: { theme: 'light', y: { formatter: (value) => `${value.toLocaleString()} so'm` } }, }} series={[{ name: "Savdo", data: validSalesData.map((day) => day.sales) }]} type="bar" height={300}/></div>) : (<div className="flex h-[300px] items-center justify-center text-muted-foreground">Ma'lumotlar mavjud emas</div>)}</CardContent>
                  </Card>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader><CardTitle>To'lov usullari</CardTitle></CardHeader>
                      <CardContent>{validPaymentMethods.length > 0 && isClient ? (<div className="h-[250px]"><Chart options={{ chart: { id: "payment-methods-pie", toolbar: { show: false } }, labels: validPaymentMethods.map((method) => method.method_display || 'Noma\'lum'), dataLabels: { enabled: true, formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex].toFixed(1) + '%' }, colors: ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7"], legend: { position: 'bottom' }, tooltip: { y: { formatter: (value) => `${value.toFixed(1)}%` } }, stroke: { show: false } }} series={validPaymentMethods.map((method) => method.percentage ?? 0)} type="donut" height={250}/></div>) : (<div className="flex h-[250px] items-center justify-center text-muted-foreground">Ma'lumotlar mavjud emas</div>)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Buyurtma turlari</CardTitle></CardHeader>
                      <CardContent>{validOrderTypes.length > 0 && isClient ? (<div className="h-[250px]"><Chart options={{ chart: { id: "order-types-pie", toolbar: { show: false } }, labels: validOrderTypes.map((type) => type.type_display || 'Noma\'lum'), dataLabels: { enabled: true, formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex].toFixed(1) + '%' }, colors: ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7"], legend: { position: 'bottom' }, tooltip: { y: { formatter: (value) => `${value.toFixed(1)}%` } }, stroke: { show: false } }} series={validOrderTypes.map((type) => type.percentage ?? 0)} type="donut" height={250}/></div>) : (<div className="flex h-[250px] items-center justify-center text-muted-foreground">Ma'lumotlar mavjud emas</div>)}</CardContent>
                    </Card>
                  </div>
                </TabsContent>
                {/* --- Products Report --- */}
                <TabsContent value="products" className="space-y-4 pt-6"><Card><CardHeader><CardTitle>Mahsulotlar bo'yicha hisobot</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Mahsulot</TableHead><TableHead className="text-right">Sotilgan Miqdor</TableHead><TableHead className="text-right">Jami Savdo</TableHead><TableHead className="text-right hidden sm:table-cell">Taxminiy Foyda</TableHead></TableRow></TableHeader><TableBody>{validProducts.length > 0 ? (validProducts.map((product, index) => (<TableRow key={product.product_id || index}><TableCell className="font-medium">{product.product_name || "Noma'lum Mahsulot"}</TableCell><TableCell className="text-right">{product.sold_quantity ?? 0}</TableCell><TableCell className="text-right">{(product.sales_revenue ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right hidden sm:table-cell">{(product.profit ?? 0).toLocaleString()} so'm</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Hozircha mahsulotlar hisoboti mavjud emas</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
                {/* --- Employees Report --- */}
                <TabsContent value="employees" className="space-y-4 pt-6"><Card><CardHeader><CardTitle>Xodimlar bo'yicha hisobot</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Xodim</TableHead><TableHead className="hidden sm:table-cell">Lavozim</TableHead><TableHead className="text-right">Buyurtmalar</TableHead><TableHead className="text-right">Savdo</TableHead><TableHead className="text-right hidden md:table-cell">O'rtacha chek</TableHead></TableRow></TableHeader><TableBody>{validEmployeeReport.length > 0 ? (validEmployeeReport.map((employee, index) => (<TableRow key={employee.employee_id || index}><TableCell className="font-medium">{employee.employee_name || "Noma'lum Xodim"}</TableCell><TableCell className="hidden sm:table-cell">{employee.role_name || "Noma'lum"}</TableCell><TableCell className="text-right">{employee.orders_count ?? 0}</TableCell><TableCell className="text-right">{(employee.total_sales ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right hidden md:table-cell">{Math.round(employee.average_check ?? 0).toLocaleString()} so'm</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Hozircha xodimlar hisoboti mavjud emas</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
                {/* --- Customers Report --- */}
                <TabsContent value="customers" className="space-y-4 pt-6"><Card><CardHeader><CardTitle>Mijozlar bo'yicha hisobot</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Mijoz turi</TableHead><TableHead className="text-right">Buyurtmalar</TableHead><TableHead className="text-right">Savdo</TableHead><TableHead className="text-right">O'rtacha chek</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">Doimiy mijozlar</TableCell><TableCell className="text-right">{customerReport.regular_customers.orders_count ?? 0}</TableCell><TableCell className="text-right">{(customerReport.regular_customers.total_sales ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right">{Math.round(customerReport.regular_customers.average_check ?? 0).toLocaleString()} so'm</TableCell></TableRow><TableRow><TableCell className="font-medium">Yangi mijozlar</TableCell><TableCell className="text-right">{customerReport.new_customers.orders_count ?? 0}</TableCell><TableCell className="text-right">{(customerReport.new_customers.total_sales ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right">{Math.round(customerReport.new_customers.average_check ?? 0).toLocaleString()} so'm</TableCell></TableRow><TableRow><TableCell className="font-medium">Bir martalik mijozlar</TableCell><TableCell className="text-right">{customerReport.one_time_customers.orders_count ?? 0}</TableCell><TableCell className="text-right">{(customerReport.one_time_customers.total_sales ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right">{Math.round(customerReport.one_time_customers.average_check ?? 0).toLocaleString()} so'm</TableCell></TableRow></TableBody></Table></CardContent></Card></TabsContent>
              </Tabs>
            </div>
          )}

          {/* ======================== */}
          {/* == EMPLOYEES TAB == */}
          {/* ======================== */}
          {activeTab === "employees" && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><h2 className="text-2xl font-bold tracking-tight">Xodimlar</h2><Button onClick={() => setShowAddEmployeeDialog(true)}><Plus className="mr-2 h-4 w-4" />Yangi xodim qo'shish</Button></div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Xodim</TableHead><TableHead className="hidden sm:table-cell">Lavozim</TableHead><TableHead className="hidden md:table-cell">Username</TableHead><TableHead>Holat</TableHead><TableHead className="text-right">Amallar</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {validXodim.length > 0 ? (validXodim.map((employee) => (<TableRow key={employee.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={employee.image || "/placeholder-user.jpg"} alt={`${employee.first_name} ${employee.last_name}`} /><AvatarFallback>{`${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`.toUpperCase()}</AvatarFallback></Avatar><div><p className="font-medium">{employee.first_name} {employee.last_name}</p></div></div></TableCell><TableCell className="hidden sm:table-cell">{employee.role?.name || "Noma'lum"}</TableCell><TableCell className="hidden md:table-cell">{employee.username}</TableCell><TableCell><Badge variant={employee.is_active ? "success" : "secondary"}>{employee.is_active ? "Faol" : "Faol emas"}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /><span className="sr-only">Amallar</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled>Tahrirlash</DropdownMenuItem><DropdownMenuItem disabled>PIN-kodni o'zgartirish</DropdownMenuItem><DropdownMenuItem disabled>Holatni o'zgartirish</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => handleDeleteEmployee(employee.id)}>O'chirish</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)))
                       : (<TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Xodimlar topilmadi.</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ======================== */}
          {/* == ROLES TAB == */}
          {/* ======================== */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><h2 className="text-2xl font-bold tracking-tight">Rollar va Huquqlar</h2><Button onClick={() => setShowAddRoleDialog(true)}><Plus className="mr-2 h-4 w-4" />Yangi rol qo'shish</Button></div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Rol nomi</TableHead><TableHead>Huquqlar</TableHead><TableHead className="hidden sm:table-cell text-right">Xodimlar soni</TableHead><TableHead className="text-right">Amallar</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {validFetchedRoles.length > 0 ? (validFetchedRoles.map((role) => (<TableRow key={role.id}><TableCell className="font-medium">{role.name}</TableCell><TableCell><div className="flex flex-wrap gap-1">{(Array.isArray(role.permissions) ? role.permissions : []).map((permission, pIndex) => (<Badge key={permission?.codename || permission || pIndex} variant="outline" className="text-xs">{permission?.name || permission?.codename || permission}</Badge>))}{(!Array.isArray(role.permissions) || role.permissions.length === 0) && (<span className="text-xs text-muted-foreground">Huquqlar belgilanmagan</span>)}</div></TableCell><TableCell className="hidden sm:table-cell text-right">{role.employee_count ?? role.count ?? 0}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /><span className="sr-only">Amallar</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled>Tahrirlash</DropdownMenuItem><DropdownMenuItem disabled>Huquqlarni o'zgartirish</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => handleDeleteRole(role)}>O'chirish</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)))
                       : (<TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Rollar topilmadi. Yangi rol qo'shing.</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ======================== */}
          {/* == ORDERS TAB == */}
          {/* ======================== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><h2 className="text-2xl font-bold tracking-tight">Barcha Buyurtmalar</h2></div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[80px]">ID</TableHead><TableHead>Mijoz</TableHead><TableHead className="hidden sm:table-cell">Turi</TableHead><TableHead className="text-right">Jami</TableHead><TableHead className="hidden md:table-cell">Holat</TableHead><TableHead className="hidden lg:table-cell text-right">Sana</TableHead><TableHead className="text-right">Amallar</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {validOrders.length > 0 ? (validOrders.map((order) => (<TableRow key={order.id}><TableCell className="font-medium">#{order.id}</TableCell><TableCell>{order.customer_name || "Noma'lum"}</TableCell><TableCell className="hidden sm:table-cell">{order.order_type_display || 'N/A'}</TableCell><TableCell className="text-right">{parseFloat(order.final_price || 0).toLocaleString()} so'm</TableCell><TableCell className="hidden md:table-cell"><Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : order.status === 'pending' ? 'warning' : 'outline'}>{order.status_display || 'N/A'}</Badge></TableCell><TableCell className="hidden lg:table-cell text-right">{new Date(order.created_at).toLocaleString('uz-UZ')}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /><span className="sr-only">Amallar</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled>Batafsil</DropdownMenuItem><DropdownMenuItem disabled>Chek chiqarish</DropdownMenuItem>{order.status !== 'completed' && order.status !== 'cancelled' && (<><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => handleCancelOrder(order.id)}>Bekor qilish</DropdownMenuItem></>)}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)))
                       : (<TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Buyurtmalar topilmadi.</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ======================== */}
          {/* == SETTINGS TAB == */}
          {/* ======================== */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold tracking-tight">Sozlamalar</h2>
              <Card>
                <CardHeader><CardTitle>Restoran ma'lumotlari</CardTitle><CardDescription>Restoran haqidagi asosiy ma'lumotlarni tahrirlash.</CardDescription></CardHeader>
                <CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="restaurant-name">Restoran nomi</Label><Input id="restaurant-name" defaultValue="SmartResto" disabled /></div><div className="space-y-1.5"><Label htmlFor="restaurant-phone">Telefon raqami</Label><Input id="restaurant-phone" defaultValue="+998 71 123 45 67" disabled /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="restaurant-address">Manzil</Label><Input id="restaurant-address" defaultValue="Toshkent sh., Chilonzor tumani" disabled /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="restaurant-email">Email</Label><Input id="restaurant-email" defaultValue="info@smartresto.uz" type="email" disabled /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="restaurant-description">Tavsif</Label><Input id="restaurant-description" defaultValue="Milliy va zamonaviy taomlar restorani" disabled /></div></div></CardContent>
                <CardFooter><Button disabled>Saqlash</Button><p className="text-xs text-muted-foreground ml-4">Bu ma'lumotlarni o'zgartirish uchun dasturchiga murojaat qiling.</p></CardFooter>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tizim sozlamalari</CardTitle><CardDescription>Asosiy tizim parametrlarini sozlash.</CardDescription></CardHeader>
                <CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="currency">Valyuta</Label><Select defaultValue="uzs" disabled><SelectTrigger id="currency"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uzs">So'm (UZS)</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="language">Til</Label><Select defaultValue="uz" disabled><SelectTrigger id="language"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uz">O'zbek</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="tax-rate">Soliq stavkasi (%)</Label><Input id="tax-rate" type="number" defaultValue="12" disabled /></div><div className="space-y-1.5"><Label htmlFor="service-fee">Xizmat haqi (%)</Label><Input id="service-fee" type="number" defaultValue="10" disabled /></div></div></CardContent>
                <CardFooter><Button disabled>Saqlash</Button><p className="text-xs text-muted-foreground ml-4">Bu sozlamalar hozircha o'zgartirilmaydi.</p></CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* ======================== */}
      {/* == DIALOGS == */}
      {/* ======================== */}

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Yangi xodim qo'shish</DialogTitle><DialogDescription>Xodim ma'lumotlarini kiriting. Saqlaganingizdan so'ng tizimga kirishi mumkin bo'ladi.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="username" className="text-right text-sm">Username</Label><Input id="username" className="col-span-3 h-9" value={newEmployee.username} onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })} required />
              <Label htmlFor="first_name" className="text-right text-sm">Ism</Label><Input id="first_name" className="col-span-3 h-9" value={newEmployee.first_name} onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })} required />
              <Label htmlFor="last_name" className="text-right text-sm">Familiya</Label><Input id="last_name" className="col-span-3 h-9" value={newEmployee.last_name} onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })} required />
              <Label htmlFor="role" className="text-right text-sm">Lavozim</Label>
              <Select value={newEmployee.role_id} onValueChange={(value) => setNewEmployee({ ...newEmployee, role_id: value })} required>
                <SelectTrigger id="role" className="col-span-3 h-9"><SelectValue placeholder="Lavozimni tanlang" /></SelectTrigger>
                <SelectContent>{validRolesList.length > 0 ? (validRolesList.map((role) => (<SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>))) : (<div className="px-2 py-1.5 text-sm text-muted-foreground">Rollar topilmadi</div>)}</SelectContent>
              </Select>
              <Label htmlFor="pin" className="text-right text-sm">PIN-kod</Label><Input id="pin" type="password" placeholder="4 raqamli PIN" className="col-span-3 h-9" value={newEmployee.pin_code} onChange={(e) => setNewEmployee({ ...newEmployee, pin_code: e.target.value.replace(/\D/g, '').slice(0, 4) })} maxLength={4} required />
              <Label htmlFor="status" className="text-right text-sm">Holat</Label>
              <Select value={newEmployee.is_active ? "active" : "inactive"} onValueChange={(value) => setNewEmployee({ ...newEmployee, is_active: value === "active" })}>
                <SelectTrigger id="status" className="col-span-3 h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Faol</SelectItem><SelectItem value="inactive">Faol emas</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setShowAddEmployeeDialog(false); setNewEmployee({ username: "", first_name: "", last_name: "", role_id: "", pin_code: "", is_active: true }); }}>Bekor qilish</Button><Button type="button" onClick={handleAddEmployee}>Saqlash</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Yangi rol qo'shish</DialogTitle><DialogDescription>Yangi rol nomini kiriting. Saqlaganingizdan so'ng tizimda yangi rol paydo bo'ladi.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-x-4 gap-y-2"><Label htmlFor="role_name" className="text-right text-sm">Rol nomi</Label><Input id="role_name" className="col-span-3 h-9" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setShowAddRoleDialog(false); setNewRole({ name: "" }); }}>Bekor qilish</Button><Button type="button" onClick={handleAddRole}>Saqlash</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Deletion Confirmation Dialog */}
      <Dialog open={isDeleteRoleConfirmOpen} onOpenChange={setIsDeleteRoleConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rolni o'chirishni tasdiqlang</DialogTitle>
            <DialogDescription>
              {roleToDelete ? (
                <>
                  Haqiqatan ham <strong className="text-foreground">"{roleToDelete.name}"</strong> (ID: {roleToDelete.id}) rolini o'chirmoqchimisiz?
                </>
              ) : (
                "O'chirish uchun rol topilmadi."
              )}
            </DialogDescription>
            {/* Additional notes outside DialogDescription */}
            {roleToDelete?.employee_count > 0 && (
                <div className="mt-2 text-sm text-destructive"> {/* Changed from P */}
                    <strong className="font-semibold">DIQQAT:</strong> Bu rolga {roleToDelete.employee_count} ta xodim biriktirilgan! Odatda bunday rollarni o'chirib bo'lmaydi.
                </div>
             )}
             <div className="mt-2 text-sm text-muted-foreground"> {/* Changed from P */}
                Bu amalni qaytarib bo'lmaydi.
             </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteRoleConfirmOpen(false);
                setRoleToDelete(null);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRole}
              disabled={!roleToDelete}
            >
              Ha, O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div> // End of main wrapper div
  );
  // ==================================
  //      JSX END
  // ==================================
}