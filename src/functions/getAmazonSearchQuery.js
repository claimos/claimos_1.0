import { getAmazonProductSearchList } from "./amazonSearchQuery.js";
import { getAmazonProductPage } from "./amazonProductPageQuery.js";

export const getAmazonProductSearch = async (
  productKeyword,
  getNumProducts,
  productPageLimit,
  getProductImageLink,
  getProductName,
  getProductIsSponsored,
  getProductID,
  getProductSellerName,
  getSellerName,
  getSearchProductDescription,
  getProductUrl,
  getSingleProduct,
  getPrice,
  setCountryCode,
  getLanguageCode,
  byAsin,
  getProductRatingScore,
  getProductReviewsAmount,
  priceMin,
  priceMax,
  currency,
  bySeller,
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
  getCountryCode
) => {
  const items = await getAmazonProductSearchList(
    productKeyword,
    getNumProducts,
    getProductImageLink,
    getProductName,
    getProductIsSponsored,
    getProductID,
    getProductSellerName,
    getSearchProductDescription,
    getProductUrl,
    getSingleProduct,
    getPrice,
    setCountryCode,
    getLanguageCode,
    getProductRatingScore,
    getProductReviewsAmount,
    priceMin,
    priceMax,
    currency,
    bySeller,
    getAsin
  );
  for (let i = 0; i < productPageLimit; i++) {
    if (items[i].productUrl) {
      // console.log(items[i].productUrl);

      const product = await getAmazonProductPage(
        items[i].productUrl,
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
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
      );
      items[i].singleProduct = product;
    }

    // console.log(items[i]);
    // console.log(items.length);s
  }
  return items;
};
