import { useState } from "react";
import { router } from "@inertiajs/react";

export function useDosenMaterialEdit({ material, authUser, subTopics = [] }) {
  const [title, setTitle] = useState(material?.material_name || "");
  const [description, setDescription] = useState(material?.description || "");
  const [orderNumber, setOrderNumber] = useState(material?.order_number || 1);

  const [sections, setSections] = useState(
    (material?.contents || []).map((c) => ({
      id: c.id,
      title: c.title || "",
      subTopicId: c.subtopic_id ? String(c.subtopic_id) : "",
      content: c.content_text || "",
      imagePath: c.image_path || null,
      previewUrl: c.image_url || null,
      imageFile: null,
      isNew: false,
    })),
  );

  const creatorName = authUser?.name || authUser?.nama || "-";

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: null,
        title: "",
        subTopicId: subTopics?.[0]?.id ? String(subTopics[0].id) : "",
        content: "",
        imagePath: null,
        previewUrl: null,
        imageFile: null,
        isNew: true,
      },
    ]);
  }

  function updateSectionField(index, field, value) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function updateSectionImage(index, payload) {
    const file = payload?.file !== undefined ? payload.file : payload;
    const previewUrl = payload?.previewUrl || (file ? URL.createObjectURL(file) : null);

    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;

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

  function saveMaterial(options = {}) {
    const { onSuccess, onError } = options;

    const role = (authUser?.role || "").toLowerCase();
    const baseRole = role === "superadmin" ? "superadmin" : "dosen";
    const basePath = baseRole === "superadmin" ? "/superadmin/materi" : "/dosen/materi";

    const payloadSections = sections.map((s) => ({
      id: s.id,
      title: s.title,
      subtopic_id: s.subTopicId ? Number(s.subTopicId) : null,
      sub_topic: null,
      content_text: s.content,
      image: s.imageFile || null,
    }));

    router.post(
      `${basePath}/${material.id}`,
      {
        _method: "put",
        material_name: title || "Untitled Learning Material",
        description,
        order_number: Number(orderNumber) || 1,
        sections: payloadSections,
      },
      {
        forceFormData: true,
        onSuccess: () => {
          if (typeof onSuccess === "function") {
            onSuccess();
            return;
          }
          router.visit(`${basePath}/${material.id}`);
        },
        onError: (errors) => {
          if (typeof onError === "function") {
            onError(errors);
          }
        },
      },
    );
  }

  function deleteSection(index) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  return {
    state: { title, description, orderNumber, sections, creatorName },
    actions: {
      setTitle,
      setDescription,
      setOrderNumber,
      addSection,
      updateSectionField,
      updateSectionImage,
      saveMaterial,
      deleteSection,
    },
  };
}
