import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Star, MapPin, Clock, ArrowRight } from 'lucide-react'
import { customerService } from '../services/customerService'
import { LoadingState } from '../components/common/LoadingState'

export function HomePage() {
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      customerService.listTables(),
      customerService.listReviews()
    ]).then(([tablesData, reviewsData]) => {
      setTables(tablesData)
      setReviews(reviewsData)
    }).catch(error => {
      console.error('Gagal memuat data:', error)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <LoadingState label="Memuat halaman..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f2] font-sans">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-amber-950/5 bg-[#fffdf9]/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img alt="POS Bakso" className="h-10 w-auto object-contain" src="/images/Logo Red 1.png" />
            <span className="text-xl font-bold text-red-700 tracking-tight">POS Bakso</span>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 py-20 text-center text-white sm:py-32">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-slate-950"></div>
          
          <div className="relative mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
              Cek Status Meja & Rating POS Bakso
            </h1>
            <p className="mb-10 text-lg font-medium text-slate-300 sm:text-xl">
              Lihat ketersediaan meja kosong secara real-time sebelum Anda berkunjung, dan baca ulasan dari pelanggan setia kami.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#cek-meja"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/20"
              >
                <MapPin className="h-5 w-5" />
                Cek Meja Kosong
              </a>
            </div>
          </div>
        </section>

        {/* Info Meja Kosong Section */}
        <section id="cek-meja" className="py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-red-600">Info Ketersediaan</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Status Meja Saat Ini</h2>
              <p className="mt-3 text-lg text-slate-600">Cek meja yang tersedia sebelum Anda berkunjung</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {tables.map(table => (
                <div 
                  key={table.id} 
                  className={`flex flex-col items-center justify-center rounded-3xl border-2 p-6 transition-all duration-300 ${
                    table.status === 'kosong' 
                      ? 'border-green-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-green-300' 
                      : 'border-slate-100 bg-slate-50 opacity-70 grayscale'
                  }`}
                >
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${table.status === 'kosong' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    <span className="text-2xl font-black">{table.table_number}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${table.status === 'kosong' ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {table.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial / Feedback Section */}
        <section className="bg-white py-20 px-4 border-t border-slate-100">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-red-600">Testimonial</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Apa Kata Pelanggan Kami?</h2>
              <p className="mt-3 text-lg text-slate-600">Feedback asli dari pelanggan setia POS Bakso</p>
            </div>

            {reviews.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map(review => (
                  <div key={review.id} className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-8 shadow-sm transition hover:shadow-md">
                    <div className="mb-5 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} 
                        />
                      ))}
                    </div>
                    <p className="mb-8 text-slate-700 leading-relaxed italic text-lg">
                      "{review.comment || 'Makanan sangat enak dan pelayanan memuaskan!'}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800 font-bold text-white shadow-inner">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{review.customer_name}</p>
                        <p className="text-sm text-slate-500">Pelanggan POS Bakso</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-500">
                <p className="text-lg">Belum ada ulasan.</p>
                <p className="mt-1 text-sm">Rating dari pelanggan akan ditampilkan di sini.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-12 text-center text-slate-400">
        <div className="mx-auto max-w-5xl px-4">
          <p className="font-medium">© {new Date().getFullYear()} POS Bakso. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
