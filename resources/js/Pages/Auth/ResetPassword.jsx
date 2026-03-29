import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/TamuLayout';
import StatusModal from '@/Components/StatusModal';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ResetPassword({ token, email, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
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
        if (lower.includes('password has been reset')) {
            message = 'Password kamu berhasil direset. Silakan login dengan password baru.';
        }

        setModalState({
            show: true,
            type: 'success',
            title: 'Reset Password Berhasil',
            message,
        });
    }, [status]);

    useEffect(() => {
        if (Object.keys(errors).length === 0) return;

        let message = 'Reset password gagal. Silakan periksa kembali data yang kamu isi.';
        if (errors.email) {
            message = errors.email;
        } else if (errors.password) {
            message = errors.password;
        } else if (errors.password_confirmation) {
            message = errors.password_confirmation;
        }

        setModalState({
            show: true,
            type: 'error',
            title: 'Reset Password Gagal',
            message,
        });
    }, [errors]);

    const closeModal = () => {
        setModalState((prev) => ({ ...prev, show: false }));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onSuccess: () => {
                reset('password', 'password_confirmation');
                setModalState({
                    show: true,
                    type: 'success',
                    title: 'Reset Password Berhasil',
                    message: 'Password kamu berhasil direset. Silakan login dengan password baru.',
                });
            },
            onError: () => {
                // detail pesan di-handle oleh useEffect errors
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur"
            >
                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="email" value="Email" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                        />

                        <TextInput
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                        <PrimaryButton className="ms-4" disabled={processing}>
                            Reset Password
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
