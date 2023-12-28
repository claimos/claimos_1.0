import tesseract from "node-tesseract-ocr";

export const imageParse = async (url) => {
  const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
  };
  try {
    const text = await tesseract.recognize(url, config);
    return text;
  } catch (error) {
    console.log(error.message);
  }
};
