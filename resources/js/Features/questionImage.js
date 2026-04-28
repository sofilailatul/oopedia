export function createImagePayload(file) {
  if (!file || !(file instanceof Blob || file instanceof File)) {
    return {
      file: null,
      previewUrl: null,
      removeImage: true,
    };
  }

  return {
    file,
    previewUrl: URL.createObjectURL(file),
    removeImage: false,
  };
}

export function updateQuestionImage(questions, questionIndex, payload) {
  return questions.map((question, index) => {
    if (index !== questionIndex) return question;

    const file = (payload instanceof Blob || payload instanceof File) 
      ? payload 
      : (payload?.file ?? null);
    const previewUrl = payload?.previewUrl ?? null;
    const removeImage = !!payload?.removeImage;

    if (removeImage) {
      return {
        ...question,
        imageFile: null,
        imageUrl: null,
        image_url: null,
        image_path: null,
        remove_image: true,
      };
    }

    if (file) {
      return {
        ...question,
        imageFile: file,
        imageUrl: previewUrl,
        image_url: null,
        remove_image: false,
      };
    }

    return question;
  });
}

export function appendQuestionImageToFormData(formData, question, index) {
  formData.append(
    `questions[${index}][remove_image]`,
    question.remove_image ? "1" : "0",
  );

  if (question.imageFile) {
    formData.append(`questions[${index}][image]`, question.imageFile);
  }
}

export function normalizeQuestionImage(question, fallback = {}) {
  return {
    imageUrl:
      question.image_url ??
      question.imageUrl ??
      question.image_path ??
      fallback.imageUrl ??
      null,
    image_url: question.image_url ?? null,
    image_path: question.image_path ?? null,
    imageFile: null,
    remove_image: false,
  };
}