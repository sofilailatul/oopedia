import InputError from '@/Components/InputError';
import Button from '@/Components/Button';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/TamuLayout';
import StatusModal from '@/Components/StatusModal';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const [modalState, setModalState] = useState({
        show: false,
        type: 'success',
        title: '',
        message: '',
    });

    useEffect(() => {
        if (!status) return;

        let message = status;
        const lower = String(status).toLowerCase();
        if (lower.includes('password reset link sent')) {
            message = 'Kami sudah mengirimkan tautan reset password ke email kamu.';
        }

        setModalState({
            show: true,
            type: 'success',
            title: 'Email Terkirim',
            message,
        });
    }, [status]);

    useEffect(() => {
        if (Object.keys(errors).length === 0) return;

        let message = 'Gagal mengirim tautan reset password. Pastikan email sudah benar.';
        if (errors.email) {
            message = errors.email;
        }

        setModalState({
            show: true,
            type: 'error',
            title: 'Gagal Mengirim Email',
            message,
        });
    }, [errors]);

    const closeModal = () => {
        setModalState((prev) => ({ ...prev, show: false }));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur"
            >
                <div className="mb-4 text-sm text-gray-600">
                    Forgot your password? No problem. Just let us know your email
                    address and we will email you a password reset link that will
                    allow you to choose a new one.
                </div>

                <form onSubmit={submit}>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />

                    <div className="mt-4 flex items-center justify-end">
                        <Button className="ms-4" disabled={processing}>
                            Email Password Reset Link
                        </Button>
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
