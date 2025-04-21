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

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

// Mock data for roles (if API fails or for testing)
const fallbackRoles = [
  { id: 1, name: "Afitsiant", permissions: ["pos_access", "order_create"], count: 5 },
  { id: 2, name: "Oshpaz", permissions: ["kitchen_access", "order_update"], count: 3 },
  { id: 3, name: "Kassir", permissions: ["cashier_access", "payment_process"], count: 2 },
  { id: 4, name: "Administrator", permissions: ["admin_access", "all_reports", "employee_manage"], count: 1 },
  { id: 5, name: "Yetkazuvchi", permissions: ["delivery_access", "order_update"], count: 4 },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [dateRange, setDateRange] = useState("weekly")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState({
    todays_sales: { value: 0, change_percent: 0, comparison_period: "" },
    todays_orders: { value: 0, change_percent: 0, comparison_period: "" },
    average_check: { value: 0, change_percent: 0, comparison_period: "" },
    active_employees: { value: 0, change_absolute: 0, comparison_period: "" },
  })
  const [errorMessage, setErrorMessage] = useState("")
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
  const [dialogError, setDialogError] = useState("")
  const [dialogSuccess, setDialogSuccess] = useState("")
  const [orders, setOrders] = useState([])
  const [employeeReport, setEmployeeReport] = useState([])
  const [customerReport, setCustomerReport] = useState({
    regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
    new_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
    one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
  })
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [orderTypes, setOrderTypes] = useState([])
  const [fetchedRoles, setFetchedRoles] = useState(fallbackRoles)

  const getAuthHeader = () => {
    const currentToken = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`,
      // Agar CSRF token kerak bo'lsa (lekin DELETE uchun odatda shart emas)
      // 'X-CSRFTOKEN': csrfToken, // csrfToken-ni qayerdandir olish kerak
    }
  }

  const fetchData = async (url, setter, errorMsg, fallbackData = null) => {
    try {
      const response = await axios.get(url, { headers: getAuthHeader() })
      setter(response.data ?? fallbackData)
    } catch (err) {
      console.error(`Error fetching ${errorMsg}:`, err)
      setErrorMessage(`${errorMsg} yuklashda xatolik: ${err.response?.data?.detail || err.message}`)
      if (fallbackData !== null) {
        setter(fallbackData)
      }
    }
  }

  useEffect(() => {
    setIsClient(true)
    const storedToken = localStorage.getItem("token")
    if (!storedToken) {
      router.push("/auth")
    } else {
      setToken(storedToken)
    }
  }, [router])

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    if (token) { // Faqat token mavjud bo'lganda fetch qilish
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/orders/`, data => { setRecentOrders(data || []); setOrders(data || []) }, "Buyurtmalar", [])
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/stats/`, setStats, "Statistika", { todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" }, todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" }, average_check: { value: 0, change_percent: 0, comparison_period: "N/A" }, active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" } })
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, setXodim, "Xodimlar", [])
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, setRolesList, "Rollar ro'yxati", [])
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, setFetchedRoles, "Rollar", fallbackRoles)
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/employees/`, setEmployeeReport, "Xodimlar bo'yicha hisobot", [])
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/products/`, setProducts, "Mahsulotlar hisoboti", [])
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/customers/`, setCustomerReport, "Mijozlar hisoboti", { regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 }, new_customers: { orders_count: 0, total_sales: 0, average_check: 0 }, one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 } })
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/charts/`, data => { setPaymentMethods(data?.payment_methods || []); setOrderTypes(data?.order_types || []) }, "Diagrammalar ma'lumotlari", { payment_methods: [], order_types: [] })
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/sales-chart/`, setSalesData, "Savdo grafigi", [])
    }
  }, [token, router]); // Token o'zgarganda qayta fetch qilish

  // Fetch top products when dateRange changes
  useEffect(() => {
    if (token) {
      fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/top-products/?period=${dateRange}`, setTopProducts, "Eng ko'p sotilgan mahsulotlar", [])
    }
  }, [dateRange, token]); // dateRange yoki token o'zgarganda

  // --- Handler funksiyalar ---

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await axios.post(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/cancel_order/`,
        {},
        { headers: getAuthHeader() }
      )
      if (response.status === 200 || response.status === 204) {
        fetchData(
          `https://oshxonacopy.pythonanywhere.com/api/orders/`,
          (data) => {
            setRecentOrders(data || [])
            setOrders(data || [])
          },
          "Buyurtmalar",
          []
        )
        setErrorMessage("")
      }
    } catch (err) {
      console.error("Cancel Order Error:", err)
      setErrorMessage("Buyurtmani bekor qilishda xatolik: " + (err.response?.data?.detail || err.message))
    }
  }

  const handleAddEmployee = async () => {
    setDialogError("")
    setDialogSuccess("")
    if (!newEmployee.username || !newEmployee.first_name || !newEmployee.last_name || !newEmployee.role_id || !newEmployee.pin_code) {
      setDialogError("Iltimos, barcha maydonlarni to'ldiring")
      return
    }
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
        { headers: getAuthHeader() }
      )
      setDialogSuccess("Xodim muvaffaqiyatli qo'shildi!")
      setTimeout(() => {
        setNewEmployee({ username: "", first_name: "", last_name: "", role_id: "", pin_code: "", is_active: true })
        setShowAddEmployeeDialog(false)
        setDialogSuccess("")
        fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, setXodim, "Xodimlar", [])
      }, 1500)
    } catch (err) {
      console.error("Add Employee Error:", err)
      let errorDetail = "Xodim qo'shishda xatolik yuz berdi"
      if (err.response?.data) {
        if (err.response.data.username) errorDetail = `Username: ${err.response.data.username.join(', ')}`
        else if (err.response.data.pin_code) errorDetail = `PIN-kod: ${err.response.data.pin_code.join(', ')}`
        else if (err.response.data.detail) errorDetail = err.response.data.detail
        else errorDetail = JSON.stringify(err.response.data)
      } else {
        errorDetail = err.message
      }
      setDialogError(errorDetail)
    }
  }

  const handleAddRole = async () => {
    setDialogError("")
    setDialogSuccess("")
    if (!newRole.name) {
      setDialogError("Iltimos, rol nomini kiriting")
      return
    }
    try {
      await axios.post(
        "https://oshxonacopy.pythonanywhere.com/api/admin/roles/",
        { name: newRole.name },
        { headers: getAuthHeader() }
      )
      setDialogSuccess("Rol muvaffaqiyatli qo'shildi!")
      setTimeout(() => {
        setNewRole({ name: "" })
        setShowAddRoleDialog(false)
        setDialogSuccess("")
        // Refresh both role lists after adding
        fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, setFetchedRoles, "Rollar", fallbackRoles)
        fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, setRolesList, "Rollar ro'yxati", [])
      }, 1500)
    } catch (err) {
      console.error("Add Role Error:", err)
      let errorDetail = "Rol qo'shishda xatolik yuz berdi"
      if (err.response?.data) {
        if (err.response.data.name) errorDetail = `Rol nomi: ${err.response.data.name.join(', ')}`
        else if (err.response.data.detail) errorDetail = err.response.data.detail
        else errorDetail = JSON.stringify(err.response.data)
      } else {
        errorDetail = err.message
      }
      setDialogError(errorDetail)
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (!confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) return
    try {
      const response = await axios.delete(`https://oshxonacopy.pythonanywhere.com/api/admin/users/${id}/`, {
        headers: getAuthHeader(),
      })
      if (response.status === 204) {
        fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, setXodim, "Xodimlar", [])
        setErrorMessage("")
      }
    } catch (err) {
      console.error("Delete Employee Error:", err)
      setErrorMessage("Xodimni o'chirishda xatolik: " + (err.response?.data?.detail || err.message))
    }
  }

  // ==================================================
  // YANGI FUNKSIYA: Rolni o'chirish
  // ==================================================
  const handleDeleteRole = async (roleId) => {
    // Tasdiqlash oynasi
    if (!confirm(`Haqiqatan ham IDsi ${roleId} bo'lgan rolni o'chirmoqchimisiz? Bu rolga biriktirilgan xodimlar bo'lsa, xatolik yuz berishi mumkin!`)) {
      return;
    }

    setErrorMessage(""); // Oldingi xatoliklarni tozalash

    try {
      const response = await axios.delete(
        `https://oshxonacopy.pythonanywhere.com/api/admin/roles/${roleId}/`, // To'g'ri endpoint
        { headers: getAuthHeader() } // Avtorizatsiya headeri
      );

      // DELETE so'rovi muvaffaqiyatli bo'lsa, odatda 204 No Content status kodi qaytariladi
      if (response.status === 204) {
        // Muvaffaqiyat: Rollar ro'yxatini yangilash
        fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, setFetchedRoles, "Rollar", fallbackRoles);
        // Xodim qo'shish dialogi uchun ham ro'yxatni yangilash
        fetchData(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, setRolesList, "Rollar ro'yxati", []);
        // Optional: Muvaffaqiyatli o'chirilganligi haqida xabar (agar kerak bo'lsa)
        // alert("Rol muvaffaqiyatli o'chirildi!");
      } else {
        // Agar boshqa status kodi kelsa (bu kutilmagan holat)
        setErrorMessage(`Rolni o'chirishda kutilmagan javob: ${response.status}`);
      }
    } catch (err) {
      console.error("Delete Role Error:", err);
      let errorDetail = "Rolni o'chirishda xatolik yuz berdi.";

      // Backenddan keladigan maxsus xatolikni tekshirish (agar mavjud bo'lsa)
      if (err.response?.status === 400 && err.response?.data?.error?.includes("Cannot delete role with assigned users")) {
        errorDetail = "Bu rolni o'chirib bo'lmaydi, chunki unga biriktirilgan xodimlar mavjud.";
      } else if (err.response?.data?.detail) {
        errorDetail = `Rolni o'chirishda xatolik: ${err.response.data.detail}`;
      } else {
        errorDetail = `Rolni o'chirishda xatolik: ${err.message}`;
      }
      setErrorMessage(errorDetail);
    }
  };
  // ==================================================
  // /YANGI FUNKSIYA
  // ==================================================


  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/auth")
  }

  // --- Rendering Logic ---

  const displayedOrders = showAllOrders ? recentOrders : (recentOrders || []).slice(0, 5)

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Yuklanmoqda...</p>
      </div>
    )
  }

  // Ensure data is array before mapping/accessing properties
  const validSalesData = Array.isArray(salesData) ? salesData : []
  const validPaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : []
  const validOrderTypes = Array.isArray(orderTypes) ? orderTypes : []
  const validFetchedRoles = Array.isArray(fetchedRoles) ? fetchedRoles : fallbackRoles; // Use fallback if not array
  const validXodim = Array.isArray(xodim) ? xodim : [];
  const validOrders = Array.isArray(orders) ? orders : [];
  const validRecentOrders = Array.isArray(recentOrders) ? recentOrders : [];
  const validEmployeeReport = Array.isArray(employeeReport) ? employeeReport : [];
  const validProducts = Array.isArray(products) ? products : [];
  const validRolesList = Array.isArray(rolesList) ? rolesList : [];
  const validTopProducts = Array.isArray(topProducts) ? topProducts : [];


  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar (Desktop) */}
      <div className="hidden w-64 flex-col bg-slate-900 text-white md:flex dark:bg-slate-800">
        <div className="flex h-14 items-center border-b border-slate-700 px-4 dark:border-slate-600">
          <Store className="mr-2 h-6 w-6 text-sky-400" />
          <h1 className="text-lg font-bold">SmartResto Admin</h1>
        </div>
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4">
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Asosiy</h2>
            <div className="space-y-1">
              <Button
                variant={activeTab === "dashboard" ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeTab === 'dashboard' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Boshqaruv paneli
              </Button>
              <Button
                variant={activeTab === "reports" ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeTab === 'reports' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab("reports")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Hisobotlar
              </Button>
              <Button
                variant={activeTab === "employees" ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeTab === 'employees' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab("employees")}
              >
                <Users className="mr-2 h-4 w-4" />
                Xodimlar
              </Button>
              <Button
                variant={activeTab === "roles" ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeTab === 'roles' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab("roles")}
              >
                <Sliders className="mr-2 h-4 w-4" />
                Rollar
              </Button>
              <Button
                variant={activeTab === "orders" ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeTab === 'orders' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab("orders")}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buyurtmalar
              </Button>
            </div>
            <h2 className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tizim</h2>
            <div className="space-y-1">
              <Button
                variant={activeTab === "settings" ? "secondary" : "ghost"}
                className={`w-full justify-start ${activeTab === 'settings' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Sozlamalar
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-slate-700/50 dark:hover:bg-slate-700" onClick={() => router.push("/pos")}>
                <Home className="mr-2 h-4 w-4" />
                POS ga qaytish
              </Button>
              <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-900/30 hover:text-red-400" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Chiqish
              </Button>
            </div>
          </nav>
        </ScrollArea>
        <div className="border-t border-slate-700 p-4 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar (Mobile) */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMobileSidebar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="fixed left-0 top-0 h-full w-64 flex-col bg-slate-900 text-white dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex h-14 items-center justify-between border-b border-slate-700 px-4 dark:border-slate-600">
              <div className="flex items-center">
                <Store className="mr-2 h-6 w-6 text-sky-400" />
                <h1 className="text-lg font-bold">SmartResto</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <nav className="px-3 py-4">
                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Asosiy</h2>
                <div className="space-y-1">
                  {[
                    { name: 'dashboard', label: 'Boshqaruv paneli', icon: BarChart3 },
                    { name: 'reports', label: 'Hisobotlar', icon: FileText },
                    { name: 'employees', label: 'Xodimlar', icon: Users },
                    { name: 'roles', label: 'Rollar', icon: Sliders },
                    { name: 'orders', label: 'Buyurtmalar', icon: ShoppingCart },
                  ].map(item => (
                    <Button
                      key={item.name}
                      variant={activeTab === item.name ? "secondary" : "ghost"}
                      className={`w-full justify-start ${activeTab === item.name ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                      onClick={() => { setActiveTab(item.name); setShowMobileSidebar(false); }}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </div>
                <h2 className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tizim</h2>
                <div className="space-y-1">
                  <Button
                    variant={activeTab === "settings" ? "secondary" : "ghost"}
                    className={`w-full justify-start ${activeTab === 'settings' ? 'bg-slate-700 dark:bg-slate-600' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700'}`}
                    onClick={() => { setActiveTab("settings"); setShowMobileSidebar(false); }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Sozlamalar
                  </Button>
                  <Button variant="ghost" className="w-full justify-start hover:bg-slate-700/50 dark:hover:bg-slate-700" onClick={() => { router.push("/pos"); setShowMobileSidebar(false); }}>
                    <Home className="mr-2 h-4 w-4" />
                    POS ga qaytish
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-900/30 hover:text-red-400" onClick={() => { handleLogout(); setShowMobileSidebar(false); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Chiqish
                  </Button>
                </div>
              </nav>
            </ScrollArea>
            <div className="border-t border-slate-700 p-4 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 dark:bg-slate-900 dark:border-slate-700">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center">
              <Store className="h-6 w-6 text-sky-400" />
              <h1 className="ml-2 text-lg font-bold">SmartResto</h1>
            </div>
          </div>
          {/* Desktop Header (Right Side) */}
          <div className="flex items-center gap-4 ml-auto"> {/* Use ml-auto to push to the right */}
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              <Calendar className="mr-2 h-4 w-4" />
              {new Date().toLocaleDateString("uz-UZ", { day: '2-digit', month: 'long', year: 'numeric' })}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Sozlamalar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Chiqish</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
              <p>Xatolik: {errorMessage}</p>
              <Button variant="ghost" size="sm" className="mt-1 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800" onClick={() => setErrorMessage("")}>Yopish</Button>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Stat Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bugungi savdo</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats?.todays_sales?.value ?? 0).toLocaleString()} so'm</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.todays_sales?.change_percent ?? 0}% vs {stats?.todays_sales?.comparison_period || "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bugungi Buyurtmalar</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{stats?.todays_orders?.value ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.todays_orders?.change_percent ?? 0}% vs {stats?.todays_orders?.comparison_period || "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">O'rtacha chek</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats?.average_check?.value ?? 0).toLocaleString()} so'm</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.average_check?.change_percent ?? 0}% vs {stats?.average_check?.comparison_period || "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faol xodimlar</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_employees?.value ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.active_employees?.change_absolute ?? 0} vs {stats?.active_employees?.comparison_period || "N/A"}
                  </p>
                </CardContent>
              </Card>

              {/* Sales Chart */}
              <Card className="col-span-full md:col-span-2">
                <CardHeader>
                  <CardTitle>Savdo dinamikasi (Oxirgi 7 kun)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  {validSalesData.length > 0 && isClient ? (
                    <div className="h-[250px] w-full">
                      <Chart
                        options={{
                          chart: { id: "weekly-sales-chart", toolbar: { show: false } },
                          xaxis: { categories: validSalesData.map((day) => new Date(day.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })), labels: { rotate: -45, style: { fontSize: "10px", colors: '#9ca3af' }, offsetY: 5 }, axisBorder: { show: false }, axisTicks: { show: false } },
                          yaxis: { labels: { formatter: (value) => `${(value / 1000).toFixed(0)}k`, style: { colors: '#9ca3af' } } },
                          dataLabels: { enabled: false },
                          stroke: { curve: "smooth", width: 2 },
                          colors: ["#3b82f6"],
                          grid: { borderColor: "#e5e7eb", strokeDashArray: 4, row: { colors: ['transparent', 'transparent'], opacity: 0.5 } },
                          tooltip: { theme: 'light', y: { formatter: (value) => `${value.toLocaleString()} so'm` } },
                          fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3, stops: [0, 90, 100] } },
                        }}
                        series={[{ name: "Savdo", data: validSalesData.map((day) => day.sales) }]}
                        type="area"
                        height={250}
                      />
                    </div>
                  ) : (
                    <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                      Ma'lumotlar yuklanmoqda yoki mavjud emas...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="col-span-full md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-base font-semibold">Eng ko'p sotilgan mahsulotlar</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        {dateRange === "daily" ? "Kunlik" : dateRange === "weekly" ? "Haftalik" : "Oylik"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDateRange("daily")}>Kunlik</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateRange("weekly")}>Haftalik</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateRange("monthly")}>Oylik</DropdownMenuItem> {/* OFltalik -> Oylik ga to'g'irlandi */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[250px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahsulot</TableHead>
                          <TableHead className="text-right">Miqdor</TableHead>
                          <TableHead className="text-right">Savdo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validTopProducts.length > 0 ? validTopProducts.map((product, index) => (<TableRow key={index}><TableCell className="font-medium">{product.product_name || "Noma'lum Mahsulot"}</TableCell><TableCell className="text-right">{product.quantity ?? 0}</TableCell><TableCell className="text-right">{(product.sales ?? 0).toLocaleString()} so'm</TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Bu davr uchun ma'lumot yo'q</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="col-span-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>So'nggi buyurtmalar</CardTitle>
                    <CardDescription>Oxirgi {displayedOrders.length} ta buyurtma ko'rsatilmoqda.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Mijoz</TableHead>
                        <TableHead className="hidden sm:table-cell">Buyurtma turi</TableHead>
                        <TableHead className="text-right">Jami</TableHead>
                        <TableHead className="hidden md:table-cell">Holat</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedOrders.length > 0 ? displayedOrders.map((order) => (<TableRow key={order.id}><TableCell className="font-medium">#{order.id}</TableCell><TableCell>{order.customer_name || "Noma'lum"}</TableCell><TableCell className="hidden sm:table-cell">{order.order_type_display || 'N/A'}</TableCell><TableCell className="text-right">{parseFloat(order.final_price || 0).toLocaleString()} so'm</TableCell><TableCell className="hidden md:table-cell"><Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'outline'}>{order.status_display || 'N/A'}</Badge></TableCell><TableCell className="hidden lg:table-cell text-right">{new Date(order.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Hozircha buyurtmalar mavjud emas</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-center border-t px-6 py-3 dark:border-slate-700">
                  {validRecentOrders.length > 5 && (showAllOrders ? (<Button size="sm" variant="outline" className="w-full" onClick={() => setShowAllOrders(false)}>Kamroq ko'rsatish</Button>) : (<Button size="sm" variant="outline" className="w-full" onClick={() => setShowAllOrders(true)}>Barcha {validRecentOrders.length} buyurtmani ko'rish</Button>))}
                </CardFooter>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* ... (Hisobotlar qismi o'zgarishsiz qoladi) ... */}
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 className="text-2xl font-bold tracking-tight">Hisobotlar</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="sales">Savdo</TabsTrigger>
                  <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
                  <TabsTrigger value="employees">Xodimlar</TabsTrigger>
                  <TabsTrigger value="customers">Mijozlar</TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-4 pt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium">Jami savdo</CardTitle> </CardHeader>
                      <CardContent> <div className="text-2xl font-bold">{(stats?.todays_sales?.value ?? 0).toLocaleString()} so'm</div> </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium">Buyurtmalar soni</CardTitle> </CardHeader>
                      <CardContent> <div className="text-2xl font-bold">{stats?.todays_orders?.value ?? 0}</div> </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium">O'rtacha chek</CardTitle> </CardHeader>
                      <CardContent> <div className="text-2xl font-bold">{(stats?.average_check?.value ?? 0).toLocaleString()} so'm</div> </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium">Faol xodimlar</CardTitle> </CardHeader>
                      <CardContent> <div className="text-2xl font-bold">{stats?.active_employees?.value ?? 0}</div> </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Savdo dinamikasi (Diagramma)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      {validSalesData.length > 0 && isClient ? (
                        <div className="h-[300px]">
                          <Chart
                            options={{
                              chart: { id: "sales-dynamics-bar", toolbar: { show: true, tools: { download: true } } },
                              plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
                              xaxis: { categories: validSalesData.map((day) => new Date(day.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })), labels: { style: { colors: '#9ca3af' } } },
                              yaxis: { title: { text: "Savdo (ming so'm)", style: { color: '#9ca3af' } }, labels: { formatter: (value) => `${(value / 1000).toFixed(0)}k`, style: { colors: '#9ca3af' } } },
                              dataLabels: { enabled: false },
                              colors: ["#3b82f6"],
                              grid: { borderColor: "#e5e7eb", strokeDashArray: 4, row: { colors: ['transparent', 'transparent'], opacity: 0.5 } },
                              tooltip: { theme: 'light', y: { formatter: (value) => `${value.toLocaleString()} so'm` } },
                            }}
                            series={[{ name: "Savdo", data: validSalesData.map((day) => day.sales) }]}
                            type="bar"
                            height={300}
                          />
                        </div>
                      ) : (
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">Ma'lumotlar mavjud emas</div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader> <CardTitle>To'lov usullari</CardTitle> </CardHeader>
                      <CardContent>
                        {validPaymentMethods.length > 0 && isClient ? (
                          <div className="h-[250px]">
                            <Chart
                              options={{
                                chart: { id: "payment-methods-pie", toolbar: { show: false } },
                                labels: validPaymentMethods.map((method) => method.method_display || 'Noma\'lum'),
                                dataLabels: { enabled: true, formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex].toFixed(1) + '%' },
                                colors: ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7"],
                                legend: { position: 'bottom' },
                                tooltip: { y: { formatter: (value) => `${value.toFixed(1)}%` } },
                                stroke: { show: false }
                              }}
                              series={validPaymentMethods.map((method) => method.percentage ?? 0)}
                              type="donut"
                              height={250}
                            />
                          </div>
                        ) : (
                          <div className="flex h-[250px] items-center justify-center text-muted-foreground">Ma'lumotlar mavjud emas</div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader> <CardTitle>Buyurtma turlari</CardTitle> </CardHeader>
                      <CardContent>
                        {validOrderTypes.length > 0 && isClient ? (
                          <div className="h-[250px]">
                            <Chart
                              options={{
                                chart: { id: "order-types-pie", toolbar: { show: false } },
                                labels: validOrderTypes.map((type) => type.type_display || 'Noma\'lum'),
                                dataLabels: { enabled: true, formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex].toFixed(1) + '%' },
                                colors: ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7"],
                                legend: { position: 'bottom' },
                                tooltip: { y: { formatter: (value) => `${value.toFixed(1)}%` } },
                                stroke: { show: false }
                              }}
                              series={validOrderTypes.map((type) => type.percentage ?? 0)}
                              type="donut"
                              height={250}
                            />
                          </div>
                        ) : (
                          <div className="flex h-[250px] items-center justify-center text-muted-foreground">Ma'lumotlar mavjud emas</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="products" className="space-y-4 pt-6">
                  <Card>
                    <CardHeader> <CardTitle>Mahsulotlar bo'yicha hisobot</CardTitle> </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mahsulot</TableHead>
                            <TableHead className="text-right">Sotilgan Miqdor</TableHead>
                            <TableHead className="text-right">Jami Savdo</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Taxminiy Foyda</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validProducts.length > 0 ? validProducts.map((product, index) => (<TableRow key={index}><TableCell className="font-medium">{product.product_name || "Noma'lum Mahsulot"}</TableCell><TableCell className="text-right">{product.sold_quantity ?? 0}</TableCell><TableCell className="text-right">{(product.sales_revenue ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right hidden sm:table-cell">{(product.profit ?? 0).toLocaleString()} so'm</TableCell></TableRow>)) : <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Hozircha mahsulotlar hisoboti mavjud emas</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="employees" className="space-y-4 pt-6">
                  <Card>
                    <CardHeader> <CardTitle>Xodimlar bo'yicha hisobot</CardTitle> </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Xodim</TableHead>
                            <TableHead className="hidden sm:table-cell">Lavozim</TableHead>
                            <TableHead className="text-right">Buyurtmalar</TableHead>
                            <TableHead className="text-right">Savdo</TableHead>
                            <TableHead className="text-right hidden md:table-cell">O'rtacha chek</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validEmployeeReport.length > 0 ? validEmployeeReport.map((employee, index) => (<TableRow key={index}><TableCell className="font-medium">{employee.employee_name || "Noma'lum Xodim"}</TableCell><TableCell className="hidden sm:table-cell">{employee.role_name || "Noma'lum"}</TableCell><TableCell className="text-right">{employee.orders_count ?? 0}</TableCell><TableCell className="text-right">{(employee.total_sales ?? 0).toLocaleString()} so'm</TableCell><TableCell className="text-right hidden md:table-cell">{Math.round(employee.average_check ?? 0).toLocaleString()} so'm</TableCell></TableRow>)) : <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Hozircha xodimlar hisoboti mavjud emas</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="customers" className="space-y-4 pt-6">
                  <Card>
                    <CardHeader> <CardTitle>Mijozlar bo'yicha hisobot</CardTitle> </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mijoz turi</TableHead>
                            <TableHead className="text-right">Buyurtmalar</TableHead>
                            <TableHead className="text-right">Savdo</TableHead>
                            <TableHead className="text-right">O'rtacha chek</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Doimiy mijozlar</TableCell>
                            <TableCell className="text-right">{customerReport?.regular_customers?.orders_count ?? 0}</TableCell>
                            <TableCell className="text-right">{(customerReport?.regular_customers?.total_sales ?? 0).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-right">{Math.round(customerReport?.regular_customers?.average_check ?? 0).toLocaleString()} so'm</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Yangi mijozlar</TableCell>
                            <TableCell className="text-right">{customerReport?.new_customers?.orders_count ?? 0}</TableCell>
                            <TableCell className="text-right">{(customerReport?.new_customers?.total_sales ?? 0).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-right">{Math.round(customerReport?.new_customers?.average_check ?? 0).toLocaleString()} so'm</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Bir martalik mijozlar</TableCell>
                            <TableCell className="text-right">{customerReport?.one_time_customers?.orders_count ?? 0}</TableCell>
                            <TableCell className="text-right">{(customerReport?.one_time_customers?.total_sales ?? 0).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-right">{Math.round(customerReport?.one_time_customers?.average_check ?? 0).toLocaleString()} so'm</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === "employees" && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 className="text-2xl font-bold tracking-tight">Xodimlar</h2>
                <Button onClick={() => setShowAddEmployeeDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi xodim qo'shish
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Xodim</TableHead>
                        <TableHead className="hidden sm:table-cell">Lavozim</TableHead>
                        <TableHead className="hidden md:table-cell">Username</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validXodim.length > 0 ? validXodim.map((employee) => (<TableRow key={employee.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={employee.image || "/placeholder-user.jpg"} alt={`${employee.first_name} ${employee.last_name}`} /><AvatarFallback>{`${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`.toUpperCase()}</AvatarFallback></Avatar><div><p className="font-medium">{employee.first_name} {employee.last_name}</p></div></div></TableCell><TableCell className="hidden sm:table-cell">{employee.role?.name || "Noma'lum"}</TableCell><TableCell className="hidden md:table-cell">{employee.username}</TableCell><TableCell><Badge variant={employee.is_active ? "success" : "secondary"}>{employee.is_active ? "Faol" : "Faol emas"}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /><span className="sr-only">Amallar</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled>Tahrirlash</DropdownMenuItem><DropdownMenuItem disabled>PIN-kodni o'zgartirish</DropdownMenuItem><DropdownMenuItem disabled>Holatni o'zgartirish</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => handleDeleteEmployee(employee.id)}>O'chirish</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)) : <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Xodimlar topilmadi.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 className="text-2xl font-bold tracking-tight">Rollar va Huquqlar</h2>
                <Button onClick={() => setShowAddRoleDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi rol qo'shish
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rol nomi</TableHead>
                        <TableHead>Huquqlar</TableHead>
                        <TableHead className="hidden sm:table-cell text-right">Xodimlar soni</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validFetchedRoles.length > 0 ? (
                        validFetchedRoles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(role.permissions) ? role.permissions : []).map((permission) => (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-right">
                              {role.employee_count ?? role.count ?? 0}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ChevronDown className="h-4 w-4" />
                                    <span className="sr-only">Amallar</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem disabled>Tahrirlash</DropdownMenuItem>
                                  <DropdownMenuItem disabled>Huquqlarni o'zgartirish</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400"
                                    onClick={() => handleDeleteRole(role.id)}
                                  >
                                    O'chirish
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Rollar topilmadi.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* ... (Buyurtmalar qismi o'zgarishsiz qoladi) ... */}
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 className="text-2xl font-bold tracking-tight">Barcha Buyurtmalar</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled> <Download className="mr-2 h-4 w-4" /> Export </Button>
                </div>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Mijoz</TableHead>
                        <TableHead className="hidden sm:table-cell">Turi</TableHead>
                        <TableHead className="text-right">Jami</TableHead>
                        <TableHead className="hidden md:table-cell">Holat</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Sana</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validOrders.length > 0 ? validOrders.map((order) => (<TableRow key={order.id}><TableCell className="font-medium">#{order.id}</TableCell><TableCell>{order.customer_name || "Noma'lum"}</TableCell><TableCell className="hidden sm:table-cell">{order.order_type_display || 'N/A'}</TableCell><TableCell className="text-right">{parseFloat(order.final_price || 0).toLocaleString()} so'm</TableCell><TableCell className="hidden md:table-cell"><Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'outline'}>{order.status_display || 'N/A'}</Badge></TableCell><TableCell className="hidden lg:table-cell text-right">{new Date(order.created_at).toLocaleString('uz-UZ')}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ChevronDown className="h-4 w-4" /><span className="sr-only">Amallar</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled>Batafsil</DropdownMenuItem><DropdownMenuItem disabled>Chek chiqarish</DropdownMenuItem>{order.status !== 'completed' && order.status !== 'cancelled' && (<><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => handleCancelOrder(order.id)}>Bekor qilish</DropdownMenuItem></>)}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Buyurtmalar topilmadi.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* ... (Sozlamalar qismi o'zgarishsiz qoladi) ... */}
              <h2 className="text-2xl font-bold tracking-tight">Sozlamalar</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Restoran ma'lumotlari</CardTitle>
                  <CardDescription>Restoran haqidagi asosiy ma'lumotlarni tahrirlash.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="restaurant-name">Restoran nomi</Label>
                      <Input id="restaurant-name" defaultValue="SmartResto" disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="restaurant-phone">Telefon raqami</Label>
                      <Input id="restaurant-phone" defaultValue="+998 71 123 45 67" disabled />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="restaurant-address">Manzil</Label>
                      <Input id="restaurant-address" defaultValue="Toshkent sh., Chilonzor tumani" disabled />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="restaurant-email">Email</Label>
                      <Input id="restaurant-email" defaultValue="info@smartresto.uz" type="email" disabled />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="restaurant-description">Tavsif</Label>
                      <Input id="restaurant-description" defaultValue="Milliy va zamonaviy taomlar restorani" disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button disabled>Saqlash</Button>
                  <p className="text-xs text-muted-foreground ml-4">Bu ma'lumotlarni o'zgartirish uchun dasturchiga murojaat qiling.</p>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tizim sozlamalari</CardTitle>
                  <CardDescription>Asosiy tizim parametrlarini sozlash.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="currency">Valyuta</Label>
                      <Select defaultValue="uzs" disabled>
                        <SelectTrigger id="currency"> <SelectValue /> </SelectTrigger>
                        <SelectContent> <SelectItem value="uzs">So'm (UZS)</SelectItem> </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="language">Til</Label>
                      <Select defaultValue="uz" disabled>
                        <SelectTrigger id="language"> <SelectValue /> </SelectTrigger>
                        <SelectContent> <SelectItem value="uz">O'zbek</SelectItem> </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tax-rate">Soliq stavkasi (%)</Label>
                      <Input id="tax-rate" type="number" defaultValue="12" disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="service-fee">Xizmat haqi (%)</Label>
                      <Input id="service-fee" type="number" defaultValue="10" disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button disabled>Saqlash</Button>
                  <p className="text-xs text-muted-foreground ml-4">Bu sozlamalar hozircha o'zgartirilmaydi.</p>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
        {/* ... (Xodim qo'shish dialogi o'zgarishsiz qoladi) ... */}
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Yangi xodim qo'shish</DialogTitle>
            <DialogDescription>
              Xodim ma'lumotlarini kiriting. Saqlaganingizdan so'ng tizimga kirishi mumkin bo'ladi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {dialogError && <div className="rounded border border-red-300 bg-red-100 p-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{dialogError}</div>}
            {dialogSuccess && <div className="rounded border border-green-300 bg-green-100 p-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">{dialogSuccess}</div>}
            <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="username" className="text-right text-sm">Username</Label>
              <Input id="username" className="col-span-3 h-9" value={newEmployee.username} onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })} required />
              <Label htmlFor="first_name" className="text-right text-sm">Ism</Label>
              <Input id="first_name" className="col-span-3 h-9" value={newEmployee.first_name} onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })} required />
              <Label htmlFor="last_name" className="text-right text-sm">Familiya</Label>
              <Input id="last_name" className="col-span-3 h-9" value={newEmployee.last_name} onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })} required />
              <Label htmlFor="role" className="text-right text-sm">Lavozim</Label>
              <Select value={newEmployee.role_id} onValueChange={(value) => setNewEmployee({ ...newEmployee, role_id: value })} required>
                <SelectTrigger id="role" className="col-span-3 h-9"> <SelectValue placeholder="Lavozimni tanlang" /> </SelectTrigger>
                <SelectContent>
                  {validRolesList.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}> {role.name} </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="pin" className="text-right text-sm">PIN-kod</Label>
              <Input id="pin" type="password" placeholder="4 raqamli PIN" className="col-span-3 h-9" value={newEmployee.pin_code} onChange={(e) => setNewEmployee({ ...newEmployee, pin_code: e.target.value.replace(/\D/g, '').slice(0, 4) })} maxLength={4} required />
              <Label htmlFor="status" className="text-right text-sm">Holat</Label>
              <Select value={newEmployee.is_active ? "active" : "inactive"} onValueChange={(value) => setNewEmployee({ ...newEmployee, is_active: value === "active" })}>
                <SelectTrigger id="status" className="col-span-3 h-9"> <SelectValue /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Faol emas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowAddEmployeeDialog(false); setDialogError(''); setDialogSuccess(''); setNewEmployee({ username: "", first_name: "", last_name: "", role_id: "", pin_code: "", is_active: true }); }}>
              Bekor qilish
            </Button>
            <Button type="button" onClick={handleAddEmployee}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        {/* ... (Rol qo'shish dialogi o'zgarishsiz qoladi) ... */}
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Yangi rol qo'shish</DialogTitle>
            <DialogDescription>
              Yangi rol nomini kiriting. Saqlaganingizdan so'ng tizimda yangi rol paydo bo'ladi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {dialogError && <div className="rounded border border-red-300 bg-red-100 p-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{dialogError}</div>}
            {dialogSuccess && <div className="rounded border border-green-300 bg-green-100 p-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">{dialogSuccess}</div>}
            <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="role_name" className="text-right text-sm">Rol nomi</Label>
              <Input id="role_name" className="col-span-3 h-9" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowAddRoleDialog(false); setDialogError(''); setDialogSuccess(''); setNewRole({ name: "" }); }}>
              Bekor qilish
            </Button>
            <Button type="button" onClick={handleAddRole}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}