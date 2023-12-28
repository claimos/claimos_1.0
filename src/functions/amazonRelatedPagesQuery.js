import { getAmazonProductPage } from "./amazonProductPageQuery.js";

export const getAmazonRelatedPages = async (
  productUrl,
  getAsin,
  getInfo,
  getImageUrls,
  getImageData,
  imageDownloadSizes,
  getDownloadedImages,
  getProductAbout,
  getProductPrice,
  getProductSavings,
  getProductDescription,
  getProductName,
  getSellerName,
  getProductFullDescription,
  getProductDetails,
  getImportantInformation,
  getProductInfo,
  getRelatedProducts,
  getRelatedProductsLimit,
  getRelatedProductsPageLimit,
  getCustomReviews,
  getRatingScore,
  getReviewsAmount,
  getAnswersAmount,
  setCountryCode,
  getCountryCode,
  getLanguageCode,
  byAsin,
  getManufactureName,
  getReviewData,
  getReviewDataLimit,
  getReviewDataFilters,
  getAmazonChoice,
  getProductInfoFormatted
) => {
  let singleProduct = await getAmazonProductPage(
    productUrl,
    getAsin,
    getInfo,
    getImageUrls,
    getImageData,
    imageDownloadSizes,
    getDownloadedImages,
    getProductAbout,
    getProductPrice,
    getProductSavings,
    getProductDescription,
    getProductName,
    getSellerName,
    getProductFullDescription,
    getProductDetails,
    getImportantInformation,
    getProductInfo,
    getRelatedProducts,
    getRelatedProductsLimit,
    getCustomReviews,
    getRatingScore,
    getReviewsAmount,
    getAnswersAmount,
    setCountryCode,
    getCountryCode,
    getLanguageCode,
    byAsin,
    getManufactureName,
    getReviewData,
    getReviewDataLimit,
    getReviewDataFilters,
    false,
    getAmazonChoice,
    getProductInfoFormatted,
    false
  );

  if (
    Object.keys(singleProduct).length > 0 &&
    singleProduct.relatedProducts.length > 0
  ) {
    for (let i = 0; i < getRelatedProductsPageLimit; i++) {
      const singleRelatedPageUrl =
        singleProduct.relatedProducts[i].productUrl ||
        `https://www.amazon.com/dp/${singleProduct.relatedProducts[i].asin}`;

      // console.log(singleRelatedPageUrl);

      if (singleRelatedPageUrl) {
        const singleRelatedProductPage = await getAmazonProductPage(
          singleRelatedPageUrl,
          getAsin,
          getInfo,
          getImageUrls,
          getImageData,
          imageDownloadSizes,
          getDownloadedImages,
          getProductAbout,
          getProductPrice,
          getProductSavings,
          getProductDescription,
          getProductName,
          getSellerName,
          getProductFullDescription,
          getProductDetails,
          getImportantInformation,
          getProductInfo,
          false,
          0,
          getCustomReviews,
          getRatingScore,
          getReviewsAmount,
          getAnswersAmount,
          setCountryCode,
          getCountryCode,
          getLanguageCode,
          false,
          getManufactureName,
          getReviewData,
          getReviewDataLimit,
          getReviewDataFilters,
          false,
          getAmazonChoice,
          getProductInfoFormatted,
          false
        );

        singleProduct.relatedProducts[i]["relatedProductPage"] =
          singleRelatedProductPage;
      } else {
      }
    }
  }
  return singleProduct;
};
