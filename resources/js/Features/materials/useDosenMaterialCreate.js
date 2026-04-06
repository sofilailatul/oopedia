import { useState } from "react";

export function useDosenMaterialCreate({ authUser, material = null, subTopics = [] }) {
  const [title, setTitle] = useState(material?.material_name || "");
  const [description, setDescription] = useState(material?.description || "");
  const [sections, setSections] = useState([
    ...(material?.contents?.length
      ? material.contents.map((content) => ({
          id: content.id,
          title: content.title || "",
          subTopicId: content.subtopic_id || "",
          content: content.content_text || "",
          imageFile: null,
          previewUrl: content.image_url || null,
        }))
      : [
          { id: 1, title: "", subTopicId: subTopics?.[0]?.id || "", content: "", imageFile: null, previewUrl: null },
        ]),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creatorName = authUser?.name || authUser?.nama || "-";

  const materialId = material?.id || null;

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
    state: { title, description, sections, isSubmitting, creatorName, subTopics, materialId },
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
