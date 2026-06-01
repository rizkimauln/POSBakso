import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ReceiptText, Search, ShoppingCart, Utensils } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { customerService } from '../../services/customerService'

export function CustomerMenuPage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = useState(null)
  const [menus, setMenus] = useState([])
  const [search, setSearch] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const { showToast } = useToast()

  useEffect(() => {
    let isMounted = true

    Promise.all([
      customerService.resolveTable(qrToken),
      customerService.listMenus({ per_page: 100 }),
    ])
      .then(([tableData, menuResponse]) => {
        if (!isMounted) {
          return
        }

        setTable(tableData)
        setMenus(menuResponse.data || [])
        customerService.rememberQrToken(qrToken)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'QR meja tidak bisa dibuka.'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [qrToken])

  const filteredMenus = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()

    if (!keyword) {
      return menus
    }

    return menus.filter((menu) =>
      [menu.name, menu.description, menu.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [debouncedSearch, menus])

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  function addItem(menu) {
    setFieldError('')
    setCartItems((current) => {
      const existingItem = current.find((item) => item.menu_id === menu.id)

      if (existingItem) {
        return current.map((item) =>
          item.menu_id === menu.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [
        ...current,
        {
          menu_id: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: 1,
          notes: '',
        },
      ]
    })
  }

  function changeQuantity(menuId, quantity) {
    if (quantity < 1) {
      setCartItems((current) => current.filter((item) => item.menu_id !== menuId))
      return
    }

    setCartItems((current) =>
      current.map((item) => (item.menu_id === menuId ? { ...item, quantity } : item)),
    )
  }

  function changeNotes(menuId, notes) {
    setCartItems((current) =>
      current.map((item) => (item.menu_id === menuId ? { ...item, notes } : item)),
    )
  }

  async function submitOrder() {
    setIsSubmitting(true)
    setError('')
    setFieldError('')

    try {
      const order = await customerService.createOrder({
        qr_token: qrToken,
        customer_name: customerName,
        items: cartItems.map((item) => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      })

      customerService.rememberPublicToken(order.public_token)
      customerService.rememberQrToken(qrToken)
      showToast({
        title: 'Order berhasil dikirim',
        description: 'Status order bisa dipantau dari halaman berikutnya.',
        tone: 'success',
      })
      navigate(`/customer/orders/${order.public_token}`)
    } catch (requestError) {
      const validationErrors = getValidationErrors(requestError)
      setFieldError(validationErrors.customer_name?.[0] || validationErrors.items?.[0] || validationErrors.qr_token?.[0] || '')
      setError(getApiMessage(requestError, 'Order gagal dikirim.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingState label="Membuka QR meja..." />
      </div>
    )
  }

  if (error && !table) {
    return (
      <div className="p-4">
        <EmptyState description={error} title="QR meja tidak valid" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-44">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-950">Meja {table?.table_number || '-'}</h1>
        </div>
        <div className="mt-3">
          <Input
            id="customer-menu-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari bakso, minuman..."
            value={search}
          />
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <main className="space-y-3 p-4">
        {filteredMenus.length ? (
          filteredMenus.map((menu) => (
            <article className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 p-2.5 flex gap-3" key={menu.id}>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-sm font-bold text-slate-400">
                {menu.image_url ? (
                  <img alt={menu.name} className="h-full w-full object-cover" src={menu.image_url} />
                ) : (
                  menu.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-950">{menu.name}</p>
                  {menu.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-snug">
                      {menu.description}
                    </p>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-bold tracking-tight text-slate-950">{formatRupiah(menu.price)}</p>
                  <Button className="px-3 py-1.5 h-auto text-xs rounded-full bg-red-50 text-red-700 hover:bg-red-100 border-0 font-semibold" onClick={() => addItem(menu)} variant="secondary">
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description="Coba kata kunci lain."
            title="Menu tidak ditemukan"
            action={
              <Button onClick={() => setSearch('')} variant="secondary">
                <Search className="h-4 w-4" />
                Reset
              </Button>
            }
          />
        )}
      </main>

      <section className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-4">
          <Input
            id="customer-name"
            label="Nama Anda"
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Masukkan nama pemesan"
            value={customerName}
          />
        </div>

        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {cartItems.length ? (
            cartItems.map((item) => (
              <div className="rounded-lg bg-slate-50 p-3" key={item.menu_id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="text-sm text-slate-500">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white"
                      onClick={() => changeQuantity(item.menu_id, item.quantity - 1)}
                      type="button"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white"
                      onClick={() => changeQuantity(item.menu_id, item.quantity + 1)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  className="mt-3 min-h-14 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  maxLength={500}
                  onChange={(event) => changeNotes(item.menu_id, event.target.value)}
                  placeholder="Catatan, contoh: tanpa seledri"
                  value={item.notes}
                />
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
              Cart masih kosong.
            </p>
          )}
        </div>

        {fieldError ? <p className="mt-3 text-sm font-medium text-red-600">{fieldError}</p> : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-950">{formatRupiah(total)}</p>
          </div>
          <Button
            disabled={!cartItems.length}
            isLoading={isSubmitting}
            onClick={submitOrder}
            size="lg"
          >
            <ReceiptText className="h-4 w-4" />
            Kirim order
          </Button>
        </div>
      </section>
    </div>
  )
}
