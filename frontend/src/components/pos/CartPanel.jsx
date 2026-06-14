import { Minus, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { formatRupiah } from '../../lib/currency'

export function CartPanel({
  cartItems,
  error,
  isSubmitting,
  onChangeNotes,
  onChangeQuantity,
  onRemoveItem,
  onSubmit,
  onTableChange,
  selectedTableId,
  customerName,
  onCustomerNameChange,
  orderType,
  onOrderTypeChange,
  tables,
}) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <aside className="sticky top-4 space-y-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
      <div className="text-center pb-2">
        <h2 className="text-lg font-bold uppercase tracking-wide text-red-700">Cart Kasir</h2>
      </div>

      <div className="space-y-3">
        <Input
          error={error?.customer_name}
          id="customer-name"
          label="Nama Pemesan"
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Masukkan nama"
          value={customerName}
        />
        <Select
          id="order-type"
          label="Tipe Pesanan"
          onChange={(event) => onOrderTypeChange(event.target.value)}
          value={orderType}
        >
          <option value="dine_in">Dine In (Makan di Tempat)</option>
          <option value="take_away">Take Away (Bawa Pulang)</option>
        </Select>

        {orderType === 'dine_in' && (
          <Select
            error={error?.table_id}
            id="order-table"
            label="Pilih meja"
            onChange={(event) => onTableChange(event.target.value)}
            value={selectedTableId}
          >
            <option value="">Pilih meja</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.table_number} · {table.status}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
        {cartItems.length ? (
          cartItems.map((item) => (
            <div className="rounded-lg border border-slate-200 p-3" key={item.menu_id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="text-sm text-slate-500">{formatRupiah(item.price)}</p>
                </div>
                <Button onClick={() => onRemoveItem(item.menu_id)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onChangeQuantity(item.menu_id, item.quantity - 1)}
                    size="sm"
                    variant="secondary"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-slate-950">
                    {item.quantity}
                  </span>
                  <Button
                    onClick={() => onChangeQuantity(item.menu_id, item.quantity + 1)}
                    size="sm"
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold text-slate-950">
                  {formatRupiah(item.price * item.quantity)}
                </p>
              </div>

              <textarea
                className="mt-3 min-h-16 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                maxLength={500}
                onChange={(event) => onChangeNotes(item.menu_id, event.target.value)}
                placeholder="Catatan item"
                value={item.notes}
              />
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Pilih menu untuk mulai membuat order.
          </div>
        )}
      </div>

      {error?.items ? <p className="text-sm font-medium text-red-600">{error.items}</p> : null}
      {error?.message ? <p className="text-sm font-medium text-red-600">{error.message}</p> : null}

      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Total preview</p>
          <p className="text-2xl font-bold text-slate-950">{formatRupiah(total)}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            className="w-full whitespace-nowrap px-2"
            disabled={!cartItems.length}
            isLoading={isSubmitting}
            onClick={() => onSubmit('later')}
            variant="secondary"
          >
            Bayar Nanti
          </Button>
          <Button
            className="w-full whitespace-nowrap px-2"
            disabled={!cartItems.length}
            isLoading={isSubmitting}
            onClick={() => onSubmit('now')}
          >
            <ReceiptText className="mr-2 h-4 w-4" />
            Bayar Sekarang
          </Button>
        </div>
      </div>
    </aside>
  )
}
