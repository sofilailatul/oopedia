import { useState } from "react";

export function useDosenMaterialCreate({ authUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState([
    { id: 1, title: "", content: "", imageFile: null, previewUrl: null },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creatorName = authUser?.name || authUser?.nama || "-";

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: Date.now(), title: "", content: "", imageFile: null, previewUrl: null },
    ]);
  }

  function updateSectionField(id, field, value) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function updateSectionImage(id, file) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

        if (s.previewUrl) {
          URL.revokeObjectURL(s.previewUrl);
        }

        return {
          ...s,
          imageFile: file,
          previewUrl: file ? URL.createObjectURL(file) : null,
        };
      }),
    );
  }

  async function publish(e, options = {}) {
    const role = (authUser?.role || "").toLowerCase();
    const baseRole = role === "superadmin" ? "superadmin" : "dosen";
    const defaultEndpoint = baseRole === "superadmin" ? "/superadmin/materi" : "/dosen/materi";

    const { onSuccess, onError, endpoint = defaultEndpoint, extra = {} } = options;

    if (e?.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("material_name", title || "Untitled Learning Material");
    if (description) formData.append("description", description);

    sections.forEach((s, index) => {
      if (s.title) formData.append(`sections[${index}][title]`, s.title);
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
      await window.axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
    state: { title, description, sections, isSubmitting, creatorName },
    actions: {
      setTitle,
      setDescription,
      addSection,
      updateSectionField,
      updateSectionImage,
      publish,
    },
  };
}
