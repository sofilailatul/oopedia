import { useState, useEffect, useRef, useCallback } from "react";

// ── localStorage draft helpers ──────────────────────────────────────────────

const DRAFT_KEY_PREFIX = "oopedia_material_draft_";

function getDraftKey(materialId) {
  return `${DRAFT_KEY_PREFIX}${materialId ?? "new"}`;
}

function saveDraft(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...data, _savedAt: Date.now() }));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadDraft(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearDraft(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Strip non-serializable fields (imageFile) from sections for storage */
function serializeSections(sections) {
  return sections.map((s) => ({
    id: s.id,
    title: s.title || "",
    subTopicId: s.subTopicId || "",
    content: s.content || "",
    // previewUrl from existing server images are kept; blob: URLs are not
    previewUrl: s.previewUrl && !s.previewUrl.startsWith("blob:") ? s.previewUrl : null,
  }));
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useDosenMaterialCreate({ authUser, material = null, subTopics = [] }) {
  const materialId = material?.id || null;
  const draftKey = getDraftKey(materialId);

  // Try to restore draft on first render
  const draft = useRef(loadDraft(draftKey)).current;

  const buildInitialSections = () => {
    // If editing existing material with contents, use those as base
    if (material?.contents?.length) {
      return material.contents.map((content) => ({
        id: content.id,
        title: content.title || "",
        subTopicId: content.subtopic_id || "",
        content: content.content_text || "",
        imageFile: null,
        previewUrl: content.image_url || null,
      }));
    }
    return [
      { id: 1, title: "", subTopicId: subTopics?.[0]?.id || "", content: "", imageFile: null, previewUrl: null },
    ];
  };

  // Restore text fields from draft if available (only for create / same material)
  const initialTitle = draft?.title ?? material?.material_name ?? "";
  const initialDescription = draft?.description ?? material?.description ?? "";
  const initialSections = draft?.sections?.length
    ? draft.sections.map((s) => ({
        ...s,
        imageFile: null, // can't restore File from localStorage
        previewUrl: s.previewUrl || null,
      }))
    : buildInitialSections();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [sections, setSections] = useState(initialSections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(!!draft);

  const creatorName = authUser?.name || authUser?.nama || "-";

  // ── Auto-save draft (debounced 800ms) ───────────────────────────────────
  const saveTimerRef = useRef(null);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(draftKey, {
        title,
        description,
        sections: serializeSections(sections),
      });
    }, 800);
  }, [title, description, sections, draftKey]);

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scheduleSave]);

  // Dismiss "draft restored" banner after 5 seconds
  useEffect(() => {
    if (!draftRestored) return;
    const t = setTimeout(() => setDraftRestored(false), 5000);
    return () => clearTimeout(t);
  }, [draftRestored]);

  // ── Actions ─────────────────────────────────────────────────────────────

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: Date.now(), title: "", subTopicId: subTopics?.[0]?.id || "", content: "", imageFile: null, previewUrl: null },
    ]);
  }

  function updateSectionField(id, field, value) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function updateSectionImage(id, payload) {
    const file = payload?.file !== undefined ? payload.file : payload;
    const previewUrl = payload?.previewUrl || (file ? URL.createObjectURL(file) : null);

    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

        if (s.previewUrl && typeof s.previewUrl === "string" && s.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(s.previewUrl);
        }

        return {
          ...s,
          imageFile: file,
          previewUrl: previewUrl,
        };
      }),
    );
  }

  function discardDraft() {
    clearDraft(draftKey);
    setDraftRestored(false);
  }

  async function publish(e, options = {}) {
    const role = (authUser?.role || "").toLowerCase();
    const baseRole = role === "superadmin" ? "superadmin" : "dosen";
    const defaultEndpoint = baseRole === "superadmin" ? "/superadmin/materi" : "/dosen/materi";
    const updateEndpoint = materialId ? `${defaultEndpoint}/${materialId}` : defaultEndpoint;

    const { onSuccess, onError, endpoint = defaultEndpoint, extra = {} } = options;

    if (e?.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("material_name", title || "Untitled Learning Material");
    if (description) formData.append("description", description);

    if (materialId) {
      formData.append("_method", "put");
      formData.append("order_number", material?.order_number || 1);
    }

    sections.forEach((s, index) => {
      if (s.title) formData.append(`sections[${index}][title]`, s.title);
      if (s.subTopicId) formData.append(`sections[${index}][subtopic_id]`, s.subTopicId);
      if (s.content) formData.append(`sections[${index}][content_text]`, s.content);
      if (s.imageFile) {
        formData.append(`sections[${index}][image]`, s.imageFile);
      }
    });

    Object.entries(extra || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    try {
      const targetEndpoint = materialId ? updateEndpoint : endpoint;
      await window.axios.post(targetEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Clear draft on successful publish
      clearDraft(draftKey);

      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (error) {
      if (typeof onError === "function") {
        onError(error.response?.data?.errors || { message: error.response?.data?.message || "Terjadi kesalahan" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    state: { title, description, sections, isSubmitting, creatorName, subTopics, materialId, draftRestored },
    actions: {
      setTitle,
      setDescription,
      addSection,
      updateSectionField,
      updateSectionImage,
      discardDraft,
      publish,
    },
  };
}
