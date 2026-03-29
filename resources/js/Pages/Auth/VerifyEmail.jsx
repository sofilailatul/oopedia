import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/TamuLayout';
import StatusModal from '@/Components/StatusModal';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function VerifyEmail({ status }) {
    const { post, processing, errors } = useForm({});

    const [modalState, setModalState] = useState({
        show: false,
        type: 'success',
        title: '',
        message: '',
    });

    useEffect(() => {
        if (!status) return;

        let message = status;
        if (status === 'verification-link-sent') {
            message = 'Tautan verifikasi baru telah dikirim ke email kamu.';
        }

        setModalState({
            show: true,
            type: 'success',
            title: 'Email Verifikasi Dikirim',
            message,
        });
    }, [status]);

    useEffect(() => {
        if (!errors || Object.keys(errors).length === 0) return;

        setModalState({
            show: true,
            type: 'error',
            title: 'Gagal Mengirim Verifikasi',
            message: 'Terjadi kesalahan saat mengirim ulang email verifikasi.',
        });
    }, [errors]);

    const closeModal = () => {
        setModalState((prev) => ({ ...prev, show: false }));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur"
            >
                <div className="mb-4 text-sm text-gray-600">
                    Thanks for signing up! Before getting started, could you verify
                    your email address by clicking on the link we just emailed to
                    you? If you didn't receive the email, we will gladly send you
                    another.
                </div>

                {status === 'verification-link-sent' && (
                    <div className="mb-4 text-sm font-medium text-green-600">
                        A new verification link has been sent to the email address
                        you provided during registration.
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="mt-4 flex items-center justify-between">
                        <PrimaryButton disabled={processing}>
                            Resend Verification Email
                        </PrimaryButton>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Log Out
                        </Link>
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
