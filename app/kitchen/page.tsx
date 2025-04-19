"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import axios from "axios"

export default function KitchenPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("new")
  const [servedOrders, setServedOrders] = useState([])
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState("")

  // Buyurtmalarni yuklash
  useEffect(() => {
    setIsLoadingOrders(true)
    axios
      .get("https://oshxonacopy.pythonanywhere.com/api/orders/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        setOrders(res.data)
        setServedOrders(res.data.filter((order) => order.status === "completed"))
        setIsLoadingOrders(false)
      })
      .catch((err) => {
        console.error("Buyurtmalarni yuklashda xato:", err)
        setError("Buyurtmalarni yuklashda xato yuz berdi")
        setIsLoadingOrders(false)
      })
  }, [])

  // Token tekshiruvi
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth")
    }
  }, [router])

  // Buyurtmalarni tablar bo'yicha filtrlash
  const filteredOrders = (tab) => {
    switch (tab) {
      case "new":
        return orders.filter((order) => order.status === "pending" || order.status === "new")
      case "preparing":
        return orders.filter((order) => order.status === "preparing")
      case "ready":
        return orders.filter((order) => order.status === "ready")
      case "completed":
        return servedOrders
      default:
        return []
    }
  }

  // Buyurtma holatini "Tayyorlash"ga o'zgartirish
  const handleStartPreparing = async (orderId) => {
    try {
      await axios.post(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/start_preparation/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "preparing" } : order
        )
      )
    } catch (err) {
      console.error("Xatolik:", err)
      alert("Buyurtma holatini o'zgartirishda xatolik yuz berdi")
    }
  }

  // Buyurtma holatini "Tayyor"ga o'zgartirish
  const handleOrderReady = async (orderId) => {
    try {
      await axios.post(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/mark_ready/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "ready", ready_at: new Date().toISOString() } : order
        )
      )
    } catch (err) {
      console.error("Xatolik:", err)
      alert("Buyurtma holatini o'zgartirishda xatolik yuz berdi")
    }
  }

  // Buyurtma holatini "Bajarilgan"ga o'zgartirish
  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.post(
        `https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/mark-completed-chef/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      const updatedOrder = orders.find((order) => order.id === orderId)
      if (updatedOrder) {
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))
        setServedOrders((prevServed) => [
          ...prevServed,
          { ...updatedOrder, status: "completed", completed_at: new Date().toISOString() },
        ])
        alert(`Buyurtma #${orderId} bajarildi!`)
      }
    } catch (err) {
      console.error("Xatolik:", err)
      alert("Buyurtma holatini o'zgartirishda xatolik yuz berdi")
    }
  }

  // Vaqtni formatlash funksiyasi
  const formatTime = (dateString) => {
    try {
      if (!dateString) return "Vaqt ko'rsatilmagan"
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Noto'g'ri vaqt formati"
      return date.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Vaqtni formatlashda xatolik:", error)
      return "Vaqtni formatlashda xatolik"
    }
  }

  // Vaqt farqini hisoblash funksiyasi
  const getTimeDifference = (dateString) => {
    try {
      if (!dateString) return "Vaqt ko'rsatilmagan"
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Noto'g'ri vaqt formati"
      const now = new Date()
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
      if (diff < 1) return "Hozirgina"
      if (diff < 60) return `${diff} daqiqa oldin`
      const hours = Math.floor(diff / 60)
      if (hours < 24) return `${hours} soat oldin`
      const days = Math.floor(hours / 24)
      return `${days} kun oldin`
    } catch (error) {
      console.error("Vaqt farqini hisoblashda xatolik:", error)
      return "Vaqtni hisoblashda xatolik"
    }
  }

  // Batafsil ko'rish funksiyasi
  const handleViewDetails = async (orderId) => {
    setDetailsLoading(true)
    setDetailsError("")
    setSelectedOrderDetails(null)

    try {
      const response = await axios.get(`https://oshxonacopy.pythonanywhere.com/api/orders/${orderId}/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      setSelectedOrderDetails(response.data)
      setIsDetailsOpen(true)
    } catch (err) {
      console.error("Buyurtma tafsilotlarini yuklashda xato:", err)
      setDetailsError("Buyurtma tafsilotlarini yuklashda xato yuz berdi")
    } finally {
      setDetailsLoading(false)
    }
  }

  // Chiqish funksiyasi
  const handleLogout = () => {
    setIsLogoutOpen(true)
  }

  // Modal tasdiqlanganda chiqish
  const confirmLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refresh")
    localStorage.removeItem("user")
    router.push("/auth")
    setIsLogoutOpen(false)
  }

  // Buyurtma kartasi komponenti
  const OrderCard = ({ order, actionButton }) => {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>#{order.id}</span>
                <Badge variant={order.order_type === "delivery" ? "destructive" : "outline"}>
                  {order.order_type_display}
                </Badge>
              </CardTitle>

              {(order.order_type === "delivery" || order.order_type === "takeaway") && (
                <div className="mt-2 space-y-1 text-sm">
                  {order.customer_name && <div className="font-medium">{order.customer_name}</div>}
                  {order.customer_phone && (
                    <div className="text-muted-foreground">Tel: {order.customer_phone}</div>
                  )}
                  {order.order_type === "delivery" && order.customer_address && (
                    <div className="text-muted-foreground">Manzil: {order.customer_address}</div>
                  )}
                </div>
              )}

              <div className="text-sm text-muted-foreground mt-1">
                <Clock className="h-4 w-4 inline mr-1" />
                {formatTime(order.created_at || order.completed_at)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Stol: {order.table_name || "Mavjud emas"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Umumiy narx: {order.final_price} so'm
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Elementlar soni: {order.item_count}
              </div>
            </div>
            <Badge variant="secondary">{getTimeDifference(order.created_at || order.completed_at)}</Badge>
          </div>
        </CardHeader>

        <CardFooter className="border-t p-2 flex justify-between">
          {actionButton}
          <Button
            variant="outline"
            onClick={() => handleViewDetails(order.id)}
            className="ml-2"
          >
            Batafsil ko'rish
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (isLoadingOrders) {
    return <div className="flex h-screen items-center justify-center">Yuklanmoqda...</div>
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Qayta yuklash</Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Oshxona</h1>
        </div>
        <div className="flex items-center space-x-4">
          <AlertDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Chiqishni tasdiqlaysizmi?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Yo'q</AlertDialogCancel>
                <AlertDialogAction onClick={confirmLogout}>Ha</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Batafsil ko'rish modali */}
      <AlertDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyurtma #{selectedOrderDetails?.id} tafsilotlari</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {detailsLoading ? (
              <div>Yuklanmoqda...</div>
            ) : detailsError ? (
              <div className="text-destructive">{detailsError}</div>
            ) : selectedOrderDetails ? (
              <div className="space-y-6">
                {/* Mijoz ma'lumotlari */}
                <div>
                  <h3 className="font-semibold text-lg">Mijoz ma'lumotlari</h3>
                  <div className="mt-2 space-y-1">
                    <p>Ism: {selectedOrderDetails.customer_name || "Mavjud emas"}</p>
                    <p>Telefon: {selectedOrderDetails.customer_phone || "Mavjud emas"}</p>
                    <p>Manzil: {selectedOrderDetails.customer_address || "Mavjud emas"}</p>
                  </div>
                </div>

                {/* Buyurtma ma'lumotlari */}
                <div>
                  <h3 className="font-semibold text-lg">Buyurtma ma'lumotlari</h3>
                  <div className="mt-2 space-y-1">
                    <p>ID: {selectedOrderDetails.id}</p>
                    <p>Turi: {selectedOrderDetails.order_type_display}</p>
                    <p>Holati: {selectedOrderDetails.status_display}</p>
                    <p>Stol: {selectedOrderDetails.table?.name || "Mavjud emas"}</p>
                    <p>Stol zonasi: {selectedOrderDetails.table?.zone || "Mavjud emas"}</p>
                    <p>Yaratilgan vaqt: {formatTime(selectedOrderDetails.created_at)}</p>
                    <p>Yangilangan vaqt: {formatTime(selectedOrderDetails.updated_at)}</p>
                  </div>
                </div>

                {/* Buyurtma elementlari */}
                <div>
                  <h3 className="font-semibold text-lg">Buyurtma elementlari</h3>
                  {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {selectedOrderDetails.items.map((item) => (
                        <li key={item.id} className="border-b pb-2">
                          <p>Taom: {item.product_details.name}</p>
                          <p>Soni: {item.quantity}</p>
                          <p>Birlik narxi: {item.unit_price} so'm</p>
                          <p>Umumiy narx: {item.total_price} so'm</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2">Buyurtma elementlari mavjud emas</p>
                  )}
                </div>

                {/* Qo'shimcha xizmatlar va narx */}
                <div>
                  <h3 className="font-semibold text-lg">Narx va xizmatlar</h3>
                  <div className="mt-2 space-y-1">
                    <p>Xizmat haqi: {selectedOrderDetails.service_fee_percent}%</p>
                    <p>Soliq: {selectedOrderDetails.tax_percent}%</p>
                    <p>Umumiy narx: {selectedOrderDetails.final_price} so'm</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>Ma'lumotlar mavjud emas</div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Yopish</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-4">
            <TabsTrigger value="new">Yangi</TabsTrigger>
            <TabsTrigger value="preparing">Tayyorlanmoqda</TabsTrigger>
            <TabsTrigger value="ready">Tayyor</TabsTrigger>
            <TabsTrigger value="completed">Bajarilgan</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0">
            {filteredOrders("new").length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">Yangi buyurtmalar yo'q</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders("new").map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actionButton={
                      <Button
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => handleStartPreparing(order.id)}
                      >
                        Tayyorlashni boshlash
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparing" className="mt-0">
            {filteredOrders("preparing").length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Tayyorlanayotgan buyurtmalar yo'q
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders("preparing").map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actionButton={
                      <Button
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => handleOrderReady(order.id)}
                      >
                        Tayyor
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready" className="mt-0">
            {filteredOrders("ready").length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">Tayyor buyurtmalar yo'q</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders("ready").map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actionButton={
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleCompleteOrder(order.id)}
                      >
                        Bajarilgan
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {filteredOrders("completed").length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Bajarilgan buyurtmalar yo'q
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders("completed").map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}