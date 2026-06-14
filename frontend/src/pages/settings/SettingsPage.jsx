import { useEffect, useState } from 'react'
import { Save, UploadCloud, AlertCircle } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { LoadingState } from '../../components/common/LoadingState'
import { settingService } from '../../services/settingService'
import { useToast } from '../../hooks/useToast'
import { getApiMessage } from '../../lib/api'

export function SettingsPage() {
  const [qrisImage, setQrisImage] = useState(null)
  const [qrisFile, setQrisFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    let isMounted = true

    settingService.getPublicSettings()
      .then((settings) => {
        if (isMounted && settings.qris_image_url) {
          setQrisImage(settings.qris_image_url)
        }
      })
      .catch((err) => {
        if (isMounted) setError(getApiMessage(err, 'Gagal memuat pengaturan.'))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setQrisFile(e.target.files[0])
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!qrisFile) return

    setIsUploading(true)
    setError('')

    try {
      const result = await settingService.uploadQris(qrisFile)
      setQrisImage(result.qris_image_url)
      setQrisFile(null)
      showToast({ title: 'QRIS berhasil diperbarui', tone: 'success' })
    } catch (err) {
      setError(getApiMessage(err, 'Gagal mengunggah QRIS.'))
      showToast({ title: 'Gagal mengunggah', tone: 'danger' })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Memuat pengaturan..." />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola konfigurasi global untuk aplikasi POS Bakso.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-1.5 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="mt-1 text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Pengaturan QRIS</h2>
        <p className="text-sm text-slate-500 mb-6">
          Unggah gambar kode QRIS untuk pembayaran Take Away pelanggan.
        </p>

        <form onSubmit={handleUpload} className="space-y-5">
          <div className="flex items-start gap-6">
            <div className="w-48 h-48 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
              {qrisFile ? (
                <img src={URL.createObjectURL(qrisFile)} alt="QRIS Preview" className="w-full h-full object-contain" />
              ) : qrisImage ? (
                <img src={qrisImage} alt="Current QRIS" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-slate-400">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-xs font-medium">Belum ada QRIS</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <label className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:bg-slate-50 transition">
                {qrisFile ? qrisFile.name : 'Pilih File Gambar QRIS'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-slate-500">Maksimal ukuran file 2MB. Format: JPG, PNG, WEBP.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              disabled={!qrisFile}
              isLoading={isUploading}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan QRIS Baru
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
