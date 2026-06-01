import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Minus, Plus, ReceiptText, Search, ShoppingBag, X } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { customerService } from '../../services/customerService'

export function CustomerMenuPage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = useState(null)
  const [menus, setMenus] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
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

  useAutoRefresh(async () => {
    try {
      const menuResponse = await customerService.listMenus({ per_page: 100 })
      setMenus(menuResponse.data || [])
    } catch {
      // Keep the visible menu while a background refresh fails.
    }
  })

  const filteredMenus = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()

    return menus.filter((menu) => {
      const matchesCategory = !selectedCategory || String(menu.category_id) === selectedCategory
      const matchesKeyword = !keyword || [menu.name, menu.description, menu.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))

      return matchesCategory && matchesKeyword
    })
  }, [debouncedSearch, menus, selectedCategory])

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const categories = useMemo(() => {
    const uniqueCategories = new Map()
    menus.forEach((menu) => {
      if (menu.category) {
        uniqueCategories.set(String(menu.category.id), menu.category.name)
      }
    })

    return Array.from(uniqueCategories, ([id, name]) => ({ id, name }))
  }, [menus])
  const cartByMenuId = useMemo(
    () => new Map(cartItems.map((item) => [item.menu_id, item])),
    [cartItems],
  )

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
    <div className="min-h-screen bg-[#f8f6f2] pb-28">
      <header className="sticky top-0 z-20 border-b border-amber-950/5 bg-[#fffdf9]/95 px-4 pb-3 pt-4 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img alt="POS Bakso" className="h-11 w-auto shrink-0 object-contain" src="/images/Logo Red 1.png" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">Menu pelanggan</p>
              <h1 className="text-lg font-bold text-slate-950">Pesan dari meja {table?.table_number || '-'}</h1>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="relative block" htmlFor="customer-menu-search">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-100"
              id="customer-menu-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari menu favorit..."
              value={search}
            />
            {search ? (
              <button
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                onClick={() => setSearch('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </div>
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl p-4">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${selectedCategory === '' ? 'bg-red-700 text-white shadow-md shadow-red-900/15' : 'border border-slate-200 bg-white text-slate-600'}`}
            onClick={() => setSelectedCategory('')}
            type="button"
          >
            Semua menu
          </button>
          {categories.map((category) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${selectedCategory === category.id ? 'bg-red-700 text-white shadow-md shadow-red-900/15' : 'border border-slate-200 bg-white text-slate-600'}`}
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">Pilihan menu</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-950">Mau makan apa hari ini?</h2>
          </div>
          <p className="shrink-0 text-xs font-medium text-slate-500">{filteredMenus.length} menu</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMenus.length ? (
          filteredMenus.map((menu) => (
            <article className="group flex gap-3 rounded-2xl border border-amber-950/5 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={menu.id}>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-amber-50 text-sm font-bold text-red-300">
                {menu.image_url ? (
                  <img alt={menu.name} className="h-full w-full object-cover" src={menu.image_url} />
                ) : (
                  menu.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600">{menu.category?.name || 'Menu'}</p>
                  <p className="leading-tight font-bold text-slate-950">{menu.name}</p>
                  {menu.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-snug">
                      {menu.description}
                    </p>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-bold tracking-tight text-slate-950">{formatRupiah(menu.price)}</p>
                  {cartByMenuId.get(menu.id) ? (
                    <div className="flex items-center gap-2 rounded-full bg-red-50 p-1">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-700 shadow-sm"
                        aria-label={`Kurangi ${menu.name}`}
                        onClick={() => changeQuantity(menu.id, cartByMenuId.get(menu.id).quantity - 1)}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-4 text-center text-sm font-bold text-red-700">
                        {cartByMenuId.get(menu.id).quantity}
                      </span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-700 text-white shadow-sm"
                        aria-label={`Tambah ${menu.name}`}
                        onClick={() => addItem(menu)}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button className="h-9 rounded-full border-0 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100" onClick={() => addItem(menu)} variant="secondary">
                      <Plus className="h-3.5 w-3.5" />
                      Tambah
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description="Coba kata kunci atau kategori lain."
            title="Menu tidak ditemukan"
            action={
              <Button onClick={() => setSearch('')} variant="secondary">
                <Search className="h-4 w-4" />
                Reset
              </Button>
            }
          />
        )}
        </div>
      </main>

      <section className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto max-w-5xl">
        <button
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setIsCartOpen((current) => !current)}
          type="button"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <ShoppingBag className="h-5 w-5" />
              {totalQty ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white">
                  {totalQty}
                </span>
              ) : null}
            </span>
            <span>
              <span className="block text-xs font-medium text-slate-500">{totalQty ? `${totalQty} item di keranjang` : 'Keranjang masih kosong'}</span>
              <span className="block text-lg font-bold text-slate-950">{formatRupiah(total)}</span>
            </span>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            {isCartOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </span>
        </button>

        {isCartOpen ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="customer-name">Nama pemesan</label>
          <input
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
            id="customer-name"
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Contoh: Sayang"
            value={customerName}
          />
        </div>

        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {cartItems.length ? (
            cartItems.map((item) => (
              <div className="rounded-2xl bg-slate-50 p-3" key={item.menu_id}>
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

        <div className="mt-4">
          <Button
            className="w-full rounded-xl"
            disabled={!cartItems.length}
            isLoading={isSubmitting}
            onClick={submitOrder}
            size="lg"
          >
            <ReceiptText className="h-4 w-4" />
            Kirim pesanan
          </Button>
        </div>
          </div>
        ) : null}
        </div>
      </section>
    </div>
  )
}
