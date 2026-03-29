import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/TamuLayout';
import StatusModal from '@/Components/StatusModal';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ConfirmPassword({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const [modalState, setModalState] = useState({
        show: false,
        type: 'success',
        title: '',
        message: '',
    });

    useEffect(() => {
        if (!status) return;

        setModalState({
            show: true,
            type: 'success',
            title: 'Berhasil',
            message: status,
        });
    }, [status]);

    useEffect(() => {
        if (Object.keys(errors).length === 0) return;

        let message = 'Konfirmasi password gagal. Pastikan password yang kamu masukkan sudah benar.';
        if (errors.password) {
            message = errors.password;
        }

        setModalState({
            show: true,
            type: 'error',
            title: 'Konfirmasi Gagal',
            message,
        });
    }, [errors]);

    const closeModal = () => {
        setModalState((prev) => ({ ...prev, show: false }));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur"
            >
                <div className="mb-4 text-sm text-gray-600">
                    This is a secure area of the application. Please confirm your
                    password before continuing.
                </div>

                <form onSubmit={submit}>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                        <PrimaryButton className="ms-4" disabled={processing}>
                            Confirm
                        </PrimaryButton>
                    </div>
                </form>
            </motion.div>
            <StatusModal
                show={modalState.show}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onClose={closeModal}
                onConfirm={closeModal}
            />
        </GuestLayout>
    );
}
