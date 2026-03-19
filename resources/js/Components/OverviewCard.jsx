import React from 'react';
import { Link } from '@inertiajs/react';
import Icons from '@/icons';

export default function OverviewCard({ 
    href, 
    badge, 
    title, 
    actionText = "Kelola" 
}) {
    return (
        <Link
            href={href}
            className="group block bg-white border border-slate-200/60 p-5 md:p-6 rounded-3xl shadow-sm hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[180px]"
        >
            <div className="flex flex-col h-full justify-between">
                <div>
                    {badge && (
                        <div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-[10px] uppercase font-bold tracking-widest rounded-full mb-3">
                            {badge}
                        </div>
                    )}
                    <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                        {title}
                    </h3>
                </div>
                <div className="mt-6 flex items-center justify-between text-slate-400">
                    <span className="text-sm font-bold group-hover:text-slate-900 transition-colors">
                        {actionText}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                        <Icons.ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
