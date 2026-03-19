import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import Button from '@/Components/Button';
import Field from '@/Components/Field';

export default function CreateClassModal({ 
  show, 
  onClose, 
  lecturerName, 
  onSuccess 
}) {
    const [name, setName] = useState('');
    const [classCode, setClassCode] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError('');
        try {
            await window.axios.post('/classes', {
                class_name: name,
                class_code: classCode,
                description,
            });
            
            // Reset form saat berhasil
            setName('');
            setClassCode('');
            setDescription('');

            onSuccess?.();
            onClose?.();
        } catch (err) {
            setError('Gagal menyimpan kelas. Coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Tambah Kelas Baru</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <p className="text-[11px] font-medium text-slate-500">Nama Dosen</p>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500 mr-1">
                                👤
                            </span>
                            <span className="truncate">{lecturerName}</span>
                        </div>
                    </div>

                    <Field
                        label="Nama Kelas"
                        as="input"
                        placeholder="Masukkan Nama Kelas"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <Field
                        label="Kode Kelas"
                        as="input"
                        placeholder="Masukkan Kode Kelas (contoh: IF101A)"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        required
                    />

                    <Field
                        label="Deskripsi"
                        as="textarea"
                        placeholder="Deskripsi Kelas"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                        <Button
                            type="button"
                            color="red"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            color="green"
                            variant="solid"
                            size="sm"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
