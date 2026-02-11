// resources/js/Pages/Practices/Components/PracticeCard.jsx

import React from 'react';
import Card from '@/Components/Card';
import Button from '@/Components/Button';

export default function PracticeCard({ practice, onClick }) {
  const hasActiveAttempt = Boolean(practice?.has_active_attempt);

  return (
    <Card className="rounded-2xl shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          {practice.material_name}
        </h2>
        <p className="mt-2 text-slate-500 text-[12px]">
          Latihan soal untuk materi{" "}
          <span className="font-semibold text-slate-700">
            "{practice.material_name}"
          </span>
        </p>
      </div>

      <Button
        variant="solid"
        color={hasActiveAttempt ? "yellow" : "blue"}
        onClick={() => onClick(practice)}
      >
        {hasActiveAttempt ? "Lanjutkan mengerjakan" : "Start Practice"}
      </Button>
    </Card>
  );
}