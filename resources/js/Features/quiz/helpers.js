const STATUS_THEME = {
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-rose-100 text-rose-600",
    active: "bg-amber-100 text-amber-700",
};

export function statusLabel(quiz) {
    if (quiz?.is_completed || quiz?.status === "completed" || quiz?.completed_at) {
        return "Selesai";
    }
    return "Belum Dikerjakan";
}

export function statusTone(quiz) {
    if (quiz?.is_completed || quiz?.status === "completed" || quiz?.completed_at) {
        return STATUS_THEME.completed;
    }
    if (quiz?.status === "active") {
        return STATUS_THEME.active;
    }
    return STATUS_THEME.pending;
}

export function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function formatDuration(minutes) {
    if (!minutes) return "-";
    return `${minutes} Menit`;
}

export function resolveQuizDetails(quiz) {
    return {
        question_type: quiz?.question_type_label || quiz?.question_type || "Multiple Choice",
        deadline: formatDate(quiz?.end_at || quiz?.deadline),
        duration: formatDuration(quiz?.duration),
        question_count: quiz?.question_count ?? quiz?.total_questions ?? "-",
        score_label: quiz?.score_label || quiz?.score || "Belum Dikerjakan",
    };
}

export function getTeacherName(quiz) {
    return quiz?.creator?.name || quiz?.teacher_name || "Dosen";
}

export function formatTimer(seconds) {
    if (seconds == null) return "00.00";
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(minutes).padStart(2, "0")}.${String(secs).padStart(2, "0")}`;
}

export function resolveOptionLabel(option) {
    return option?.option_text || option?.text || option?.label || "Opsi";
}

export function resolveQuestionText(question) {
    return question?.quiz_text || question?.text || "Pertanyaan";
}
