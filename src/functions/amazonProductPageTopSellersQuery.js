import { getAmazonProductPage } from "./amazonProductPageQuery.js";
import { getAmazonTopSellers } from "./amazonTopSellersQuery.js";

export const getAmazonTopSellerPages = async (
  topSellers,
  topSellerPage,
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
  getCustomReviews,
  getRatingScore,
  getReviewsAmount,
  getAnswersAmount,
  setCountryCode,
  getCountryCode,
  getLanguageCode,
  getManufactureName,
  getReviewData,
  getReviewDataLimit,
  getReviewDataFilters,
  getRelatedProducts,
  getAmazonChoice,
  getProductInfoFormatted
) => {
  if (topSellerPage) {
    let arrCount = -1;
    let topSellersObj = {};
    let categories = "";
    topSellersObj["topSeller"] = [];

    let objNames = Object.keys(topSellers);

    for (let k = 0; k < objNames.length; k++) {
      let objValues = Object.values(topSellers[objNames[k]]);

      categories += objValues[k].category + ", ";

      if (objValues.length > 0) {
        for (let q = 0; q < objValues.length; q++) {
          arrCount++;
          const topSellerItemUrl = objValues[q].id;
          const singleTopSellerProductPage = await getAmazonProductPage(
            topSellerItemUrl,
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
            0,
            getCustomReviews,
            getRatingScore,
            getReviewsAmount,
            getAnswersAmount,
            setCountryCode,
            getCountryCode,
            getLanguageCode,
            true,
            getManufactureName,
            getReviewData,
            getReviewDataLimit,
            getReviewDataFilters,
            false,
            getAmazonChoice,
            getProductInfoFormatted
          );

          if (topSellers[`link_${k + 1}`][q].imageData) {
            singleTopSellerProductPage["imageData"] =
              topSellers[`link_${k + 1}`][q].imageData;
          }

          topSellersObj.topSeller.push(singleTopSellerProductPage);
          topSellersObj.topSeller[arrCount]["rank"] =
            objValues[q].metadataMap["render.zg.rank"];

          if (parseInt(objValues[q].metadataMap["render.zg.rank"]) === 1) {
            topSellersObj.topSeller[arrCount]["rank"] =
              topSellersObj.topSeller[arrCount]["rank"] +
              "st in " +
              objValues[q].category;
          } else if (
            parseInt(objValues[q].metadataMap["render.zg.rank"]) === 2
          ) {
            topSellersObj.topSeller[arrCount]["rank"] =
              topSellersObj.topSeller[arrCount]["rank"] +
              "nd in " +
              objValues[q].category;
          } else if (
            parseInt(objValues[q].metadataMap["render.zg.rank"]) === 3
          ) {
            topSellersObj.topSeller[arrCount]["rank"] =
              topSellersObj.topSeller[arrCount]["rank"] +
              "rd in " +
              objValues[q].category;
          } else {
            topSellersObj.topSeller[arrCount]["rank"] =
              topSellersObj.topSeller[arrCount]["rank"] +
              "th in " +
              objValues[q].category;
          }
        }
      }
    }

    topSellersObj["categories"] = categories.substring(
      0,
      categories.length - 2
    );

    return topSellersObj;
  } else {
    let arrCount = -1;
    let objNames = Object.keys(topSellers);
    for (let k = 0; k < objNames.length; k++) {
      let objValues = Object.values(topSellers[objNames[k]]);
      if (objValues.length > 0) {
        for (let q = 0; q < objValues.length; q++) {
          arrCount++;
          const topSellerItemUrl = objValues[q].id;

          const singleTopSellerProductPage = await getAmazonProductPage(
            topSellerItemUrl,
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
            0,
            getCustomReviews,
            getRatingScore,
            getReviewsAmount,
            getAnswersAmount,
            setCountryCode,
            getCountryCode,
            getLanguageCode,
            true,
            getManufactureName,
            getReviewData,
            getReviewDataLimit,
            getReviewDataFilters
          );

          if (getAsin) {
            if (!singleTopSellerProductPage.asin) {
              singleTopSellerProductPage.asin = objValues[q].id;
            }
          }

          if (topSellers[`link_${k + 1}`][q].imageData) {
            singleTopSellerProductPage["imageData"] =
              topSellers[`link_${k + 1}`][q].imageData;
          }

          data.topSeller.push(singleTopSellerProductPage);

          data.topSeller[arrCount]["rank"] =
            "#" +
            objValues[q].metadataMap["render.zg.rank"] +
            " in " +
            categories[k];
        }
      }
    }
    return data;
    // return topSellers;
    // } else {
    //   return {
    //     errMessage: "No rank URLS found",
    //   };
    // }
  }
};
