import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { LoadingState } from '../../components/common/LoadingState'
import { CartPanel } from '../../components/pos/CartPanel'
import { MenuGrid } from '../../components/pos/MenuGrid'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { categoryService } from '../../services/categoryService'
import { menuService } from '../../services/menuService'
import { orderService } from '../../services/orderService'
import { tableService } from '../../services/tableService'

function normalizeErrors(error) {
  const validationErrors = getValidationErrors(error)

  return {
    table_id: validationErrors.table_id?.[0],
    customer_name: validationErrors.customer_name?.[0],
    items: validationErrors.items?.[0],
    message: getApiMessage(error, ''),
  }
}

export function CashierOrderPage() {
  const [categories, setCategories] = useState([])
  const [menus, setMenus] = useState([])
  const [tables, setTables] = useState([])
  const [filters, setFilters] = useState({ search: '', category_id: '' })
  const [selectedTableId, setSelectedTableId] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
  const [error, setError] = useState({})
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuLoading, setIsMenuLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const debouncedSearch = useDebounce(filters.search, 300)
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get('editId')

  async function loadInitialData() {
    setIsLoading(true)
    setPageError('')

    try {
      const [categoryResponse, tableResponse, menuResponse] = await Promise.all([
        categoryService.list({ per_page: 100 }),
        tableService.list({ per_page: 100 }),
        menuService.list({ per_page: 100, is_active: 1 }),
      ])

      setCategories(categoryResponse.data || [])
      setTables(tableResponse.data || [])
      setMenus(menuResponse.data || [])
    } catch (requestError) {
      setPageError(getApiMessage(requestError, 'Data order kasir gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      categoryService.list({ per_page: 100 }),
      tableService.list({ per_page: 100 }),
    ])
      .then(([categoryResponse, tableResponse]) => {
        if (!isMounted) {
          return
        }

        setCategories(categoryResponse.data || [])
        setTables(tableResponse.data || [])
      })
      .catch((requestError) => {
        if (isMounted) {
          setPageError(getApiMessage(requestError, 'Data order kasir gagal dimuat.'))
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
  }, [])

  useEffect(() => {
    if (editId) {
      orderService.getInvoice(editId).then((order) => {
        setSelectedTableId(order.table_id.toString())
        setCustomerName(order.customer_name || '')
        setCartItems(
          order.items.map(item => ({
            menu_id: item.menu_id,
            name: item.menu?.name || `Menu #${item.menu_id}`,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        )
      }).catch(() => {
        setPageError('Gagal memuat data pesanan untuk diubah.')
      })
    }
  }, [editId])

  useEffect(() => {
    let isMounted = true

    menuService
      .list({
        per_page: 100,
        is_active: 1,
        search: debouncedSearch,
        category_id: filters.category_id,
      })
      .then((response) => {
        if (isMounted) {
          setMenus(response.data || [])
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setPageError(getApiMessage(requestError, 'Menu gagal dimuat.'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsMenuLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, filters.category_id])

  useAutoRefresh(async () => {
    try {
      const [categoryResponse, tableResponse, menuResponse] = await Promise.all([
        categoryService.list({ per_page: 100 }),
        tableService.list({ per_page: 100 }),
        menuService.list({
          per_page: 100,
          is_active: 1,
          search: debouncedSearch,
          category_id: filters.category_id,
        }),
      ])
      setCategories(categoryResponse.data || [])
      setTables(tableResponse.data || [])
      setMenus(menuResponse.data || [])
    } catch {
      // Keep the current POS data while a background refresh fails.
    }
  })

  function updateFilter(name, value) {
    setIsMenuLoading(true)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function addItem(menu) {
    setLastOrder(null)
    setError({})
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

  async function submitOrder(type) {
    setIsSubmitting(true)
    setError({})
    setLastOrder(null)

    try {
      const payload = {
        table_id: Number(selectedTableId),
        customer_name: customerName,
        items: cartItems.map((item) => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      }

      let order;
      if (editId) {
        order = await orderService.update(editId, payload)
      } else {
        order = await orderService.create(payload)
      }

      if (type === 'now') {
        navigate(`/app/checkout?orderId=${order.id}`)
        return
      }

      setLastOrder(order)
      setCartItems([])
      setSelectedTableId('')
      setCustomerName('')
      if (editId) {
        navigate('/app/orders', { replace: true })
      }

      showToast({
        title: `Order ${String(order.id).padStart(4, '0')} berhasil ${editId ? 'diperbarui' : 'dibuat'}`,
        description: 'Pesanan tersimpan di menu pembayaran.',
        tone: 'success',
      })
      await loadInitialData()
    } catch (requestError) {
      setError(normalizeErrors(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Memuat order kasir..." />
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-6">

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-1.5 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="mt-1 text-sm font-medium text-red-800">{pageError}</p>
          </div>
        </div>
      ) : null}

      {lastOrder ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm transition-all">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-900">
                  Order {String(lastOrder.id).padStart(4, '0')} berhasil {editId ? 'diperbarui' : 'dibuat'}
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Pesanan tersimpan dan siap diproses ke pembayaran.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              to={`/app/orders/${lastOrder.id}`}
            >
              Lihat Detail Pesanan
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] flex-1 min-h-0">
        <div className="overflow-y-auto pr-2 pb-4">
          <MenuGrid
            categories={categories}
            filters={filters}
            isLoading={isMenuLoading}
            menus={menus}
            onAddItem={addItem}
            onFilterChange={updateFilter}
          />
        </div>
        <div className="overflow-y-auto pr-2 pb-4">
          <CartPanel
            cartItems={cartItems}
            error={error}
            isSubmitting={isSubmitting}
            customerName={customerName}
            onCustomerNameChange={(val) => {
              setError({})
              setCustomerName(val)
            }}
            onChangeNotes={changeNotes}
            onChangeQuantity={changeQuantity}
            onRemoveItem={(menuId) =>
              setCartItems((current) => current.filter((item) => item.menu_id !== menuId))
            }
            onSubmit={submitOrder}
            onTableChange={(tableId) => {
              setError({})
              setSelectedTableId(tableId)
            }}
            selectedTableId={selectedTableId}
            tables={tables}
          />
        </div>
      </div>
    </div>
  )
}
