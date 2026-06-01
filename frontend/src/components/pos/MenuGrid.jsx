import { Plus, Search } from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { formatRupiah } from '../../lib/currency'

export function MenuGrid({
  categories,
  filters,
  isLoading,
  menus,
  onAddItem,
  onFilterChange,
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px] lg:items-end">
          <Input
            id="order-menu-search"
            label="Cari menu"
            onChange={(event) => onFilterChange('search', event.target.value)}
            placeholder="Bakso urat, es teh..."
            value={filters.search}
          />
          <Select
            id="order-menu-category"
            label="Kategori"
            onChange={(event) => onFilterChange('category_id', event.target.value)}
            value={filters.category_id}
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="h-40 animate-pulse rounded-xl bg-slate-200" key={index} />
          ))}
        </div>
      ) : menus.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu) => (
            <article
              className="flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              key={menu.id}
            >
              <div>
                <div className="h-32 w-full bg-slate-100">
                  {menu.image_url ? (
                    <img alt="" className="h-full w-full object-cover" src={menu.image_url} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300 font-bold text-xl">
                      {menu.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{menu.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{menu.category?.name || '-'}</p>
                    </div>
                    <Badge tone="success">Aktif</Badge>
                  </div>
                  <p className="mt-3 text-lg font-bold text-slate-950">
                    {formatRupiah(menu.price)}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4">
                <Button className="w-full" onClick={() => onAddItem(menu)} variant="secondary">
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <Search className="h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Menu tidak ditemukan</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Coba kata kunci atau kategori lain.
          </p>
        </div>
      )}
    </section>
  )
}
