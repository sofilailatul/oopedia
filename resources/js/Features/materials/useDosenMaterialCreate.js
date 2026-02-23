import { useState } from "react";
import { router } from "@inertiajs/react";

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

  async function publish(e) {
    if (e?.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const payloadSections = sections.map((s) => ({
      title: s.title,
      content_text: s.content,
      image: s.imageFile || null,
    }));

    router.post(
      "/dosen/materi",
      {
        material_name: title || "Untitled Learning Material",
        description,
        sections: payloadSections,
      },
      {
        forceFormData: true,
        onFinish: () => setIsSubmitting(false),
      },
    );
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
