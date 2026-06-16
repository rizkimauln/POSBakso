import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Minus, Plus, ReceiptText, Search, ShoppingBag, X, ArrowLeft, Utensils, Package, Download, Star } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { Modal } from '../../components/common/Modal'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { customerService } from '../../services/customerService'
import { settingService } from '../../services/settingService'

export function CustomerMenuPage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const isTakeAwayOnly = !qrToken
  const [table, setTable] = useState(null)
  const [menus, setMenus] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState(isTakeAwayOnly ? 'take_away' : 'dine_in')
  const [cartItems, setCartItems] = useState([])
  const [qrisImage, setQrisImage] = useState(null)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const { showToast } = useToast()

  useEffect(() => {
    let isMounted = true

    const fetchPromises = [
      customerService.listMenus({ per_page: 100 }),
      settingService.getPublicSettings(),
      customerService.listReviews().catch(() => []) // Optional, fallback to empty array if fails
    ]
    if (qrToken) {
      fetchPromises.push(customerService.resolveTable(qrToken))
    }

    Promise.all(fetchPromises)
      .then((responses) => {
        if (!isMounted) return

        const menuResponse = responses[0]
        setMenus(menuResponse.data || [])

        const settingsResponse = responses[1]
        if (settingsResponse.qris_image_url) {
          setQrisImage(settingsResponse.qris_image_url)
        }

        const reviewsResponse = responses[2]
        setReviews(reviewsResponse || [])

        if (qrToken) {
          setTable(responses[3])
          customerService.rememberQrToken(qrToken)
        }
      })
      .catch((requestError) => {
        if (isMounted && qrToken) {
          setError(getApiMessage(requestError, 'QR meja tidak bisa dibuka.'))
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
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
      const matchesCategory = selectedCategory === 'best_seller' ? menu.is_best_seller : (!selectedCategory || String(menu.category_id) === selectedCategory)
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

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, rev) => acc + Number(rev.rating), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

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
      const payload = {
        customer_name: customerName,
        order_type: orderType,
        qr_token: qrToken,
        items: cartItems.map((item) => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      }

      const order = await customerService.createOrder(payload)

      customerService.rememberPublicToken(order.public_token)
      if (qrToken) {
        customerService.rememberQrToken(qrToken)
      }
      
      showToast({
        title: 'Keranjang Tersimpan',
        description: 'Silakan pilih metode pembayaran Anda.',
        tone: 'success',
      })
      navigate(`/customer/payment/${order.public_token}`)
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
        <LoadingState label="Menyiapkan menu..." />
      </div>
    )
  }

  if (error && !table && !isTakeAwayOnly) {
    return (
      <div className="p-4">
        <EmptyState description={error} title="QR meja tidak valid" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-28 font-sans">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 pb-4 pt-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <img alt="POS Bakso" className="h-8 w-auto object-contain" src="/images/Logo Red 1.png" />
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-red-700 tracking-tight leading-none mb-1">POS Bakso</span>
                {reviews.length > 0 && (
                  <button 
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-100 w-fit"
                  >
                    <Star className="h-3 w-3 fill-amber-500" />
                    {averageRating} ({reviews.length} Ulasan)
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Langkah 1 dari 2
              </p>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                {table ? `Meja ${table.table_number}` : 'Pemesanan'}
              </h1>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
              id="customer-menu-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari menu favorit..."
              value={search}
            />
            {search ? (
              <button
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                onClick={() => setSearch('')}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl p-4">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition-all ${selectedCategory === '' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50'}`}
            onClick={() => setSelectedCategory('')}
            type="button"
          >
            Semua Menu
          </button>
          <button
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition-all ${selectedCategory === 'best_seller' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-600 shadow-sm border border-amber-200 hover:bg-amber-50'}`}
            onClick={() => setSelectedCategory('best_seller')}
            type="button"
          >
            🔥 Best Seller
          </button>
          {categories.map((category) => (
            <button
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition-all ${selectedCategory === category.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50'}`}
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pilihan Menu</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Tersedia {filteredMenus.length} menu</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredMenus.length ? (
          filteredMenus.map((menu) => (
            <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-red-100" key={menu.id}>
              <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                {menu.image_url ? (
                  <img alt={menu.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={menu.image_url} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                    <span className="text-3xl font-black text-red-200">{menu.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                {cartByMenuId.get(menu.id) && (
                  <div className="absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white shadow-sm">
                    {cartByMenuId.get(menu.id).quantity}x
                  </div>
                )}
              </div>
              
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">{menu.category?.name || 'Menu'}</p>
                    {menu.is_best_seller && (
                      <span className="flex items-center justify-center rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                        🔥 Best Seller
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-bold leading-tight text-slate-900">{menu.name}</h3>
                  {menu.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                      {menu.description}
                    </p>
                  ) : null}
                </div>
                
                <div className="mt-auto flex flex-col gap-3">
                  <p className="text-base font-extrabold tracking-tight text-slate-900">{formatRupiah(menu.price)}</p>
                  
                  {cartByMenuId.get(menu.id) ? (
                    <div className="flex items-center justify-between rounded-full bg-slate-50 p-1 ring-1 ring-slate-200">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:text-red-600"
                        aria-label={`Kurangi ${menu.name}`}
                        onClick={() => changeQuantity(menu.id, cartByMenuId.get(menu.id).quantity - 1)}
                        type="button"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold text-slate-900">
                        {cartByMenuId.get(menu.id).quantity}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition hover:bg-red-700"
                        aria-label={`Tambah ${menu.name}`}
                        onClick={() => addItem(menu)}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-red-600" 
                      onClick={() => addItem(menu)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              description="Coba kata kunci atau kategori lain."
              title="Menu tidak ditemukan"
              action={
                <Button onClick={() => setSearch('')} variant="secondary" className="rounded-full">
                  <Search className="mr-2 h-4 w-4" />
                  Reset Pencarian
                </Button>
              }
            />
          </div>
        )}
        </div>
      </main>

      <section className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-slate-200 bg-white/95 px-4 pb-safe pt-3 shadow-[0_-20px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="mx-auto max-w-5xl pb-4">
          <button
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setIsCartOpen((current) => !current)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-inner">
                <ShoppingBag className="h-5 w-5" />
                {totalQty ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black text-white">
                    {totalQty}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{totalQty ? `${totalQty} item` : 'Keranjang Kosong'}</span>
                <span className="block text-lg font-black text-slate-900 tracking-tight">{formatRupiah(total)}</span>
              </div>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
              {isCartOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </span>
          </button>

          {isCartOpen && (
            <div className="mt-5 border-t border-slate-100 pt-5">

              {!isTakeAwayOnly && (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-bold text-slate-900">Tipe Pesanan</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderType('dine_in')}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${orderType === 'dine_in' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      <Utensils className="h-4 w-4" />
                      Dine In
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('take_away')}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${orderType === 'take_away' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      <Package className="h-4 w-4" />
                      Take Away
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-900" htmlFor="customer-name">Nama Anda</label>
                <input
                  className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition focus:border-red-500 focus:bg-white"
                  id="customer-name"
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Masukkan nama pemesan..."
                  value={customerName}
                />
              </div>



              <div className="max-h-60 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
                {cartItems.length ? (
                  cartItems.map((item) => (
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" key={item.menu_id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-sm font-medium text-slate-500">{formatRupiah(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-1">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded bg-white text-slate-600 shadow-sm"
                            onClick={() => changeQuantity(item.menu_id, item.quantity - 1)}
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-bold">{item.quantity}</span>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded bg-white text-slate-600 shadow-sm"
                            onClick={() => changeQuantity(item.menu_id, item.quantity + 1)}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="mt-3 min-h-[60px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-red-400 focus:bg-white"
                        maxLength={500}
                        onChange={(event) => changeNotes(item.menu_id, event.target.value)}
                        placeholder="Catatan opsional..."
                        value={item.notes}
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Keranjang masih kosong</p>
                  </div>
                )}
              </div>

              {fieldError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{fieldError}</p> : null}

              <div className="mt-5">
                <Button
                  className="w-full rounded-full py-4 text-base font-bold shadow-lg"
                  disabled={!cartItems.length}
                  isLoading={isSubmitting}
                  onClick={submitOrder}
                  size="lg"
                >
                  <ReceiptText className="mr-2 h-5 w-5" />
                  Kirim Pesanan Sekarang
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
        title="Ulasan Pelanggan Terbaru"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 pb-2">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">{review.customer_name || 'Pelanggan'}</span>
                  <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">{Number(review.rating).toFixed(1)}</span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs font-medium text-slate-600 leading-relaxed mb-2">{review.comment}</p>
                )}
                <span className="text-[10px] font-bold text-slate-400 block">
                  {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 text-sm py-4">Belum ada ulasan.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
