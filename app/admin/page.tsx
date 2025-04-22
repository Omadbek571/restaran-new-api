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
  Loader2,
  Paperclip,
  Printer,
  Package,
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
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import axios from "axios"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ApexCharts ni faqat client-side da yuklash
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

// Helper funksiya: Token mavjudligini tekshirish va header olish
const getAuthHeader = (currentRouter) => {
  const currentToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null
  if (!currentToken) {
    console.warn("Token topilmadi. Avtorizatsiya headeri bo'sh bo'ladi.")
    if (!toast.isActive('no-token-error')) {
      toast.error("Avtorizatsiya tokeni topilmadi. Iltimos, qayta kiring.", { toastId: 'no-token-error' })
    }
    if (currentRouter && typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      currentRouter.push("/auth")
    }
    return null
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${currentToken}`,
  }
}

// Chek chiqarish funksiyasi
const printReceipt = (orderDetails) => {
  if (!orderDetails) {
    toast.error("Chek ma'lumotlari topilmadi!")
    return
  }

  const totalItemsPrice = orderDetails.items?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) ?? 0
  const serviceFeeAmount = totalItemsPrice * (parseFloat(orderDetails.service_fee_percent || 0) / 100)
  const finalPrice = parseFloat(orderDetails.final_price || 0)

  const receiptHTML = `
    <html>
      <head>
        <title>Chek #${orderDetails.id}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 0.5cm; }
          }
          body {
            font-family: 'Arial', sans-serif;
            margin: 10px;
            font-size: 10pt;
            width: 72mm;
            color: #000;
          }
          .receipt { width: 100%; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
          .header h1 { margin: 0 0 5px 0; font-size: 14pt; }
          .header p { margin: 2px 0; }
          .details { margin-bottom: 10px; }
          .details p { margin: 3px 0; line-height: 1.3; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { padding: 3px 1px; text-align: left; vertical-align: top; }
          th { border-bottom: 1px solid #000; font-weight: bold;}
          td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
          .total { border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; }
          .total p { margin: 4px 0; display: flex; justify-content: space-between; }
          .total p span:first-child { text-align: left; padding-right: 10px; }
          .total p span:last-child { text-align: right; font-weight: bold; }
          .total p.final-price span:last-child { font-size: 11pt; }
          .footer { text-align: center; margin-top: 15px; font-size: 9pt; border-top: 1px dashed #000; padding-top: 5px;}
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>SmartResto</h1>
            <p>Chek #${orderDetails.id}</p>
          </div>
          <div class="details">
            <p>Sana: ${new Date(orderDetails.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>Mijoz: ${orderDetails.customer_name || 'Noma\'lum'}</p>
            <p>Xodim: ${orderDetails.created_by?.first_name || ''} ${orderDetails.created_by?.last_name || 'N/A'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Miq.</th>
                <th>Narx</th>
                <th>Jami</th>
              </tr>
            </thead>
            <tbody>
              ${(Array.isArray(orderDetails.items) ? orderDetails.items : []).map(item => `
                <tr>
                  <td>${item.product_details?.name || 'Noma\'lum'}</td>
                  <td>${item.quantity}</td>
                  <td>${parseFloat(item.unit_price || 0).toLocaleString()}</td>
                  <td>${parseFloat(item.total_price || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p><span>Jami (Mahs.):</span> <span>${totalItemsPrice.toLocaleString()} so'm</span></p>
            ${serviceFeeAmount > 0 ? `<p><span>Xizmat haqi (${orderDetails.service_fee_percent || 0}%):</span> <span>+ ${serviceFeeAmount.toLocaleString()} so'm</span></p>` : ''}
            <p class="final-price"><span>Jami:</span> <span>${finalPrice.toLocaleString()} so'm</span></p>
          </div>
          <div class="footer">
            <p>Xaridingiz uchun rahmat!</p>
          </div>
        </div>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=300,height=600')
  if (printWindow) {
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    printWindow.focus()
  } else {
    toast.error("Chop etish oynasini ochib bo'lmadi. Brauzer bloklagan bo'lishi mumkin.")
  }
}

// Asosiy Komponent
export default function AdminDashboard() {
  const router = useRouter()

  // State Management
  const [token, setToken] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [dateRange, setDateRange] = useState("weekly")
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [isDeleteRoleConfirmOpen, setIsDeleteRoleConfirmOpen] = useState(false)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false) // Yangi state
  const [stats, setStats] = useState({
    todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" },
    todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" },
    average_check: { value: 0, change_percent: 0, comparison_period: "N/A" },
    active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" },
  })
  const [salesData, setSalesData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [xodim, setXodim] = useState([])
  const [fetchedRoles, setFetchedRoles] = useState([])
  const [rolesList, setRolesList] = useState([])
  const [employeeReport, setEmployeeReport] = useState([])
  const [products, setProducts] = useState([]) // Mahsulotlar ro'yxati uchun
  const [categories, setCategories] = useState([]) // Kategoriyalar uchun yangi state
  const [customerReport, setCustomerReport] = useState({
    regular_customers: { orders_count: 0, totalSales: 0, average_check: 0 },
    new_customers: { orders_count: 0, totalSales: 0, average_check: 0 },
    one_time_customers: { orders_count: 0, totalSales: 0, average_check: 0 },
  })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [orderTypes, setOrderTypes] = useState([])
  const [newEmployee, setNewEmployee] = useState({
    username: "", first_name: "", last_name: "", role_id: "", pin_code: "", is_active: true,
  })
  const [newRole, setNewRole] = useState({ name: "" })
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    is_active: true,
    category_id: "", // Kategoriya IDsi
    cost_price: "", // Tannarx
    image: null, // Rasm fayli
  })
  const [roleToDelete, setRoleToDelete] = useState(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false)
  const [orderDetailsError, setOrderDetailsError] = useState(null)

  // Tizimdan chiqish
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
    }
    setToken(null)
    toast.info("Tizimdan chiqdingiz.")
    router.push("/auth")
  }

  // API xatoliklarini qayta ishlash
  const handleApiError = (error, contextMessage) => {
    console.error(`${contextMessage} xatolik:`, error)
    let errorDetail = `${contextMessage} xatolik yuz berdi.`
    let shouldLogout = false

    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        errorDetail = "Sessiya muddati tugagan yoki ruxsat yo'q. Iltimos, qayta kiring."
        shouldLogout = true
      } else {
        const data = error.response.data
        if (data && typeof data === 'object') {
          if (data.detail) {
            errorDetail = data.detail
          } else if (Array.isArray(data)) {
            errorDetail = data.map(err => `${err.field || 'Xato'}: ${err.message || JSON.stringify(err)}`).join('; ')
          } else {
            errorDetail = Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ')
          }
        } else if (typeof data === 'string') {
          errorDetail = data
        } else {
          errorDetail = `Serverdan kutilmagan javob (status: ${error.response.status}).`
        }
        if (!shouldLogout) {
          errorDetail = `${contextMessage} xatolik: ${errorDetail}`
        }
      }
    } else if (error.request) {
      errorDetail = `${contextMessage}: Serverdan javob olinmadi. Internet aloqasini tekshiring.`
    } else {
      errorDetail = `${contextMessage} xatolik: ${error.message}`
    }

    const toastId = contextMessage.replace(/\s+/g, '-')
    if (!toast.isActive(toastId)) {
      toast.error(errorDetail, { toastId: toastId })
    }

    if (shouldLogout) {
      handleLogout()
    }
  }

  // useEffect Hooks
  useEffect(() => {
    setIsClient(true)
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null
    if (!storedToken) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        router.push("/auth")
      }
    } else {
      setToken(storedToken)
    }
  }, [router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/orders/`, { headers })
        .then((res) => {
          const data = res.data ?? []
          const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          setRecentOrders(sortedData.slice(0, 5))
          setOrders(sortedData)
        })
        .catch((err) => { handleApiError(err, "Buyurtmalarni yuklashda"); setRecentOrders([]); setOrders([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/stats/`, { headers })
        .then((res) => {
          const defaultStats = {
            todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" },
            todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" },
            average_check: { value: 0, change_percent: 0, comparison_period: "N/A" },
            active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" },
          }
          const receivedStats = res.data || {}
          setStats({
            todays_sales: receivedStats.todays_sales ?? defaultStats.todays_sales,
            todays_orders: receivedStats.todays_orders ?? defaultStats.todays_orders,
            average_check: receivedStats.average_check ?? defaultStats.average_check,
            active_employees: receivedStats.active_employees ?? defaultStats.active_employees,
          })
        })
        .catch((err) => {
          handleApiError(err, "Statistikani yuklashda")
          setStats({
            todays_sales: { value: 0, change_percent: 0, comparison_period: "N/A" },
            todays_orders: { value: 0, change_percent: 0, comparison_period: "N/A" },
            average_check: { value: 0, change_percent: 0, comparison_period: "N/A" },
            active_employees: { value: 0, change_absolute: 0, comparison_period: "N/A" },
          })
        })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, { headers })
        .then((res) => { setXodim(res.data ?? []) })
        .catch((err) => { handleApiError(err, "Xodimlarni yuklashda"); setXodim([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, { headers })
        .then((res) => {
          const rolesData = res.data ?? []
          setRolesList(rolesData)
          setFetchedRoles(rolesData)
        })
        .catch((err) => { handleApiError(err, "Rollar ro'yxatini yuklashda"); setRolesList([]); setFetchedRoles([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/employees/`, { headers })
        .then((res) => { setEmployeeReport(res.data ?? []) })
        .catch((err) => { handleApiError(err, "Xodimlar hisobotini yuklashda"); setEmployeeReport([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/products/`, { headers })
        .then((res) => { setProducts(res.data ?? []) })
        .catch((err) => { handleApiError(err, "Mahsulotlar hisobotini yuklashda"); setProducts([]) })
    }
  }, [token, isClient, router])

  // Yangi useEffect mahsulotlar ro'yxatini olish uchun
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/products/`, { headers })
        .then((res) => { setProducts(res.data ?? []) })
        .catch((err) => { handleApiError(err, "Mahsulotlarni yuklashda"); setProducts([]) })
    }
  }, [token, isClient, router])

  // Kategoriyalarni olish uchun useEffect
  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/categories/`, { headers })
        .then((res) => { setCategories(res.data ?? []) })
        .catch((err) => { handleApiError(err, "Kategoriyalarni yuklashda"); setCategories([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/customers/`, { headers })
        .then((res) => {
          const defaultReport = {
            regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            new_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
          }
          const receivedReport = res.data || {}
          setCustomerReport({
            regular_customers: receivedReport.regular_customers ?? defaultReport.regular_customers,
            new_customers: receivedReport.new_customers ?? defaultReport.new_customers,
            one_time_customers: receivedReport.one_time_customers ?? defaultReport.one_time_customers,
          })
        })
        .catch((err) => {
          handleApiError(err, "Mijozlar hisobotini yuklashda")
          setCustomerReport({
            regular_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            new_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
            one_time_customers: { orders_count: 0, total_sales: 0, average_check: 0 },
          })
        })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/reports/charts/`, { headers })
        .then((res) => {
          setPaymentMethods(res.data?.payment_methods || [])
          setOrderTypes(res.data?.order_types || [])
        })
        .catch((err) => { handleApiError(err, "Diagrammalar ma'lumotlarini yuklashda"); setPaymentMethods([]); setOrderTypes([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/sales-chart/`, { headers })
        .then((res) => { setSalesData(res.data ?? []) })
        .catch((err) => { handleApiError(err, "Savdo grafigini yuklashda"); setSalesData([]) })
    }
  }, [token, isClient, router])

  useEffect(() => {
    if (token && isClient) {
      const headers = getAuthHeader(router)
      if (!headers) return
      const source = axios.CancelToken.source()
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/dashboard/top-products/?period=${dateRange}`, {
        headers,
        cancelToken: source.token
      })
        .then((res) => { setTopProducts(res.data ?? []) })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            handleApiError(err, "Eng ko'p sotilgan mahsulotlarni yuklashda")
            setTopProducts([])
          }
        })
      return () => {
        source.cancel("So'rov bekor qilindi: Komponent unmount yoki dependency o'zgarishi.")
      }
    }
  }, [dateRange, token, isClient, router])

  // Ma'lumotlarni yangilash
  const refreshOrders = () => {
    const headers = getAuthHeader(router)
    if (!headers) return
    toast.promise(
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/orders/`, { headers })
        .then((res) => {
          const data = res.data ?? []
          const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          setRecentOrders(sortedData.slice(0, 5))
          setOrders(sortedData)
        }),
      {
        pending: 'Buyurtmalar yangilanmoqda...',
        success: 'Buyurtmalar muvaffaqiyatli yangilandi!',
        error: 'Buyurtmalarni yangilashda xatolik!'
      }
    ).catch(err => handleApiError(err, "Buyurtmalarni yangilashda"))
  }

  const refreshEmployees = () => {
    const headers = getAuthHeader(router)
    if (!headers) return
    toast.promise(
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/users/`, { headers })
        .then((res) => { setXodim(res.data ?? []) }),
      { pending: 'Xodimlar yangilanmoqda...', success: 'Xodimlar ro\'yxati yangilandi!', error: 'Xodimlarni yangilashda xatolik!' }
    ).catch(err => handleApiError(err, "Xodimlarni yangilashda"))
  }

  const refreshRoles = () => {
    const headers = getAuthHeader(router)
    if (!headers) return
    toast.promise(
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/admin/roles/`, { headers })
        .then((res) => {
          const rolesData = res.data ?? []
          setRolesList(rolesData)
          setFetchedRoles(rolesData)
        }),
      { pending: 'Rollar yangilanmoqda...', success: 'Rollar ro\'yxati yangilandi!', error: 'Rollarni yangilashda xatolik!' }
    ).catch(err => {
      handleApiError(err, "Rollarni yangilashda")
      setRolesList([])
      setFetchedRoles([])
    })
  }

  // Yangi mahsulotlarni yangilash funksiyasi
  const refreshProducts = () => {
    const headers = getAuthHeader(router)
    if (!headers) return
    toast.promise(
      axios.get(`https://oshxonacopy.pythonanywhere.com/api/products/`, { headers })
        .then((res) => { setProducts(res.data ?? []) }),
      { pending: 'Mahsulotlar yangilanmoqda...', success: 'Mahsulotlar ro\'yxati yangilandi!', error: 'Mahsulotlarni yangilashda xatolik!' }
    ).catch(err => handleApiError(err, "Mahsulotlarni yangilashda"))
  }

  // Handler funksiyalar
  const handleCancelOrder = async (orderId) => {
    if (!confirm(`Haqiqatan ham #${orderId} raqamli buyurtmani bekor qilmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) {
      return
    }
    const headers = getAuthHeader(router)
    if (!headers) return
    try {
      const response = await axios.post(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/cancel_order/`,
        {},
        { headers }
      )
      if (response.status === 200 || response.status === 204) {
        toast.success(`Buyurtma #${orderId} muvaffaqiyatli bekor qilindi!`)
        refreshOrders()
      } else {
        toast.warning(`Buyurtmani bekor qilishda kutilmagan javob: ${response.status}`)
      }
    } catch (err) {
      handleApiError(err, `Buyurtma #${orderId} ni bekor qilishda`)
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployee.username || !newEmployee.first_name || !newEmployee.last_name || !newEmployee.role_id || !newEmployee.pin_code) {
      toast.error("Iltimos, barcha yulduzchali (*) maydonlarni to'ldiring.")
      return
    }
    if (!/^\d{4}$/.test(newEmployee.pin_code)) {
      toast.error("PIN-kod 4 ta raqamdan iborat bo'lishi kerak.")
      return
    }
    const headers = getAuthHeader(router)
    if (!headers) return
    try {
      await axios.post(
        "https://oshxonacopy.pythonanywhere.com/api/admin/users/",
        {
          username: newEmployee.username.trim(),
          first_name: newEmployee.first_name.trim(),
          last_name: newEmployee.last_name.trim(),
          role_id: parseInt(newEmployee.role_id),
          pin_code: newEmployee.pin_code,
          is_active: newEmployee.is_active,
        },
        { headers }
      )
      toast.success(`Xodim "${newEmployee.first_name}" muvaffaqiyatli qo'shildi!`)
      setNewEmployee({ username: "", first_name: "", last_name: "", role_id: "", pin_code: "", is_active: true })
      setShowAddEmployeeDialog(false)
      refreshEmployees()
    } catch (err) {
      handleApiError(err, "Xodim qo'shishda")
    }
  }

  const handleAddRole = async () => {
    if (!newRole.name || newRole.name.trim() === "") {
      toast.error("Iltimos, rol nomini kiriting.")
      return
    }
    const headers = getAuthHeader(router)
    if (!headers) return
    try {
      await axios.post(
        "https://oshxonacopy.pythonanywhere.com/api/admin/roles/",
        { name: newRole.name.trim() },
        { headers }
      )
      toast.success(`Rol "${newRole.name.trim()}" muvaffaqiyatli qo'shildi!`)
      setNewRole({ name: "" })
      setShowAddRoleDialog(false)
      refreshRoles()
    } catch (err) {
      handleApiError(err, "Rol qo'shishda")
    }
  }

  // Yangi mahsulot qo'shish funksiyasi
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
      toast.error("Iltimos, mahsulot nomi, narxi va kategoriyasini kiriting.")
      return
    }
    if (isNaN(newProduct.price) || parseFloat(newProduct.price) <= 0) {
      toast.error("Narx musbat raqam bo'lishi kerak.")
      return
    }
    const headers = getAuthHeader(router)
    if (!headers) return

    const formData = new FormData()
    formData.append("name", newProduct.name.trim())
    formData.append("price", parseFloat(newProduct.price))
    formData.append("category_id", newProduct.category_id)
    if (newProduct.description) {
      formData.append("description", newProduct.description.trim())
    }
    if (newProduct.cost_price) {
      formData.append("cost_price", parseFloat(newProduct.cost_price))
    }
    if (newProduct.image) {
      formData.append("image", newProduct.image)
    }
    formData.append("is_active", newProduct.is_active ? "true" : "false")

    try {
      await axios.post(
        "https://oshxonacopy.pythonanywhere.com/api/products/",
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      )
      toast.success(`Mahsulot "${newProduct.name.trim()}" muvaffaqiyatli qo'shildi!`)
      setNewProduct({
        name: "",
        price: "",
        description: "",
        is_active: true,
        category_id: "",
        cost_price: "",
        image: null,
      })
      setShowAddProductDialog(false)
      refreshProducts()
    } catch (err) {
      handleApiError(err, "Mahsulot qo'shishda")
    }
  }

  const handleDeleteEmployee = async (employee) => {
    if (!confirm(`Haqiqatan ham "${employee.first_name} ${employee.last_name}" (ID: ${employee.id}) xodimni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) return
    const headers = getAuthHeader(router)
    if (!headers) return
    try {
      const response = await axios.delete(`https://oshxonacopy.pythonanywhere.com/api/admin/users/${employee.id}/`, { headers })
      if (response.status === 204) {
        toast.success(`Xodim "${employee.first_name}" muvaffaqiyatli o'chirildi!`)
        refreshEmployees()
      } else {
        toast.warning(`Xodimni o'chirishda kutilmagan javob: ${response.status}`)
      }
    } catch (err) {
      handleApiError(err, `Xodim (ID: ${employee.id}) ni o'chirishda`)
    }
  }

  // Mahsulot o'chirish funksiyasi
  const handleDeleteProduct = async (product) => {
    if (!confirm(`Haqiqatan ham "${product.name}" (ID: ${product.id}) mahsulotni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) return
    const headers = getAuthHeader(router)
    if (!headers) return
    try {
      const response = await axios.delete(`https://oshxonacopy.pythonanywhere.com/api/products/${product.id}/`, { headers })
      if (response.status === 204) {
        toast.success(`Mahsulot "${product.name}" muvaffaqiyatli o'chirildi!`)
        refreshProducts()
      } else {
        toast.warning(`Mahsulotni o'chirishda kutilmagan javob: ${response.status}`)
      }
    } catch (err) {
      handleApiError(err, `Mahsulot (ID: ${product.id}) ni o'chirishda`)
    }
  }

  const handleDeleteRole = (role) => {
    setRoleToDelete({
      id: role.id,
      name: role.name,
      employee_count: role.employee_count ?? role.count ?? 0
    })
    setIsDeleteRoleConfirmOpen(true)
  }

  const confirmDeleteRole = async () => {
    if (!roleToDelete || !roleToDelete.id) return
    const headers = getAuthHeader(router)
    if (!headers) return
    try {
      const response = await axios.delete(
        `https://oshxonacopy.pythonanywhere.com/api/admin/roles/${roleToDelete.id}/`,
        { headers }
      )
      if (response.status === 204) {
        toast.success(`Rol "${roleToDelete.name}" muvaffaqiyatli o'chirildi!`)
        refreshRoles()
      } else {
        toast.warning(`Rolni o'chirishda kutilmagan javob: ${response.status}`)
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail?.toLowerCase().includes("cannot delete role with assigned users")) {
        toast.error(`"${roleToDelete.name}" rolini o'chirib bo'lmaydi, chunki unga ${roleToDelete.employee_count} ta xodim biriktirilgan.`)
      } else {
        handleApiError(err, `"${roleToDelete.name}" rolini o'chirishda`)
      }
    } finally {
      setIsDeleteRoleConfirmOpen(false)
      setRoleToDelete(null)
    }
  }

  const handleShowOrderDetails = async (orderId) => {
    if (!orderId) {
      console.error("Buyurtma ID si topilmadi!")
      toast.error("Buyurtma ID si topilmadi!", { toastId: "order-id-missing" })
      return
    }
    const headers = getAuthHeader(router)
    if (!headers) return

    setShowOrderDetailsModal(true)
    setIsLoadingOrderDetails(true)
    setSelectedOrderDetails(null)
    setOrderDetailsError(null)

    try {
      const response = await axios.get(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/`,
        { headers }
      )
      setSelectedOrderDetails(response.data)
      setOrderDetailsError(null)
    } catch (err) {
      handleApiError(err, `Buyurtma #${orderId} tafsilotlarini olishda`)
      setOrderDetailsError(`Tafsilotlarni yuklashda xatolik yuz berdi. Qaytadan urinib ko'ring.`)
      setSelectedOrderDetails(null)
    } finally {
      setIsLoadingOrderDetails(false)
    }
  }

  const handleModalClose = () => {
    setShowOrderDetailsModal(false)
    setTimeout(() => {
      setSelectedOrderDetails(null)
      setIsLoadingOrderDetails(false)
      setOrderDetailsError(null)
    }, 300)
  }

  // Rendering Logic
  const displayedOrders = showAllOrders ? orders : recentOrders
  const safeArray = (data) => (Array.isArray(data) ? data : [])
  const validSalesData = safeArray(salesData)
  const validPaymentMethods = safeArray(paymentMethods)
  const validOrderTypes = safeArray(orderTypes)
  const validFetchedRoles = safeArray(fetchedRoles)
  const validXodim = safeArray(xodim)
  const validOrders = safeArray(orders)
  const validDisplayedOrders = safeArray(displayedOrders)
  const validEmployeeReport = safeArray(employeeReport)
  const validProducts = safeArray(products)
  const validRolesList = safeArray(rolesList)
  const validTopProducts = safeArray(topProducts)

  if (!isClient || !token) {
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      return null
    }
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950">
      <ToastContainer
        position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop={false}
        closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored"
      />
      <div className="hidden w-64 flex-col bg-slate-900 text-white md:flex dark:bg-slate-800">
        <div className="flex h-14 items-center border-b border-slate-700 px-4 dark:border-slate-600">
          <Store className="mr-2 h-6 w-6 text-sky-400" />
          <h1 className="text-lg font-bold">SmartResto Admin</h1>
        </div>
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4">
            <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Asosiy</h2>
            <div className="space-y-1">
              <Button variant={activeTab === "dashboard" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'dashboard' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("dashboard")}><BarChart3 className="mr-2 h-4 w-4" />Boshqaruv paneli</Button>
              <Button variant={activeTab === "reports" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'reports' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("reports")}><FileText className="mr-2 h-4 w-4" />Hisobotlar</Button>
              <Button variant={activeTab === "employees" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'employees' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("employees")}><Users className="mr-2 h-4 w-4" />Xodimlar</Button>
              <Button variant={activeTab === "roles" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'roles' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("roles")}><Sliders className="mr-2 h-4 w-4" />Rollar</Button>
              <Button variant={activeTab === "orders" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'orders' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("orders")}><ShoppingCart className="mr-2 h-4 w-4" />Buyurtmalar</Button>
              <Button variant={activeTab === "products" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'products' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("products")}><Package className="mr-2 h-4 w-4" />Mahsulotlar</Button>
            </div>
            <h2 className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tizim</h2>
            <div className="space-y-1">
              <Button variant={activeTab === "settings" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'settings' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => setActiveTab("settings")}><Settings className="mr-2 h-4 w-4" />Sozlamalar</Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 dark:hover:bg-slate-700" onClick={() => router.push("/pos")}><Home className="mr-2 h-4 w-4" />POS ga qaytish</Button>
              <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-900/30 hover:text-red-400" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Chiqish</Button>
            </div>
          </nav>
        </ScrollArea>
        <div className="border-t border-slate-700 p-4 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarImage src="/placeholder-user.jpg" /><AvatarFallback>AD</AvatarFallback></Avatar>
            <div><p className="text-sm font-medium">Admin User</p><p className="text-xs text-slate-400 dark:text-slate-500">Administrator</p></div>
          </div>
        </div>
      </div>
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMobileSidebar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="fixed left-0 top-0 h-full w-64 flex-col bg-slate-900 text-white dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex h-14 items-center justify-between border-b border-slate-700 px-4 dark:border-slate-600">
              <div className="flex items-center"><Store className="mr-2 h-6 w-6 text-sky-400" /><h1 className="text-lg font-bold">SmartResto</h1></div>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></Button>
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
                    { name: 'products', label: 'Mahsulotlar', icon: Package },
                  ].map(item => (
                    <Button key={item.name} variant={activeTab === item.name ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === item.name ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => { setActiveTab(item.name); setShowMobileSidebar(false) }}><item.icon className="mr-2 h-4 w-4" />{item.label}</Button>
                  ))}
                </div>
                <h2 className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tizim</h2>
                <div className="space-y-1">
                  <Button variant={activeTab === "settings" ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === 'settings' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'hover:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-300 hover:text-white'}`} onClick={() => { setActiveTab("settings"); setShowMobileSidebar(false) }}><Settings className="mr-2 h-4 w-4" />Sozlamalar</Button>
                  <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 dark:hover:bg-slate-700" onClick={() => { router.push("/pos"); setShowMobileSidebar(false) }}><Home className="mr-2 h-4 w-4" />POS ga qaytish</Button>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-900/30 hover:text-red-400" onClick={() => { handleLogout(); setShowMobileSidebar(false) }}><LogOut className="mr-2 h-4 w-4" />Chiqish</Button>
                </div>
              </nav>
            </ScrollArea>
            <div className="border-t border-slate-700 p-4 dark:border-slate-600">
              <div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src="/placeholder-user.jpg" /><AvatarFallback>AD</AvatarFallback></Avatar><div><p className="text-sm font-medium">Admin User</p><p className="text-xs text-slate-400 dark:text-slate-500">Administrator</p></div></div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(true)}><Menu className="h-6 w-6" /></Button>
            <div className="flex items-center"><Store className="h-6 w-6 text-sky-400" /><h1 className="ml-2 text-lg font-bold">SmartResto</h1></div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="outline" size="sm" className="hidden md:inline-flex gap-1 text-sm">
              <Calendar className="h-4 w-4" />{new Date().toLocaleDateString("uz-UZ", { day: '2-digit', month: 'long', year: 'numeric' })}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-8 w-8 rounded-full"><Avatar className="h-8 w-8"><AvatarImage src="/placeholder-user.jpg" /><AvatarFallback>AD</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem disabled><Users className="mr-2 h-4 w-4"/>Profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('settings')}><Settings className="mr-2 h-4 w-4" />Sozlamalar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-400"><LogOut className="mr-2 h-4 w-4" />Chiqish</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-slate-100 dark:bg-slate-950">
          {activeTab === "dashboard" && (
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bugungi savdo</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(stats.todays_sales.value ?? 0).toLocaleString()} so'm</div><p className="text-xs text-muted-foreground">{stats.todays_sales.change_percent >= 0 ? '+' : ''}{stats.todays_sales.change_percent?.toFixed(1) ?? 0}% vs {stats.todays_sales.comparison_period || "kecha"}</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bugungi Buyurtmalar</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">+{stats.todays_orders.value ?? 0}</div><p className="text-xs text-muted-foreground">{stats.todays_orders.change_percent >= 0 ? '+' : ''}{stats.todays_orders.change_percent?.toFixed(1) ?? 0}% vs {stats.todays_orders.comparison_period || "kecha"}</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faol xodimlar</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active_employees.value ?? 0}</div><p className="text-xs text-muted-foreground">{(stats.active_employees.change_absolute ?? 0) >= 0 ? '+' : ''}{stats.active_employees.change_absolute ?? 0} vs {stats.active_employees.comparison_period || "kecha"}</p></CardContent></Card>
              <Card className="col-span-full md:col-span-2">
                <CardHeader><CardTitle>Savdo dinamikasi (Oxirgi 7 kun)</CardTitle></CardHeader>
                <CardContent className="pl-2">
                  {validSalesData.length > 0 && isClient ? (
                    <div className="h-[250px] w-full">
                      <Chart options={{ chart: { id: "weekly-sales-chart", toolbar: { show: false }, background: 'transparent' }, theme: { mode: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light' }, xaxis: { categories: validSalesData.map((day) => new Date(day.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })), labels: { rotate: -45, style: { fontSize: "10px", colors: '#9ca3af' }, offsetY: 5 }, axisBorder: { show: false }, axisTicks: { show: false } }, yaxis: { labels: { formatter: (value) => `${(value / 1000).toFixed(0)}k`, style: { colors: '#9ca3af' } } }, dataLabels: { enabled: false }, stroke: { curve: "smooth", width: 2 }, colors: ["#3b82f6"], grid: { borderColor: "hsl(var(--border))", strokeDashArray: 4, row: { colors: ['transparent', 'transparent'], opacity: 0.5 } }, tooltip: { theme: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light', y: { formatter: (value) => `${value.toLocaleString()} so'm` } }, fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3, stops: [0, 90, 100] } }, }} series={[{ name: "Savdo", data: validSalesData.map((day) => day.sales) }]} type="area" height={250}/>
                    </div>) : (<div className="flex h-[250px] items-center justify-center text-muted-foreground">Ma'lumotlar yuklanmoqda...</div>)}
                </CardContent>
              </Card>
              <Card className="col-span-full md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-4"><CardTitle className="text-base font-semibold">Eng ko'p sotilganlar</CardTitle><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-1">{dateRange === "daily" ? "Bugun" : dateRange === "weekly" ? "Haftalik" : "Oylik"}<ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDateRange("daily")}>Bugun</DropdownMenuItem><DropdownMenuItem onClick={() => setDateRange("weekly")}>Haftalik</DropdownMenuItem><DropdownMenuItem onClick={() => setDateRange("monthly")}>Oylik</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardHeader>
                <CardContent className="p-0"><ScrollArea className="h-[250px]"><Table><TableHeader><TableRow><TableHead>Mahsulot</TableHead><TableHead className="text-right">Miqdor</TableHead><TableHead className="text-right">Savdo</TableHead></TableRow></TableHeader><TableBody>{validTopProducts.length > 0 ? validTopProducts.map((product, index) => (<TableRow key={product.product_id || index}><TableCell className="font-medium">{product.product_name || "Noma'lum"}</TableCell><TableCell className="text-right">{product.quantity ?? 0}</TableCell><TableCell className="text-right">{(product.sales ?? 0).toLocaleString()} so'm</TableCell></TableRow>)) : (<TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Bu davr uchun ma'lumot yo'q</TableCell></TableRow>)}</TableBody></Table></ScrollArea></CardContent>
              </Card>
              <Card className="col-span-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>So'nggi buyurtmalar</CardTitle><CardDescription>Oxirgi {validDisplayedOrders.length} ta buyurtma.</CardDescription></div>
                  <Button variant="ghost" size="sm" onClick={refreshOrders}><Paperclip className="mr-2 h-4 w-4"/>Yangilash</Button>
                </CardHeader>
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
                        <TableHead className="text-right w-[100px]">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {validDisplayedOrders.length > 0 ? validDisplayedOrders.map((order) => (
  <TableRow key={order.id}>
    <TableCell className="font-medium">#{order.id}</TableCell>
    <TableCell>{order.customer_name || "Noma'lum"}</TableCell>
    <TableCell className="hidden sm:table-cell">{order.order_type_display || 'N/A'}</TableCell>
    <TableCell className="text-right">{parseFloat(order.final_price || 0).toLocaleString()} so'm</TableCell>
    <TableCell className="hidden md:table-cell">
      <Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : order.status === 'pending' ? 'warning' : order.status === 'ready' ? 'info' : 'outline'}>
        {order.status_display || 'N/A'}
      </Badge>
    </TableCell>
    <TableCell className="hidden lg:table-cell text-right">
      {new Date(order.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
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
          <DropdownMenuItem onClick={() => handleShowOrderDetails(order.id)}>Batafsil</DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            await handleShowOrderDetails(order.id);
            setTimeout(() => {
              if (selectedOrderDetails) {
                printReceipt(selectedOrderDetails);
              } else {
                toast.error("Chekni chop etish uchun ma'lumotlar topilmadi!");
              }
            }, 500);
          }}>
            Chek chop etish
          </DropdownMenuItem>
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <DropdownMenuItem onClick={() => handleCancelOrder(order.id)} className="text-red-600">
              Bekor qilish
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
)) : (
  <TableRow>
    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
      Buyurtmalar topilmadi.
    </TableCell>
  </TableRow>
)}
</TableBody>
</Table>
</CardContent>
<CardFooter className="flex justify-center pt-4">
  {!showAllOrders && validOrders.length > 5 && (
    <Button variant="link" onClick={() => setShowAllOrders(true)}>
      Barchasini ko'rish
    </Button>
  )}
  {showAllOrders && (
    <Button variant="link" onClick={() => setShowAllOrders(false)}>
      Kamroq ko'rish
    </Button>
  )}
</CardFooter>
</Card>
</div>
)}
{activeTab === "orders" && (
<div className="space-y-6">
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <h2 className="text-2xl font-bold tracking-tight">Buyurtmalar</h2>
    <Button variant="ghost" onClick={refreshOrders}>
      <Paperclip className="mr-2 h-4 w-4" /> Yangilash
    </Button>
  </div>
  <Card>
    <CardHeader>
      <CardTitle>Buyurtmalar ro'yxati</CardTitle>
      <CardDescription>Barcha buyurtmalar va ularning holati.</CardDescription>
    </CardHeader>
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
            <TableHead className="text-right w-[100px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validOrders.length > 0 ? validOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell>{order.customer_name || "Noma'lum"}</TableCell>
              <TableCell className="hidden sm:table-cell">{order.order_type_display || 'N/A'}</TableCell>
              <TableCell className="text-right">{parseFloat(order.final_price || 0).toLocaleString()} so'm</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : order.status === 'pending' ? 'warning' : order.status === 'ready' ? 'info' : 'outline'}>
                  {order.status_display || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right">
                {new Date(order.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
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
                    <DropdownMenuItem onClick={() => handleShowOrderDetails(order.id)}>Batafsil</DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      await handleShowOrderDetails(order.id);
                      setTimeout(() => {
                        if (selectedOrderDetails) {
                          printReceipt(selectedOrderDetails);
                        } else {
                          toast.error("Chekni chop etish uchun ma'lumotlar topilmadi!");
                        }
                      }, 500);
                    }}>
                      Chek chop etish
                    </DropdownMenuItem>
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <DropdownMenuItem onClick={() => handleCancelOrder(order.id)} className="text-red-600">
                        Bekor qilish
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Buyurtmalar topilmadi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
)}
{activeTab === "products" && (
<div className="space-y-6">
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <h2 className="text-2xl font-bold tracking-tight">Mahsulotlar</h2>
    <Button onClick={() => setShowAddProductDialog(true)}>
      <Plus className="mr-2 h-4 w-4" /> Yangi mahsulot qo'shish
    </Button>
  </div>
  <Card>
    <CardHeader>
      <CardTitle>Mahsulotlar ro'yxati</CardTitle>
      <CardDescription>Barcha mavjud mahsulotlar va ularning narxlari.</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mahsulot nomi</TableHead>
            <TableHead className="text-right">Narx</TableHead>
            <TableHead className="hidden sm:table-cell">Tavsif</TableHead>
            <TableHead className="text-right">Holat</TableHead>
            <TableHead className="text-right">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validProducts.length > 0 ? validProducts.map((product, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium flex items-center gap-2">
                <img
                  src={product.image || "/placeholder-product.jpg"}
                  alt={product.name || "Mahsulot"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{product.name || "Noma'lum"}</span>
              </TableCell>
              <TableCell className="text-right">{(product.price || 0).toLocaleString()} so'm</TableCell>
              <TableCell className="hidden sm:table-cell">{product.description || "Tavsif yo'q"}</TableCell>
              <TableCell className="text-right">
                <Badge variant={product.is_active ? 'success' : 'secondary'}>
                  {product.is_active ? 'Faol' : 'Nofaol'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProduct(product)}
                  className="text-red-600 hover:text-red-700"
                >
                  O'chirish
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Mahsulotlar topilmadi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
)}
{activeTab === "employees" && (
<div className="space-y-6">
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <h2 className="text-2xl font-bold tracking-tight">Xodimlar</h2>
    <Button onClick={() => setShowAddEmployeeDialog(true)}>
      <Plus className="mr-2 h-4 w-4" /> Yangi xodim qo'shish
    </Button>
  </div>
  <Card>
    <CardHeader>
      <CardTitle>Xodimlar ro'yxati</CardTitle>
      <CardDescription>Restoraningizdagi barcha xodimlar va ularning rollari.</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Ism</TableHead>
            <TableHead className="hidden sm:table-cell">Rol</TableHead>
            <TableHead className="hidden md:table-cell">Telefon</TableHead>
            <TableHead className="text-right">Holat</TableHead>
            <TableHead className="text-right">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validXodim.length > 0 ? validXodim.map((employee, index) => (
            <TableRow key={employee.id || index}>
              <TableCell className="font-medium">{employee.id || 'N/A'}</TableCell>
              <TableCell>{employee.first_name} {employee.last_name}</TableCell>
              <TableCell className="hidden sm:table-cell">{employee.role?.name || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">{employee.phone || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Badge variant={employee.is_active ? 'success' : 'secondary'}>
                  {employee.is_active ? 'Faol' : 'Nofaol'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEmployee(employee)}
                  className="text-red-600 hover:text-red-700"
                >
                  O'chirish
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Xodimlar topilmadi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
)}
{activeTab === "roles" && (
<div className="space-y-6">
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <h2 className="text-2xl font-bold tracking-tight">Rollar</h2>
    <Button onClick={() => setShowAddRoleDialog(true)}>
      <Plus className="mr-2 h-4 w-4" /> Yangi rol qo'shish
    </Button>
  </div>
  <Card>
    <CardHeader>
      <CardTitle>Rollar ro'yxati</CardTitle>
      <CardDescription>Xodimlarga biriktiriladigan rollar.</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Nomi</TableHead>
            <TableHead className="hidden sm:table-cell text-right">Xodimlar soni</TableHead>
            <TableHead className="text-right">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validRolesList.length > 0 ? validRolesList.map((role, index) => (
            <TableRow key={role.id || index}>
              <TableCell className="font-medium">{role.id || 'N/A'}</TableCell>
              <TableCell>{role.name || 'Noma\'lum'}</TableCell>
              <TableCell className="hidden sm:table-cell text-right">{role.employee_count ?? role.count ?? 0}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRole(role)}
                  className="text-red-600 hover:text-red-700"
                >
                  O'chirish
                </Button>
              </TableCell>
            </TableRow>
          )) : (
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
{activeTab === "reports" && (
<div className="space-y-6">
  <h2 className="text-2xl font-bold tracking-tight">Hisobotlar</h2>
  <Tabs defaultValue="employees" className="space-y-4">
    <TabsList>
      <TabsTrigger value="employees">Xodimlar bo'yicha</TabsTrigger>
      <TabsTrigger value="products">Mahsulotlar bo'yicha</TabsTrigger>
      <TabsTrigger value="customers">Mijozlar bo'yicha</TabsTrigger>
      <TabsTrigger value="charts">Diagrammalar</TabsTrigger>
    </TabsList>
    <TabsContent value="employees" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Xodimlar bo'yicha hisobot</CardTitle>
          <CardDescription>Xodimlarning buyurtmalari va savdo natijalari.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Xodim</TableHead>
                <TableHead className="text-right">Buyurtmalar soni</TableHead>
                <TableHead className="text-right">Jami savdo</TableHead>
                <TableHead className="text-right">O'rtacha chek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validEmployeeReport.length > 0 ? validEmployeeReport.map((report, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{report.employee_name || "Noma'lum"}</TableCell>
                  <TableCell className="text-right">{report.orders_count ?? 0}</TableCell>
                  <TableCell className="text-right">{(report.total_sales ?? 0).toLocaleString()} so'm</TableCell>
                  <TableCell className="text-right">{(report.average_check ?? 0).toLocaleString()} so'm</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Hisobot ma'lumotlari topilmadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="products" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mahsulotlar bo'yicha hisobot</CardTitle>
          <CardDescription>Eng ko'p sotilgan mahsulotlar va ularning savdolari.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahsulot</TableHead>
                <TableHead className="text-right">Sotilgan miqdor</TableHead>
                <TableHead className="text-right">Jami savdo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validProducts.length > 0 ? validProducts.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.product_name || "Noma'lum"}</TableCell>
                  <TableCell className="text-right">{product.quantity_sold ?? 0}</TableCell>
                  <TableCell className="text-right">{(product.total_sales ?? 0).toLocaleString()} so'm</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Hisobot ma'lumotlari topilmadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="customers" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mijozlar bo'yicha hisobot</CardTitle>
          <CardDescription>Mijozlarning buyurtmalari va savdo statistikasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Doimiy mijozlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Buyurtmalar soni: {customerReport.regular_customers.orders_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">Jami savdo: {(customerReport.regular_customers.total_sales ?? 0).toLocaleString()} so'm</p>
                <p className="text-sm text-muted-foreground">O'rtacha chek: {(customerReport.regular_customers.average_check ?? 0).toLocaleString()} so'm</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Yangi mijozlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Buyurtmalar soni: {customerReport.new_customers.orders_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">Jami savdo: {(customerReport.new_customers.total_sales ?? 0).toLocaleString()} so'm</p>
                <p className="text-sm text-muted-foreground">O'rtacha chek: {(customerReport.new_customers.average_check ?? 0).toLocaleString()} so'm</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bir martalik mijozlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Buyurtmalar soni: {customerReport.one_time_customers.orders_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">Jami savdo: {(customerReport.one_time_customers.total_sales ?? 0).toLocaleString()} so'm</p>
                <p className="text-sm text-muted-foreground">O'rtacha chek: {(customerReport.one_time_customers.average_check ?? 0).toLocaleString()} so'm</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="charts" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>To'lov turlari bo'yicha</CardTitle>
            <CardDescription>Buyurtmalarning to'lov usullari bo'yicha taqsimoti.</CardDescription>
          </CardHeader>
          <CardContent>
            {validPaymentMethods.length > 0 && isClient ? (
              <div className="h-[300px]">
                <Chart
                  options={{
                    chart: { type: 'donut', background: 'transparent' },
                    theme: { mode: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                    labels: validPaymentMethods.map(method => method.payment_method_display || 'Noma\'lum'),
                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
                    legend: { position: 'bottom', labels: { colors: '#9ca3af' } },
                    plotOptions: {
                      pie: {
                        donut: {
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: 'Jami',
                              formatter: () => `${validPaymentMethods.reduce((sum, method) => sum + (method.count || 0), 0)}`,
                            },
                          },
                        },
                      },
                    },
                    tooltip: { theme: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                  }}
                  series={validPaymentMethods.map(method => method.count || 0)}
                  type="donut"
                  height={300}
                />
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Ma'lumotlar yuklanmoqda...
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buyurtma turlari bo'yicha</CardTitle>
            <CardDescription>Buyurtmalarning turlari bo'yicha taqsimoti.</CardDescription>
          </CardHeader>
          <CardContent>
            {validOrderTypes.length > 0 && isClient ? (
              <div className="h-[300px]">
                <Chart
                  options={{
                    chart: { type: 'donut', background: 'transparent' },
                    theme: { mode: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                    labels: validOrderTypes.map(type => type.order_type_display || 'Noma\'lum'),
                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
                    legend: { position: 'bottom', labels: { colors: '#9ca3af' } },
                    plotOptions: {
                      pie: {
                        donut: {
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: 'Jami',
                              formatter: () => `${validOrderTypes.reduce((sum, type) => sum + (type.count || 0), 0)}`,
                            },
                          },
                        },
                      },
                    },
                    tooltip: { theme: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                  }}
                  series={validOrderTypes.map(type => type.count || 0)}
                  type="donut"
                  height={300}
                />
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Ma'lumotlar yuklanmoqda...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  </Tabs>
</div>
)}
{activeTab === "settings" && (
<div className="space-y-6">
  <h2 className="text-2xl font-bold tracking-tight">Sozlamalar</h2>
  <Card>
    <CardHeader>
      <CardTitle>Restoran ma'lumotlari</CardTitle>
      <CardDescription>Restoran haqidagi asosiy ma'lumotlarni boshqaring.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="business-name">Biznes nomi *</Label>
          <Input
            id="business-name"
            placeholder="SmartResto"
            defaultValue="SmartResto"
            className="w-full"
            disabled
          />
          <p className="text-sm text-muted-foreground">
            Bu restoran nomini o'zgartirish uchun administrator bilan bog'laning.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone-number">Telefon raqami *</Label>
          <Input
            id="phone-number"
            placeholder="+998 71 123 45 67"
            defaultValue="+998 71 123 45 67"
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Mijozlar bilan aloqa qilish uchun telefon raqami.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="info@smartresto.uz"
            defaultValue="info@smartresto.uz"
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Rasmiy elektron pochta manzili.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Tavsif</Label>
          <textarea
            id="description"
            placeholder="Biz haqimizda qisqacha ma'lumot..."
            defaultValue="SmartResto - eng yaxshi taomlarni taklif qiluvchi restoran."
            className="w-full h-24 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="text-sm text-muted-foreground">
            Restoran haqida qisqacha ma'lumot.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Tizim sozlamalari</Label>
          <Select defaultValue="uz">
            <SelectTrigger id="language" className="w-full">
              <SelectValue placeholder="Tilni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uz">O'zbek</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Tizimda ishlatiladigan tilni tanlang.
          </p>
        </div>
        <div className="flex justify-end">
          <Button className="bg-sky-500 hover:bg-sky-600">
            Saqlash
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
)}
<Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
<DialogContent>
  <DialogHeader>
    <DialogTitle>Yangi xodim qo'shish</DialogTitle>
    <DialogDescription>
      Xodim haqidagi ma'lumotlarni kiriting. (*) bilan belgilangan maydonlar majburiy.
    </DialogDescription>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="username" className="text-right">
        Username*
      </Label>
      <Input
        id="username"
        value={newEmployee.username}
        onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="first_name" className="text-right">
        Ism*
      </Label>
      <Input
        id="first_name"
        value={newEmployee.first_name}
        onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="last_name" className="text-right">
        Familiya*
      </Label>
      <Input
        id="last_name"
        value={newEmployee.last_name}
        onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="role_id" className="text-right">
        Rol*
      </Label>
      <Select
        value={newEmployee.role_id}
        onValueChange={(value) => setNewEmployee({ ...newEmployee, role_id: value })}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Rolni tanlang" />
        </SelectTrigger>
        <SelectContent>
          {validFetchedRoles.map((role) => (
            <SelectItem key={role.id} value={role.id.toString()}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="pin_code" className="text-right">
        PIN-kod*
      </Label>
      <Input
        id="pin_code"
        type="text"
        value={newEmployee.pin_code}
        onChange={(e) => setNewEmployee({ ...newEmployee, pin_code: e.target.value })}
        className="col-span-3"
        placeholder="1234"
        maxLength={4}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="is_active" className="text-right">
        Faol
      </Label>
      <div className="col-span-3 flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={newEmployee.is_active}
          onChange={(e) => setNewEmployee({ ...newEmployee, is_active: e.target.checked })}
          className="h-4 w-4"
        />
      </div>
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" onClick={() => setShowAddEmployeeDialog(false)}>
      Bekor qilish
    </Button>
    <Button onClick={handleAddEmployee}>Qo'shish</Button>
  </DialogFooter>
</DialogContent>
</Dialog>
<Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
<DialogContent>
  <DialogHeader>
    <DialogTitle>Yangi rol qo'shish</DialogTitle>
    <DialogDescription>
      Yangi rol nomini kiriting. Bu rolni keyinchalik xodimlarga biriktirish mumkin.
    </DialogDescription>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="role_name" className="text-right">
        Rol nomi*
      </Label>
      <Input
        id="role_name"
        value={newRole.name}
        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
        className="col-span-3"
      />
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
      Bekor qilish
    </Button>
    <Button onClick={handleAddRole}>Qo'shish</Button>
  </DialogFooter>
</DialogContent>
</Dialog>
<Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
<DialogContent>
  <DialogHeader>
    <DialogTitle>Yangi mahsulot qo'shish</DialogTitle>
    <DialogDescription>
      Mahsulot haqidagi ma'lumotlarni kiriting. (*) bilan belgilangan maydonlar majburiy.
    </DialogDescription>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="product_name" className="text-right">
        Nomi*
      </Label>
      <Input
        id="product_name"
        value={newProduct.name}
        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="product_price" className="text-right">
        Narx*
      </Label>
      <Input
        id="product_price"
        type="number"
        value={newProduct.price}
        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
        className="col-span-3"
        placeholder="10000"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="category_id" className="text-right">
        Kategoriya*
      </Label>
      <Select
        value={newProduct.category_id}
        onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Kategoriyani tanlang" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="cost_price" className="text-right">
        Tannarx
      </Label>
      <Input
        id="cost_price"
        type="number"
        value={newProduct.cost_price}
        onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
        className="col-span-3"
        placeholder="5000"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="product_image" className="text-right">
        Rasm
      </Label>
      <Input
        id="product_image"
        type="file"
        accept="image/*"
        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="product_description" className="text-right">
        Tavsif
      </Label>
      <Input
        id="product_description"
        value={newProduct.description}
        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        className="col-span-3"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="product_is_active" className="text-right">
        Faol
      </Label>
      <div className="col-span-3 flex items-center">
        <input
          type="checkbox"
          id="product_is_active"
          checked={newProduct.is_active}
          onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
          className="h-4 w-4"
        />
      </div>
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" onClick={() => setShowAddProductDialog(false)}>
      Bekor qilish
    </Button>
    <Button onClick={handleAddProduct}>Qo'shish</Button>
  </DialogFooter>
</DialogContent>
</Dialog>
<Dialog open={isDeleteRoleConfirmOpen} onOpenChange={(open) => { setIsDeleteRoleConfirmOpen(open); if (!open) setRoleToDelete(null); }}>
<DialogContent>
  <DialogHeader>
    <DialogTitle>Rolni o'chirishni tasdiqlang</DialogTitle>
    <DialogDescription>
      {roleToDelete ? (
        roleToDelete.employee_count > 0 ? (
          `"${roleToDelete.name}" rolini o'chirishni xohlaysizmi? Bu rolga hozirda ${roleToDelete.employee_count} ta xodim biriktirilgan. O'chirishdan oldin xodimlarni boshqa rollarga o'tkazing.`
        ) : (
          `Haqiqatan ham "${roleToDelete.name}" rolini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`
        )
      ) : (
        "Rol ma'lumotlari topilmadi."
      )}
    </DialogDescription>
  </DialogHeader>
  <DialogFooter>
    <Button variant="outline" onClick={() => { setIsDeleteRoleConfirmOpen(false); setRoleToDelete(null); }}>
      Bekor qilish
    </Button>
    <Button
      variant="destructive"
      onClick={confirmDeleteRole}
      disabled={roleToDelete?.employee_count > 0}
    >
      O'chirish
    </Button>
  </DialogFooter>
</DialogContent>
</Dialog>
<Dialog open={showOrderDetailsModal} onOpenChange={handleModalClose}>
<DialogContent className="max-w-3xl">
  <DialogHeader>
    <DialogTitle>Buyurtma tafsilotlari #{selectedOrderDetails?.id || ''}</DialogTitle>
    <DialogDescription>
      Buyurtma haqidagi to'liq ma'lumotlar.
    </DialogDescription>
  </DialogHeader>
  {isLoadingOrderDetails ? (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
    </div>
  ) : orderDetailsError ? (
    <div className="py-10 text-center text-red-600 dark:text-red-400">
      {orderDetailsError}
    </div>
  ) : selectedOrderDetails ? (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Mijoz</p>
          <p className="text-base">{selectedOrderDetails.customer_name || 'Noma\'lum'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sana</p>
          <p className="text-base">
            {new Date(selectedOrderDetails.created_at).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Holat</p>
          <Badge variant={selectedOrderDetails.status === 'completed' ? 'success' : selectedOrderDetails.status === 'cancelled' ? 'destructive' : selectedOrderDetails.status === 'pending' ? 'warning' : selectedOrderDetails.status === 'ready' ? 'info' : 'outline'}>
            {selectedOrderDetails.status_display || 'N/A'}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Buyurtma turi</p>
          <p className="text-base">{selectedOrderDetails.order_type_display || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Xodim</p>
          <p className="text-base">
            {selectedOrderDetails.created_by?.first_name || ''} {selectedOrderDetails.created_by?.last_name || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">To'lov usuli</p>
          <p className="text-base">{selectedOrderDetails.payment_method_display || 'N/A'}</p>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold mb-2">Mahsulotlar</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mahsulot</TableHead>
              <TableHead className="text-right">Miqdor</TableHead>
              <TableHead className="text-right">Narx</TableHead>
              <TableHead className="text-right">Jami</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(selectedOrderDetails.items || []).length > 0 ? selectedOrderDetails.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.product_details?.name || 'Noma\'lum'}</TableCell>
                <TableCell className="text-right">{item.quantity || 0}</TableCell>
                <TableCell className="text-right">{parseFloat(item.unit_price || 0).toLocaleString()} so'm</TableCell>
                <TableCell className="text-right">{parseFloat(item.total_price || 0).toLocaleString()} so'm</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Mahsulotlar topilmadi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Mahsulotlar jami:</span>
          <span>{(selectedOrderDetails.items?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) ?? 0).toLocaleString()} so'm</span>
        </div>
        {selectedOrderDetails.service_fee_percent > 0 && (
          <div className="flex justify-between">
            <span className="font-medium">Xizmat haqi ({selectedOrderDetails.service_fee_percent}%):</span>
            <span>{(selectedOrderDetails.items?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) * (selectedOrderDetails.service_fee_percent / 100) ?? 0).toLocaleString()} so'm</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold">
          <span>Umumiy:</span>
          <span>{parseFloat(selectedOrderDetails.final_price || 0).toLocaleString()} so'm</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="py-10 text-center text-muted-foreground">
      Ma'lumotlar topilmadi.
    </div>
  )}
  <DialogFooter>
    <Button variant="outline" onClick={handleModalClose}>
      Yopish
    </Button>
    {!isLoadingOrderDetails && !orderDetailsError && selectedOrderDetails && (
      <Button onClick={() => printReceipt(selectedOrderDetails)}>
        <Printer className="mr-2 h-4 w-4" /> Chek chop etish
      </Button>
    )}
  </DialogFooter>
</DialogContent>
</Dialog>
</main>
</div>
</div>
)
}