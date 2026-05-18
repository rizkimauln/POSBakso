import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, RefreshCcw } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingState } from '../../components/common/LoadingState'
import { CartPanel } from '../../components/pos/CartPanel'
import { MenuGrid } from '../../components/pos/MenuGrid'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { categoryService } from '../../services/categoryService'
import { menuService } from '../../services/menuService'
import { orderService } from '../../services/orderService'
import { tableService } from '../../services/tableService'

function normalizeErrors(error) {
  const validationErrors = getValidationErrors(error)

  return {
    table_id: validationErrors.table_id?.[0],
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
  const [lastOrder, setLastOrder] = useState(null)
  const [error, setError] = useState({})
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuLoading, setIsMenuLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const debouncedSearch = useDebounce(filters.search, 300)
  const { showToast } = useToast()

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
      menuService.list({ per_page: 100, is_active: 1 }),
    ])
      .then(([categoryResponse, tableResponse, menuResponse]) => {
        if (!isMounted) {
          return
        }

        setCategories(categoryResponse.data || [])
        setTables(tableResponse.data || [])
        setMenus(menuResponse.data || [])
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

  async function submitOrder() {
    setIsSubmitting(true)
    setError({})
    setLastOrder(null)

    try {
      const order = await orderService.create({
        table_id: Number(selectedTableId),
        items: cartItems.map((item) => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      })

      setLastOrder(order)
      setCartItems([])
      setSelectedTableId('')
      showToast({
        title: `Order #${order.id} berhasil dibuat`,
        description: 'Order sudah masuk antrean dapur.',
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
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="danger">Kasir</Badge>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Order kasir</h2>
          <p className="mt-2 text-sm text-slate-500">
            Pilih meja, tambah menu, atur quantity dan catatan, lalu kirim ke KDS.
          </p>
        </div>
        <Button onClick={loadInitialData} variant="secondary">
          <RefreshCcw className="h-4 w-4" />
          Refresh data
        </Button>
      </div>

      {pageError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {pageError}
        </div>
      ) : null}

      {lastOrder ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Order #{lastOrder.id} berhasil dibuat
                </p>
                <p className="text-sm text-emerald-700">
                  Order sudah masuk antrean dapur dengan status pending.
                </p>
              </div>
            </div>
            <Link className="text-sm font-semibold text-emerald-800" to={`/app/orders/${lastOrder.id}`}>
              Lihat detail order
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <MenuGrid
          categories={categories}
          filters={filters}
          isLoading={isMenuLoading}
          menus={menus}
          onAddItem={addItem}
          onFilterChange={updateFilter}
        />
        <CartPanel
          cartItems={cartItems}
          error={error}
          isSubmitting={isSubmitting}
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
  )
}
