import { Outlet } from 'react-router-dom'
import { Beef, ChefHat, ClipboardList, ReceiptText } from 'lucide-react'

const checkpoints = [
  { label: 'Order masuk', value: 'Live', icon: ClipboardList },
  { label: 'Dapur', value: 'KDS', icon: ChefHat },
  { label: 'Kasir', value: 'Checkout', icon: ReceiptText },
]

export function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-10">
        <Outlet />
      </section>
      <section className="hidden bg-[#af101a] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
            <Beef className="h-6 w-6" />
          </span>
          <div>
            <p className="font-bold">POS Bakso</p>
            <p className="text-sm text-red-100">Fast service, clean operations</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase text-red-100">Warung Bakso POS</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Kendali operasional yang cepat dibaca dari kasir sampai dapur.
          </h1>
          <p className="mt-5 text-base leading-7 text-red-50">
            Tampilan dirancang untuk shift sibuk: status jelas, tombol mudah dijangkau,
            dan alur kerja tetap rapi.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {checkpoints.map((item) => (
              <div className="rounded-xl bg-white/10 p-4" key={item.label}>
                <item.icon className="h-5 w-5 text-red-100" />
                <p className="mt-4 text-xs text-red-100">{item.label}</p>
                <p className="mt-1 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
