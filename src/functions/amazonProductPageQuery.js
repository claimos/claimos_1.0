import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import puppeteer from "puppeteer";

import { getDirectories, getDirectoryFiles, timeStamp } from "./tools.js";
import { randomUserAgent } from "./userAgents.js";
import { imageParse } from "./imageParser.js";

axios.defaults.timeout = 2500;
let userAgent;

export const getAmazonProductPage = async (
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
  getMainImageURLs,
  getAmazonChoice,
  getProductInfoFormatted,
  getPrimaryImage
) => {
  if (getReviewData) {
    getAsin = true;
  }

  userAgent = randomUserAgent();
  let generalKeywordMatch = false;
  let generalKeywordOccurance = 0;

  const contryURLs = {
    US: "com",
    CA: "ca",
    ES: "es",
    GB: "co.uk",
    FR: "fr",
    DE: "de",
    IT: "it",
    JP: "jp",
  };

  const contryURLsCurrency = {
    US: "USD",
    CA: "CAD",
    ES: "EUR",
    GB: "GBP",
    FR: "EUR",
    DE: "EUR",
    IT: "EUR",
    JP: "JPY",
  };

  const languageCodes = {
    US: "EN",
    CA: "EN",
    ES: "ES",
    GB: "EN-GB",
    FR: "FR",
    DE: "DE",
    IT: "IT",
    JP: "JA",
  };

  let currency;
  let languageCode;
  let contryURL;
  if (setCountryCode) {
    contryURL = contryURLs[setCountryCode.toUpperCase()];
    currency = contryURLsCurrency[setCountryCode.toUpperCase()];
    languageCode = languageCodes[setCountryCode.toUpperCase()];
  } else {
    contryURL = contryURLs["US"];
    currency = contryURLsCurrency["US"];
    languageCode = languageCodes["US"];
  }

  // let amazonQuries = "?";
  // let language = "language=es_US";
  // let currencies = "currency=USD";

  const rootUrl = `https://www.amazon.${contryURL}`;
  if (byAsin) {
    productUrl = `${rootUrl}/dp/${productUrl}`;
  }

  const pulledImagePath = "../pulledImages/"; // Path to Images Folder

  let HTMLData; // variable to store the axios request to amazon page url
  let singleProduct = {
    ...(getAsin && { asin: null }),
    ...(getInfo && { mainInfo: null }),
    ...(getImageUrls && { imageUrls: null }),
    ...(getProductAbout && { about: null }),
    ...(getProductPrice && { price: null }),
    ...(getProductSavings && { savings: null ? savings : null }),
    ...(getProductDescription && { description: null }),
    ...(getProductFullDescription && { fullDescription: null }),
    ...(getProductDetails && { productDetails: null }),
    ...(getImportantInformation && {
      importantInformation: null,
    }),
    ...(getProductInfo && { productInfo: null }),
    ...(getProductInfoFormatted && { productInfoFormatted: null }),
    ...(getRelatedProducts && { relatedProducts: null }),
    ...(getCustomReviews && { customReviews: null }),
    ...(getRatingScore && { rating: null }),
    ...(getReviewsAmount && { reviewsAmount: null }),
    ...(getAnswersAmount && { answersAmount: null }),
  }; // object to store all parsed data

  // console.log("Start of Fetch", timeStamp());
  HTMLData = await fetch(productUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent, // custom dynamic user-agent to avoid bot detection and blocking
    },
  })
    .then((res) => {
      // console.log("Coverting Binary of Fetch", timeStamp());
      return res.text();
    })
    .catch((err) => {
      console.log(err);
    });
  // console.log("Return of Fetch", timeStamp());

  let whileloop = true;
  let count = 0;
  while (whileloop) {
    // console.log("Start of Loop", timeStamp());
    // console.log("Start of Loop");

    if (typeof HTMLData === "string") {
      let $ = cheerio.load(HTMLData); // loading responce data into cheerio framework for parsing
      // console.log("Loaded data", timeStamp());
      // const list = $(".a-container"); // Dont know what this does but it makes it work, assuming it decides which container to parse so we can run a for loop on all children contained within container
      // console.log("List: " + Boolean(list));

      // parisng all children in cointainer selected, essentially a for-loop
      let description;
      let productName;
      // list.each(async (i, el) => {
      // console.log("List");

      if (getProductDescription || getProductName) {
        // console.log(
        //   "Prod Desc: " +
        //     Boolean(getProductDescription || getProductName || getSellerName),
        //   timeStamp()
        // );
        description = $("#productTitle").text(); // finding element corrispoding to description

        if (description.length > 0) {
          description = description.split("         ");
          description = description[0];

          description = description
            .replaceAll("        ", "")
            .replaceAll("    ", "")
            .replaceAll("   ", "");

          const descArray = description.replaceAll("  ", ",").split(",");
          productName = descArray[0];
        } else {
          description = "Product does not have a visible description.";
        }

        // console.log("Prod Desc: Done", timeStamp());
      }

      let amazonChoice;
      if (getAmazonChoice) {
        if (
          $(
            "#acBadge_feature_div > div > span.a-declarative > span.a-size-small.aok-float-left.ac-badge-rectangle > span.ac-badge-text-primary.ac-white"
          )
            .text()
            .includes("Amazon's")
        ) {
          amazonChoice = true;
        } else {
          amazonChoice = false;
        }
      }

      let price; //initializing price variable
      if (getProductPrice) {
        // console.log("Prod Price: " + Boolean(getProductPrice), timeStamp());
        /* conditionaly statments to match different page layouts that will match *price* */
        if ($(".a-price-range").text()) {
          price = $(".a-price").text();
          price = price.split("$");
          price = "$" + price[1] + " - " + "$" + price[3];
        } else if ($(".a-price").text()) {
          price = $(".a-price").text();
          price = price.split("$");
          price = "$" + price[1] + " " + currency;
          // console.log("Prod Price: Done", timeStamp());
        } else {
          price = "Currently unavailable.";
        }
        // if (generalKeywordMatch) {
        //   if (price.includes(generalKeywordMatch)) {
        //     generalKeywordOccurance++;
        //   }
        // } else {
        //   price = "Currently unavailable.";
        // }
      }

      /* conditionaly statments to match *savings percentage * */
      let savings = "no savings found";
      if (getProductSavings) {
        // console.log("Prod Savings: " + Boolean(getProductSavings), timeStamp());
        if (
          $(
            ".savingsPercentage",
            "#corePriceDisplay_desktop_feature_div"
          ).text()
        ) {
          savings = $(
            ".savingsPercentage",
            "#corePriceDisplay_desktop_feature_div"
          ).text();
          savings = savings.split("-");
          savings = "-" + savings[1];
        }
        if (generalKeywordMatch) {
          if (savings.includes(generalKeywordMatch)) {
            generalKeywordOccurance++;
          }
        }
        // console.log("Prod Savings: Done", timeStamp());
      }

      let rating;
      if (getRatingScore) {
        // console.log(
        //   "Prod Rating Score: " + Boolean(getRatingScore),
        //   timeStamp()
        // );
        rating = $(".a-size-base", "#acrPopover").text().split(" "); // parsing rating ie (4.7/5)
        rating = rating[1];

        if (rating) {
        } else {
          rating = "Product rating not found.";
        }
        // console.log("Prod Rating Score: Done", timeStamp());
      }

      let reviewsAmount;
      if (getReviewsAmount) {
        // console.log(
        //   "Prod Review Amount: " + Boolean(getReviewsAmount),
        //   timeStamp()
        // );
        reviewsAmount = $(".a-size-base", "#acrCustomerReviewLink") // parsing number of ratings on product
          .text()
          .split(" ratings");

        if (reviewsAmount[0].length > 0) {
          reviewsAmount = reviewsAmount[0] + " ratings";
        } else {
          reviewsAmount = "Product does not have amount of reviews visible.";
        }

        // console.log("Prod Review Ammount: Done", timeStamp());
      }

      let answersAmount;
      if (getAnswersAmount) {
        // console.log(
        //   "Prod Anserws Amount: " + Boolean(getAnswersAmount),
        //   timeStamp()
        // );
        answersAmount = $(".a-size-base", "#askATFLink").text(); // parsing number of answered questions on product

        if (answersAmount.length > 0) {
          answersAmount = answersAmount.substring(1, answersAmount.length - 1);
        } else {
          answersAmount =
            "Product does not have amount of answered questions visible.";
        }

        // console.log("Prod Anserws Amount:  Done", timeStamp());
      }

      let infoItems = {}; //initializing product info object for *Main Page Info* data
      let names = []; //initializing names array to store all children names
      let values = []; //initializing values array to store all children values

      if (getInfo || getAsin || getSellerName || getManufactureName) {
        // console.log(
        //   "Prod Info: " + Boolean(getInfo) + ", get Asin: " + Boolean(getAsin),
        //   timeStamp()
        // );

        if (
          $(
            `#productOverview_feature_div > div > table > tbody > tr > td.a-span3 > span`
          ).text().length > 0
        ) {
          const infoName = $(
            `#productOverview_feature_div > div > table > tbody > tr > td.a-span3 > span`
          ).contents();

          const infoVal = $(
            `#productOverview_feature_div > div > table > tbody > tr > td.a-span9 > span`
          ).contents();
          infoName.each((i, el) => {
            if (infoName[i].data) {
              const tempName = infoName[i].data;
              names.push(tempName);
            }

            if (infoVal[i].data) {
              const tempVal = infoVal[i].data;
              values.push(tempVal);
            }
          });
        } else if (
          $(
            `#poExpander > div > div > table > tbody > tr > td.a-span3 > span`
          ).text().length > 0
        ) {
          const infoName = $(
            `#poExpander > div > div > table > tbody > tr > td.a-span3 > span`
          ).contents();

          const infoVal = $(
            `#poExpander > div > div > table > tbody > tr > td.a-span9 > span`
          ).contents();
          infoName.each((i, el) => {
            if (infoName[i].data) {
              const tempName = infoName[i].data;
              names.push(tempName);
            }

            if (infoVal[i].data) {
              const tempVal = infoVal[i].data;
              values.push(tempVal);
            }
          });
        }

        for (let i = 0; i < values.length; i++) {
          infoItems[names[i]] = values[i]; // pushing/saving all (names, values) to product details obect
        }
        // console.log("Prod Info: Done", timeStamp());
      }

      let about;
      if (getProductAbout) {
        // console.log("Prod About: " + Boolean(getProductAbout), timeStamp());
        about = $(".a-vertical", "#feature-bullets").text(); // parsing product *About this item* data
        if (about.trim() === "") {
          about = $("#productFactsDesktopExpander").text();

          if (about.length > 0) {
            about = about.split("    About this item    \n");
            about = about[1].split("\n");
            about = about
              .map((item) => {
                item = item.replace(/\s{2,}/g, "");
                return item;
              })
              .filter((item) => item);
          }
        }

        if (about.length > 0) {
          if (about.includes("       ")) {
            about = about.split("       ");
          } else if (about.includes("     ")) {
            about = about.split("     ");
          } else if (about.includes("   ")) {
            about = about.split("   ");
          }

          if (Array.isArray(about)) {
            const index = about.length - 1;

            about[0] = about[0].replace("   ", "");
            about[index] = about[index].replace("    ", "");

            about = about.filter((item) => item.length > 0 && item);
            if (generalKeywordMatch) {
              if (about.some((v) => generalKeywordMatch.includes(v))) {
                generalKeywordOccurance++;
              }
            }
          }
          if (generalKeywordMatch) {
            if (about.includes(generalKeywordMatch)) {
              generalKeywordOccurance++;
            }
          }
        } else {
          about = "Product does not have visible about section.";
        }
        // console.log("Prod About: Done", timeStamp());
      }

      let fullProductDesc = "";
      let fullProductDescArr;
      if (getProductFullDescription) {
        // console.log(
        //   "Prod Full Desc: " + Boolean(getProductFullDescription),
        //   timeStamp()
        // );

        fullProductDesc = $("#productDescription") // parsing product Product Description data
          .text()
          .replaceAll("                    ", "")
          .replaceAll("\n", "")
          .replaceAll("  ", "");
        // fullProductDesc = fullProductDesc.substring(1, fullProductDesc.length);

        // Not sure if this is needed
        //
        // if (
        //   $("#productDescription_feature_div > h2")
        //     .text()
        //     .replaceAll(/\s{2,}/g, "")
        //     .replaceAll(/^\s+/g, "")
        //     .replaceAll(/\s+$/g, "") === "Product Description"
        // ) {
        //   const paragraphsAndSpans = $("#productDescription").find(
        //     "p, span, h3, h4"
        //   );
        //   fullProductDescArr = [];

        //   if ($("#productDescription > p ").contents()[1]) {
        //     if (
        //       $("#productDescription > p ").contents()[1].children.length > 1
        //     ) {
        //       let fullDesc_p = $("#productDescription > p ").contents()[1]
        //         .children;
        //       let fullDesc_span;
        //       let fullDesc_span_data;
        //       if ($("#productDescription > s ").contents()[1]) {
        //         if ($("#productDescription > s ").contents()[1].children) {
        //           fullDesc_span = $("#productDescription > s ").contents()[1]
        //             .children;
        //           fullDesc_span_data = true;
        //         }
        //       }
        //       for (let i = 0; i < fullDesc_p.length; i++) {
        //         if (fullDesc_p[i].data) {
        //           let data = fullDesc_p[i].data;
        //           if (!fullProductDescArr.includes(data)) {
        //             fullProductDescArr.push(data);
        //           }
        //         }
        //         if (fullDesc_span_data) {
        //           if (fullDesc_span[i].data) {
        //             let data = fullDesc_span[i].data;
        //             if (!fullProductDescArr.includes(data)) {
        //               fullProductDescArr.push(data);
        //             }
        //           }
        //         }
        //       }
        //     } else {
        //       const textData = paragraphsAndSpans.map((index, element) => {
        //         let data = $(element)
        //           .text()
        //           .replaceAll(/\s{2,}/g, "")
        //           .replaceAll(/^\s+/g, "")
        //           .replaceAll(/\s+$/g, "");
        //         if (data.length > 0) {
        //           if (!fullProductDescArr.includes(data)) {
        //             fullProductDescArr.push(data);
        //           }
        //         }
        //       });
        //     }
        //   }
        // } else if (
        //   $("#aplusBatch > h2")
        //     .text()
        //     .replaceAll(/\s{2,}/g, "")
        //     .replaceAll(/^\s+/g, "")
        //     .replaceAll(/\s+$/g, "") === "Product Description"
        // ) {
        //   const paragraphsAndSpans = $("#aplusBatch").find(
        //     "p, span, h3, h4, tr, th"
        //   );
        //   fullProductDescArr = [];

        //   const textData = paragraphsAndSpans.map((index, element) => {
        //     let data = $(element)
        //       .text()
        //       .replaceAll(/\s{2,}/g, "")
        //       .replaceAll(/^\s+/g, "")
        //       .replaceAll(/\s+$/g, "");
        //     if (
        //       data.length > 0 //&&
        //     ) {
        //       if (!fullProductDescArr.includes(data)) {
        //         fullProductDescArr.push(data);
        //       }
        //     }
        //   });
        // } else {
        //   const paragraphsAndSpans = $("#productDescription").find(
        //     "p, span, h3, h4"
        //   );
        //   fullProductDescArr = [];

        //   const textData = paragraphsAndSpans.map((index, element) => {
        //     let data = $(element)
        //       .text()
        //       .replaceAll(/\s{2,}/g, "")
        //       .replaceAll(/^\s+/g, "")
        //       .replaceAll(/\s+$/g, "");
        //     if (
        //       data.length > 0 //&&
        //     ) {
        //       if (!fullProductDescArr.includes(data)) {
        //         fullProductDescArr.push(data);
        //       }
        //     }
        //   });
        // }

        // if (fullProductDescArr.length > 0) {
        //   fullProductDesc = fullProductDescArr.join("\n");
        // }
        // }

        if (fullProductDesc.length > 0) {
        } else {
          fullProductDesc =
            "Product does not have a visible full-description section.";
        }
        // console.log("Prod Full Desc: Done", timeStamp());
      }

      let prodDetailItems = {}; //initializing product datails object for *Product Details* data
      values = []; //re-initializing values array to store more children value data
      names = []; //re-initializing names array to store more children name data
      let productDetails;
      if (getProductDetails || getAsin || getSellerName || getManufactureName) {
        // console.log(
        //   "Prod Details: " + Boolean(getProductDescription),
        //   timeStamp()
        // );
        productDetails = $("#detailBullets_feature_div").contents(); //locating the product details data and returning contents to find children

        let tempName = "";
        productDetails.children().each((i, el) => {
          //looping through child to find needed values for product details
          const tempVal = $(
            `#detailBullets_feature_div > ul > li:nth-child(${
              i + 1
            }) > span > span:nth-child(2)`
          ).text(); //initializing temporary values variable to store child's values (located with selector)

          values.push(tempVal); // pushing/saving all found values to values array

          tempName += $(
            `#detailBullets_feature_div > ul > li:nth-child(${
              i + 1
            }) > span > span.a-text-bold`
          ).text(); //initializing temporary names variable to store child's names

          tempName = tempName.replaceAll("\n", "");
          tempName = tempName
            .replaceAll("  ", "")
            .replaceAll(" ‏", "")
            .replaceAll(" ‎", "");
        });

        let bestSeller;
        let productRank;
        let productDetailsCategoryRankUrl;
        let productDetailsRankUrls = [];
        const str = $(
          `#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span`
        ).text();

        if (str.replace(/\s/g, "").length) {
          let productDetailSellerRank = $(
            `#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span`
          )
            .text()
            .replaceAll("       ", "")
            .replaceAll("      ", "")
            .replaceAll("    ", "")
            .replaceAll("  ", "")
            .split(":");

          productRank = productDetailSellerRank[1].split("#");
          const productRankShift = productRank.shift();
          // productRank[0] = productRank[0].replace(/\s\([^)]*\)/i, "");
          for (let i = 0; i < productRank.length; i++) {
            productRank[i] = "#" + productRank[i];
          }

          productDetailsCategoryRankUrl =
            rootUrl +
            $(
              `#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span > a`
            ).attr("href");
          productDetailsRankUrls.push(productDetailsCategoryRankUrl);

          for (let i = 1; i < productRank.length; i++) {
            const productDetailsNeicheRankUrl =
              rootUrl +
              $(
                `#detailBulletsWrapper_feature_div > ul:nth-child(4) > li > span > ul > li:nth-child(${i}) > span > a`
              ).attr("href");
            productDetailsRankUrls.push(productDetailsNeicheRankUrl);
          }
          bestSeller = true;
        }
        productDetails = {}; // clearing productDetails object to save memory
        /* Nessary parsing steps to clean data and format it to specification */
        names = tempName.split(":");
        names.pop();
        names = names.map((item, index) => {
          if (index === 0) return (item = item.substring(0, item.length - 1));
          else if (index === names.length - 1) {
            if (item[item.length - 1] === "‏") {
              return (item = item.substring(1, item.length - 1));
            } else {
              return (item = item.substring(1, item.length));
            }
          } else {
            if (item[item.length - 1] === "‏")
              return (item = item.substring(1, item.length - 1));
            else return (item = item.substring(1, item.length));
          }
        });

        let j = 0;

        for (let i = 0; i < values.length; i++) {
          if (values[i]) {
            prodDetailItems[names[j]] = values[i]; // pushing/saving all (names, values) to product details obect
            j++;
          }
        }
        if (bestSeller) {
          prodDetailItems["Best Sellers Rank"] = productRank;
          prodDetailItems["Category Rank URLs"] = productDetailsRankUrls;
        }

        if (generalKeywordMatch) {
          if (
            names.includes(generalKeywordMatch) ||
            values.includes(generalKeywordMatch) ||
            productRank.includes(generalKeywordMatch)
          ) {
            generalKeywordOccurance++;
          }
        }

        // console.log("Prod Details: Done", timeStamp());
      }

      values = []; //re-initializing values array to store more children value data
      names = []; //re-initializing names array to store more children name data
      let importantInformationObj = {}; //initializing important information object for *Important Information* data
      let importantInformation;
      if (getImportantInformation) {
        // console.log(
        //   "Prod Important Information: " + Boolean(getImportantInformation),
        //   timeStamp()
        // );
        importantInformation = $(
          ".a-section",
          "#important-information"
        ).contents(); //locating the important informations data and returning contents to find children

        importantInformation.each((i, el) => {
          //looping through child to find needed values for product important information
          const tempName = $(
            `#important-information > div:nth-child(${i}) > h4`
          ).text(); //initializing temporary names variable to store child's names (located with selector)
          if (tempName) {
            names.push(tempName); // pushing/saving all found names to names array
          }

          const tempVal = $(
            `#important-information > div:nth-child(${i}) > p`
          ).text(); //initializing temporary values variable to store child's values (located with selector)
          if (tempVal) {
            values.push(tempVal); // pushing/saving all found values to values array
          }
        });

        for (let i = 0; i < values.length; i++) {
          if (names[i]) {
            if (names[i].includes("undefined")) {
            } else {
              importantInformationObj[names[i]] = values[i]; // pushing/saving all (names, values) to product important information obect
            }
          }
        }

        if (names && values) {
        } else {
          importantInformationObj =
            "Product does not have an important information section.";
        }

        if (generalKeywordMatch) {
          if (
            names.includes(generalKeywordMatch) ||
            values.includes(generalKeywordMatch)
          ) {
            generalKeywordOccurance++;
          }
        }
        // console.log("Prod Important Information: Done", timeStamp());
      }

      let productInfoFormattedObj = {}; //initializing product info object for *Product Information* data
      if (getProductInfoFormatted) {
        if (
          $("#prodDetails > div > div > div > div > div > div > h1").text()
            .length > 0
        ) {
          let titleName = $(
            "#prodDetails > div > div > div > div > div > div > h1"
          )
            .text()
            .replaceAll("\n", "")
            .replaceAll(/^\s+/g, "")
            .replaceAll(/\s+$/g, "");
          productInfoFormattedObj[titleName] = {};
          let count = 1;
          while (true) {
            if (
              $(
                `#prodDetails > div > div:nth-child(1) > div:nth-child(1) > div > div.a-expander-content.a-expander-extend-content > div:nth-child(${count}) > div.a-row > span > a > span`
              ).text().length > 0
            ) {
              let subName = $(
                `#prodDetails > div > div:nth-child(1) > div:nth-child(1) > div > div.a-expander-content.a-expander-extend-content > div:nth-child(${count}) > div.a-row > span > a > span`
              ).text();

              productInfoFormattedObj[titleName][subName] = {};

              let dataParse = true;
              let dataParseCount = 1;
              while (dataParse) {
                if (
                  $(
                    `#productDetails_techSpec_section_${count} > tbody > tr:nth-child(${dataParseCount}) > th`
                  ).text().length > 0
                ) {
                  let tempName = $(
                    `#productDetails_techSpec_section_${count} > tbody > tr:nth-child(${dataParseCount}) > th`
                  )
                    .text()
                    .replaceAll("\n", "")
                    .replaceAll(/^\s+/g, "")
                    .replaceAll(/\s+$/g, "");
                  let tempVal = $(
                    `#productDetails_techSpec_section_${count} > tbody > tr:nth-child(${dataParseCount}) > td`
                  )
                    .text()
                    .replaceAll("\n", "")
                    .replaceAll(/^\s+/g, "")
                    .replaceAll(/\s+$/g, "");

                  productInfoFormattedObj[titleName][subName][tempName] =
                    tempVal;
                  dataParseCount++;
                } else {
                  dataParse = false;
                }
              }
              count++;
            } else {
              let dataParse = true;
              let dataParseCount = 1;
              while (dataParse) {
                if (
                  $(
                    `#productDetails_techSpec_section_${count} > tbody > tr:nth-child(${dataParseCount}) > th`
                  ).text().length > 0
                ) {
                  let tempName = $(
                    `#productDetails_techSpec_section_${count} > tbody > tr:nth-child(${dataParseCount}) > th`
                  )
                    .text()
                    .replaceAll("\n", "")
                    .replaceAll(/^\s+/g, "")
                    .replaceAll(/\s+$/g, "");
                  let tempVal = $(
                    `#productDetails_techSpec_section_${count} > tbody > tr:nth-child(${dataParseCount}) > td`
                  )
                    .text()
                    .replaceAll("\n", "")
                    .replaceAll(/^\s+/g, "")
                    .replaceAll(/\s+$/g, "");

                  productInfoFormattedObj[titleName][tempName] = tempVal;
                  dataParseCount++;
                } else {
                  dataParse = false;
                }
              }
              break;
            }
            {
            }
          }
        }

        if (
          $("#productDetails_db_sections > h1").text().length > 0 ||
          $("#prodDetails > h2").text().length > 0
        ) {
          let titleName;
          if ($("#productDetails_db_sections > h1").text().length > 0) {
            titleName = $("#productDetails_db_sections > h1").text();
          } else if ($("#prodDetails > h2").text().length > 0) {
            titleName = $("#prodDetails > h2").text();
          }
          titleName = titleName
            .replaceAll("\n", "")
            .replaceAll(/^\s+/g, "")
            .replaceAll(/\s+$/g, "");
          productInfoFormattedObj[titleName] = {};
          let dataParse = true;
          let dataParseCount = 1;
          while (dataParse) {
            if (
              $(
                `#productDetails_detailBullets_sections1 > tbody > tr:nth-child(${dataParseCount}) > th`
              ).text().length > 0
            ) {
              let tempName = $(
                `#productDetails_detailBullets_sections1 > tbody > tr:nth-child(${dataParseCount}) > th`
              )
                .text()
                .replaceAll(/^\s+/g, "")
                .replaceAll(/\s+$/g, "");
              let tempVal = $(
                `#productDetails_detailBullets_sections1 > tbody > tr:nth-child(${dataParseCount}) > td`
              )
                .text()
                .replaceAll("\n", "")
                .replaceAll(/^\s+/g, "")
                .replaceAll(/\s+$/g, "");

              if (tempName == "Best Sellers Rank") {
                tempVal = $(
                  `#productDetails_detailBullets_sections1 > tbody > tr:nth-child(${dataParseCount}) > td`
                )
                  .text()
                  .replaceAll(/^\s+/g, "")
                  .replaceAll(/\s+$/g, "")
                  .split("#");
                tempVal.shift();
                for (let i = 0; i < tempVal.length; i++) {
                  if (tempVal[i]) {
                    tempVal[i] =
                      "#" +
                      tempVal[i]
                        .replaceAll(/^\s+/g, "")
                        .replaceAll(/\s+$/g, "");
                  }
                }
                let k = 1;
                let templinksUrls = [];
                let tempLinkCount = 0;
                while (true) {
                  let templinks = $(
                    `#productDetails_detailBullets_sections1 > tbody > tr:nth-child(${dataParseCount}) > td > span > span:nth-child(${k}) > a`
                  ).attr("href");
                  if (templinks) {
                    templinksUrls.push(rootUrl + templinks);
                  } else {
                    if (tempLinkCount > 5) {
                      break;
                    }
                    tempLinkCount++;
                  }
                  k++;
                }

                let rankUrls = "Category Rank URLs";

                productInfoFormattedObj[titleName][tempName] = tempVal;
                productInfoFormattedObj[titleName][rankUrls] = templinksUrls;
              } else if (tempName == "Customer Reviews") {
                tempVal = "N/A";
                productInfoFormattedObj[titleName][tempName] = tempVal;
              } else {
                productInfoFormattedObj[titleName][tempName] = tempVal;
              }
              dataParseCount++;
            } else {
              dataParse = false;
            }
          }
        }
      }

      values = []; //re-initializing values array to store more children value data
      names = []; //re-initializing names array to store more children name data
      let productInfoObj = {}; //initializing product info object for *Product Information* data
      if (getProductInfo || getAsin || getSellerName || getManufactureName) {
        productInfoObj = getProductInformation(productUrl, rootUrl, $);
        // console.log("Prod Product Info: Done");
      }

      let relatedProductsObj = []; //initializing realted products array for *Products related to this item* data
      if (getRelatedProducts || getRelatedProductsLimit > 0) {
        // console.log(
        //   "Prod Realted Products: " + Boolean(getRelatedProducts),
        //   timeStamp()
        // );
        relatedProductsObj = await getDynamicRelatedItems(
          contryURL,
          productUrl,
          getRelatedProductsLimit
        );

        // console.log(relatedProductsObj);
        // console.log("Prod Related Products: Done", timeStamp());
      }

      let customReviewsObj; //initializing product reviews object for *Customer reviews* data ie ('5 star': "95%")
      if (getCustomReviews) {
        // console.log(
        //   "Prod Custom Reviews: " + Boolean(getCustomReviews),
        //   timeStamp()
        // );
        try {
          customReviewsObj = getCustomerReviews(productUrl, $);
        } catch (e) {}
        if (generalKeywordMatch) {
          if (Object.values(customReviewsObj).includes(generalKeywordMatch)) {
            generalKeywordOccurance++;
          }
        }
        // console.log("Prod Customer Reviews: Done", timeStamp());
      }

      /* function to get *Customer reviews* data and if not there make a request to same url again in hopes cheerio will be able to locate selector. This is because sometimes the HTMLData does not contain the realted products on the first request */
      let asin; // initializing asin variable
      if (getAsin) {
        // console.log("Prod Asin: " + Boolean(getAsin), timeStamp());
        if (infoItems.asin) {
          // conditional statment to match brand to the asin attributes of the parsed objects
          asin = infoItems.asin;
        } else if (prodDetailItems.ASIN) {
          asin = prodDetailItems.ASIN;
        } else if (productInfoObj.ASIN) {
          asin = productInfoObj.ASIN;
        } else {
          // if asin value can not be found using cheerio run a RegEx statment on HTMLData to match asin locator string
          let asin_indexes = [
            ...HTMLData.matchAll(new RegExp(', asin: "([^]*?)"', "gi")),
          ].map((a) => a.index);
          asin = HTMLData.substring(asin_indexes[0] + 2, asin_indexes[0] + 25);
          asin = asin.split('"');
          asin = asin[1];
        }
        if (generalKeywordMatch) {
          if (asin.includes(generalKeywordMatch)) {
            generalKeywordOccurance++;
          }
        }
        // console.log("Prod Asin: Done", timeStamp());
      }

      let primaryImage = "";

      if (getPrimaryImage) {
        primaryImage = $("#landingImage").attr("src");
      }

      let imageDataArray = [];
      if (getImageData) {
        // console.log("Prod Image Data: " + Boolean(getImageData), timeStamp());
        let img_indexes = [
          ...HTMLData.matchAll(
            // Regex statment to match all possible image urls paths within HTMLData
            new RegExp(
              '(,|:)\\"https://m.media-amazon.com/images/I/([^]*?)',
              "gi"
            )
          ),
        ].map((a) => a.index);
        for (let i = 0; i < img_indexes.length; i++) {
          // loop through all RegEx indexes to parse the usable image url
          let imageUrl = HTMLData.substring(
            img_indexes[i],
            img_indexes[i] + 120
          ); // returning data at indix values and adding losts space so full url path can be captured
          imageUrl = imageUrl.split('"'); // splitting by quotation
          imageUrl = imageUrl[1]; // capturing url
          if (imageUrl.includes("SL1500")) {
            // console.log(imageUrl);
            const parseData = imageParse(imageUrl);
            // console.log({ imageUrl: imageUrl, imageData: parseData });
            imageDataArray.push({
              imageUrl: imageUrl,
              imageData: parseData,
            });
          }
          if (imageDataArray) {
            if (generalKeywordMatch) {
              if (imageDataArray.includes(generalKeywordMatch)) {
                generalKeywordOccurance++;
              }
            }
          }
        }
        // console.log("Prod Image Data: Done", timeStamp());
      }

      let mainImageURLs = {};

      // All this code takes between 0.12-0.54 seconds to run, worst case scenerio takes 0.5-0.55 seconds.
      // Best case is around 0.10-0.12 seconds. Average is around 0.29-0.34 seconds.
      //
      if (getMainImageURLs) {
        mainImageURLs = {
          thumbnailImages: [],
          mainImages: [],
        };

        // console.log(Date.now() + " start of images");

        $("#altImages > ul")
          .children()
          .each((i, el) => {
            const thumbnailImage = $(el)
              .find(`.a-button-thumbnail`)
              .children(".a-button-inner")
              .children(".a-button-text")
              .children()
              .attr("src");

            if (thumbnailImage) {
              if (
                thumbnailImage.includes("https://m.media-amazon.com/images/") &&
                !mainImageURLs.thumbnailImages.includes(thumbnailImage)
              ) {
                mainImageURLs.thumbnailImages.push(thumbnailImage);
              }
            }
          });

        if (mainImageURLs.thumbnailImages.length > 0) {
          $("script").map((idx, el) => {
            if ($(el).html().includes("ImageBlockATF")) {
              const imageScript = $(el).text();

              let jsonImageObj = imageScript.substring(
                imageScript.indexOf("var data =") + 11,
                imageScript.indexOf("return data;") - 6
              );
              jsonImageObj = jsonImageObj
                .replaceAll("\n", "")
                .replaceAll(" ", "")
                .replaceAll("'", '"');

              if (jsonImageObj.includes("colorImages")) {
                jsonImageObj = jsonImageObj.substring(
                  jsonImageObj.indexOf(`"colorImages"`) +
                    `"colorImages":`.length,
                  jsonImageObj.indexOf("colorToAsin") - 2
                );
              } else if (jsonImageObj.includes("imageGalleryData")) {
                jsonImageObj = jsonImageObj.substring(
                  jsonImageObj.indexOf(`"imageGalleryData"`) +
                    `"imageGalleryData":`.length,
                  jsonImageObj.indexOf("centerColMargin") - 2
                );
              }

              let parseError = false;

              try {
                jsonImageObj = JSON.parse(jsonImageObj);
              } catch (err) {
                console.log(err);
                parseError = true;
              }

              if (
                !parseError &&
                Object.keys(jsonImageObj).includes("initial")
              ) {
                mainImageURLs.thumbnailImages.map((item, i) => {
                  jsonImageObj.initial.map((elem, j) => {
                    if (item === elem.thumb) {
                      mainImageURLs.mainImages.push({
                        hiRes: elem.hiRes,
                        large: elem.large,
                      });
                    }
                  });
                });
              }
            }
          });
        } else {
          $("script").map((idx, el) => {
            if ($(el).html().includes("ImageBlockATF")) {
              const imageScript = $(el).text();

              let jsonImageObj = imageScript.substring(
                imageScript.indexOf("var data =") + 11,
                imageScript.indexOf("return data;") - 6
              );
              jsonImageObj = jsonImageObj
                .replaceAll("\n", "")
                .replaceAll(" ", "")
                .replaceAll("'", '"');

              if (jsonImageObj.includes("colorImages")) {
                jsonImageObj = jsonImageObj.substring(
                  jsonImageObj.indexOf(`"colorImages"`) +
                    `"colorImages":`.length,
                  jsonImageObj.indexOf("colorToAsin") - 2
                );
              } else if (jsonImageObj.includes("imageGalleryData")) {
                jsonImageObj = jsonImageObj.substring(
                  jsonImageObj.indexOf(`"imageGalleryData"`) +
                    `"imageGalleryData":`.length,
                  jsonImageObj.indexOf("centerColMargin") - 2
                );
              }

              let parseError = false;

              try {
                jsonImageObj = JSON.parse(jsonImageObj);
              } catch (err) {
                console.log(err);
                parseError = true;
              }

              if (
                !parseError &&
                Object.keys(jsonImageObj).includes("initial")
              ) {
                mainImageURLs = jsonImageObj.initial;
              } else if (!parseError && Array.isArray(jsonImageObj)) {
                mainImageURLs = jsonImageObj;
              } else {
                mainImageURLs = "Could not find any Images on product page.";
              }
            }
          });
        }
        // console.log(Date.now() + " end of images");
      }

      let imageUrls = []; //inintalizes image urls array to store urls
      let brand; // initializing brand variable
      if (getImageUrls) {
        // console.log("Prod Image Urls: " + Boolean(getImageUrls), timeStamp());
        if (infoItems.Brand) {
          // conditional statment to match brand to the brand attributes of the parsed objects or set to false
          brand = infoItems.Brand;
        } else if (productInfoObj.Brand) {
          brand = productInfoObj.Brand;
        } else if (productInfoObj.Manufacturer) {
          brand = productInfoObj.Manufacturer;
        } else if (prodDetailItems.Manufacturer) {
          brand = prodDetailItems.Manufacturer;
        }
        let img_indexes = [
          ...HTMLData.matchAll(
            // Regex statment to match all possible image urls paths within HTMLData
            new RegExp(
              '(,|:)\\"https://m.media-amazon.com/images/I/([^]*?)',
              "gi"
            )
          ),
        ].map((a) => a.index);
        for (let i = 0; i < img_indexes.length; i++) {
          // loop through all RegEx indexes to parse the usable image url
          let imageUrl = HTMLData.substring(
            img_indexes[i],
            img_indexes[i] + 120
          ); // returning data at indix values and adding losts space so full url path can be captured
          imageUrl = imageUrl.split('"'); // splitting by quotation
          imageUrl = imageUrl[1]; // capturing url
          imageUrls.push(imageUrl); // pushing/saving all found urls to imageUrls array
          let imageFileName = imageUrl.split("/");
          imageFileName = imageFileName[5];
          imageFileName = imageFileName
            .substring(0, imageFileName.length)
            .replace(".", "_")
            .replaceAll(",", "_")
            .replaceAll("+", "_");
          imageFileName =
            imageFileName.substring(0, imageFileName.length - 4) + ".jpg"; // creating file name out of existing url found
          let downloadImage;

          /////////////////////////////////////////////////////////////////////////
          // imageDownloadSizes is not declared anywhere so this cause and error //
          /////////////////////////////////////////////////////////////////////////

          if (imageFileName.includes("SS40_.")) {
            // condintion stament to find specific image dimentions (X,Y) (40px = tile photo)
            imageFileName = "tile_" + imageFileName;
            if (imageDownloadSizes.includes("SS40")) {
              downloadImage = true;
            }
          } else if (imageFileName.includes("SX38_SY50")) {
            // condintion stament to find specific image dimentions (X,Y) (38px,50px)
            imageFileName = "image_38x50_" + imageFileName;
            if (imageDownloadSizes.includes("SX38_SY50")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (300px)
            imageFileName.includes("SX300") ||
            imageFileName.includes("SY300")
          ) {
            imageFileName = "image_300_" + imageFileName;
            if (imageDownloadSizes.includes("SX300")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (355px)
            imageFileName.includes("SY355") ||
            imageFileName.includes("SX355")
          ) {
            imageFileName = "image_355_" + imageFileName;
            if (imageDownloadSizes.includes("SY355")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (425px)
            imageFileName.includes("SX425") ||
            imageFileName.includes("SY425")
          ) {
            imageFileName = "image_425_" + imageFileName;
            if (imageDownloadSizes.includes("SX425")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (450px)
            imageFileName.includes("SY450") ||
            imageFileName.includes("SX450")
          ) {
            imageFileName = "image_450_" + imageFileName;
            if (imageDownloadSizes.includes("SY450")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (466px)
            imageFileName.includes("SX466") ||
            imageFileName.includes("SY466")
          ) {
            imageFileName = "image_466_" + imageFileName;
            if (imageDownloadSizes.includes("SX466")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (522px)
            imageFileName.includes("SX522") ||
            imageFileName.includes("SY522")
          ) {
            imageFileName = "image_522_" + imageFileName;
            if (imageDownloadSizes.includes("SX522")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (550px)
            imageFileName.includes("SY550") ||
            imageFileName.includes("SY550")
          ) {
            imageFileName = "image_550_" + imageFileName;
            if (imageDownloadSizes.includes("SY550")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (569px)
            imageFileName.includes("SX569") ||
            imageFileName.includes("SX562")
          ) {
            imageFileName = "image_569_" + imageFileName;
            if (imageDownloadSizes.includes("SX569")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (606px)
            imageFileName.includes("SY606") ||
            imageFileName.includes("SX606")
          ) {
            imageFileName = "image_606_" + imageFileName;
            if (imageDownloadSizes.includes("SY606")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (679px)
            imageFileName.includes("SX679") ||
            imageFileName.includes("SY679")
          ) {
            imageFileName = "image_679_" + imageFileName;
            if (
              imageDownloadSizes.includes("SX679") ||
              imageDownloadSizes.includes("SY679")
            ) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (741px)
            imageFileName.includes("SY741") ||
            imageFileName.includes("SX741")
          ) {
            imageFileName = "image_741_" + imageFileName;
            if (imageDownloadSizes.includes("SY741")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (879px)
            imageFileName.includes("SY879") ||
            imageFileName.includes("SX879")
          ) {
            imageFileName = "image_879_" + imageFileName;
            if (imageDownloadSizes.includes("SY879")) {
              downloadImage = true;
            }
          } else if (imageFileName.includes("SL1000")) {
            // condintion stament to find specific image dimentions (X,Y) (1000px)
            imageFileName = "image_1000_" + imageFileName;
            if (imageDownloadSizes.includes("SL1000")) {
              downloadImage = true;
            }
          } else if (imageFileName.includes("SL1500")) {
            // condintion stament to find specific image dimentions (X,Y) (1500px)
            imageFileName = "image_1500_" + imageFileName;
            if (imageDownloadSizes.includes("SL1500")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (35p,46px) (video thumb)
            imageFileName.includes("_SX35_SY46") &&
            imageFileName.includes("play-icon")
          ) {
            imageFileName = "video_tile_35x46_" + imageFileName;
            if (imageDownloadSizes.includes("play-icon_35x46")) {
              downloadImage = true;
            }
          } else if (
            // condintion stament to find specific image dimentions (X,Y) (40px) (video thumb)
            imageFileName.includes("SS40") &&
            imageFileName.includes("play-icon")
          ) {
            imageFileName = "video_tile_40_" + imageFileName;
            if (imageDownloadSizes.includes("play-icon_40")) {
              downloadImage = true;
            }
          } else {
            // condintion stament to find specific image dimentions (X,Y) (Original)
            imageFileName = "image_" + imageFileName;
            if (imageDownloadSizes.includes("Full")) {
              downloadImage = true;
            }
          }
          let folderPath; //initalizing folderpath variable

          if (getDownloadedImages) {
            if (downloadImage) {
              const dir = getDirectories(pulledImagePath); // return all sub directory of specified directory
              let dirExits = false; // inintializing directory exists varible to false, used to created directory unless set to true
              for (let i = 0; i < dir.length; i++) {
                // looping through all sub directories
                let dirExt = dir[i];
                dirExt = dirExt.split("/");
                dirExt = dirExt[2]; // capturing only the names of the sub directories
                if (dirExt === brand) {
                  // conditional statment to match if there is already a directory with the name of the given brand
                  const subDir = getDirectories(pulledImagePath + brand); // return sub directory of the brand name directory
                  for (let j = 0; j < subDir.length; j++) {
                    // looping through all sub directories of the brand name directory
                    let subDirExt = subDir[j];
                    subDirExt = subDirExt.split("/");
                    subDirExt = subDirExt[3]; // capturing only the names of the sub directories of the brand name directory
                    if (subDirExt === asin) {
                      // conditional statment to match if the sub directories of the brand name directory match the given asin code
                      dirExits = true; // set directory exists varible to true
                      folderPath = brand + "/" + asin; // set folderpath variable to name of brand + asin code; location to save the photos
                    }
                  }
                } else if (dirExt === asin) {
                  // conditional statment to match if there is already a directory with the name of the given asin code
                  dirExits = true; // set directory exists varible to true
                  folderPath = asin; // set folderpath variable to asin code; location to save the photos
                }
              }
              // console.log(folderPath);
              if (!dirExits) {
                // conditional statment to run only if directory exists varible is false
                try {
                  if (brand) {
                    // conditional statment to run only if there is a valid brand name
                    fs.mkdirSync(pulledImagePath + brand + "/" + asin, {
                      // create a directory with the brand name and sub directory with asin code
                      recursive: true,
                    });
                    folderPath = brand + "/" + asin; // set folderpath variable to name of brand + asin code; location to save the photos
                  } else {
                    // matches if brand name is not valid
                    fs.mkdirSync(pulledImagePath + asin, {
                      // create a directory with only the asin code
                      recursive: true,
                    });
                    folderPath = asin; // set folderpath variable to asin code; location to save the photos
                  }
                } catch (err) {
                  console.log(err);
                }
              }
              let dir_files = getDirectoryFiles(pulledImagePath + folderPath); // return file names of given directory
              if (!dir_files.includes(imageFileName)) {
                // conditional statment to match if the list of given files does not match the imagefile trying to be downloaded
                // console.log("Downloading : " + imageFileName);
                axios({
                  // axios call to request data of the imageUrl
                  method: "get",
                  url: imageUrl,
                  responseType: "stream",
                }).then(function (response) {
                  response.data.pipe(
                    fs.createWriteStream(
                      // writing responce data to a file
                      pulledImagePath + infoItems.Brand + "/" + imageFileName // file location where we want to save to save responce data
                    )
                  );
                });
              } else {
                // console.log("Not downloading : " + imageFileName);
              }
            }
          }
        }
        // console.log("Prod Image Urls: Done", timeStamp());
      }

      let reviewData;
      // console.log("getReviewData", getReviewData);
      if (getReviewData) {
        // console.log("Prod Review Data: " + Boolean(getReviewData), timeStamp());
        reviewData = amazonProductReviews(
          contryURL,
          asin,
          getReviewDataLimit,
          getReviewDataFilters
        );
        // console.log("Prod Review Data: Done", timeStamp());
      }

      let sellerName;
      if (getSellerName) {
        // console.log("Prod Seller Name: " + Boolean(getSellerName), timeStamp());
        // conditional statment to match sellerName to the Brand/Manufacture attributes of the parsed objects
        sellerName = $("#bylineInfo").text();
        if (sellerName.includes("Brand: ")) {
          sellerName = sellerName.split("Brand: ");
          sellerName = sellerName[1];
        } else if (sellerName.includes("Visit the ")) {
          sellerName = sellerName.split("Visit the ");
          sellerName = sellerName[1];
          sellerName = sellerName.split(" Store");
          sellerName = sellerName[0];
        } else {
          if (infoItems.Brand) {
            sellerName = infoItems.Brand;
          } else if (prodDetailItems.Brand) {
            sellerName = prodDetailItems.Brand;
          } else if (productInfoObj.Brand) {
            sellerName = productInfoObj.Brand;
          } else {
            sellerName = "Product does not have a visible seller name.";
          }
        }
        // console.log("Prod Seller Name: Done", timeStamp());
      }

      let manufactureName;
      if (getManufactureName) {
        // console.log(
        //   "Prod Manufacture Name: " + Boolean(getSellerName),
        //   timeStamp()
        // );
        if (prodDetailItems.Manufacturer) {
          manufactureName = prodDetailItems.Manufacturer;
        } else if (productInfoObj.Manufacturer) {
          manufactureName = productInfoObj.Manufacturer;
        } else {
          manufactureName = "Product does not have a visible manufacture name.";
        }
        // console.log("Prod Namufactue Name: Done", timeStamp());
      }

      if (generalKeywordMatch) {
        if (generalKeywordOccurance > 0) {
          // console.log("Found an Occurance");
          singleProduct = {
            // storing all parsed data in the singleProduct object
            //
            ...(getAsin && { asin: asin }),
            ...(getProductName && { productName: productName }),
            ...(getSellerName && { sellerName: sellerName }),
            ...(getManufactureName && { manufactureName: manufactureName }),
            ...(getInfo && { mainInfo: infoItems }),
            ...(getMainImageURLs && { mainImageURLs: mainImageURLs }),
            ...(getPrimaryImage && { primaryImage: primaryImage }),
            ...(getImageUrls && { imageUrls: imageUrls }),
            ...(getMainImageURLs && { mainImageURLs: mainImageURLs }),
            ...(getImageData && { imageData: imageDataArray }),
            ...(getProductAbout && { about: about }),
            ...(getProductPrice && { price: price }),
            ...(getProductSavings && { savings: savings ? savings : null }),
            ...(getProductDescription && { description: description }),
            ...(getProductFullDescription && {
              fullDescription: fullProductDesc,
            }),
            ...(getProductDetails && { productDetails: prodDetailItems }),
            ...(getImportantInformation && {
              importantInformation: importantInformationObj,
            }),
            ...(getProductInfo && { productInfo: productInfoObj }),
            ...(getProductInfoFormatted && {
              productInfoFormatted: productInfoFormattedObj,
            }),
            ...(getRelatedProducts && {
              relatedProducts: relatedProductsObj,
            }),
            ...(getCustomReviews && { customReviews: customReviewsObj }),
            ...(getRatingScore && { rating: rating }),
            ...(getReviewsAmount && { reviewsAmount: reviewsAmount }),
            ...(getReviewData && { reviewData: reviewData }),
            ...(getAnswersAmount && { answersAmount: answersAmount }),
            ...(getLanguageCode && { languageCode: languageCode }),
            ...(getCountryCode && { contryURL: contryURL }),
          };
        }
      } else {
        // console.log("Saving Data to Object", timeStamp());
        singleProduct = {
          // storing all parsed data in the singleProduct object
          ...(getAsin && { asin: asin }),
          ...(getProductName && { productName: productName }),
          ...(getAmazonChoice && { amazonChoice: amazonChoice }),
          ...(getSellerName && { sellerName: sellerName }),
          ...(getManufactureName && { manufactureName: manufactureName }),
          ...(getInfo && { mainInfo: infoItems }),
          ...(getMainImageURLs && { mainImageURLs: mainImageURLs }),
          ...(getPrimaryImage && { primaryImage: primaryImage }),
          ...(getImageUrls && { imageUrls: imageUrls }),
          ...(getImageData && { imageData: imageDataArray }),
          ...(getProductAbout && { about: about }),
          ...(getProductPrice && { price: price }),
          ...(getProductSavings && { savings: savings ? savings : null }),
          ...(getProductDescription && { description: description }),
          ...(getProductFullDescription && {
            fullDescription: fullProductDesc,
          }),
          ...(getProductDetails && { productDetails: prodDetailItems }),
          ...(getImportantInformation && {
            importantInformation: importantInformationObj,
          }),
          ...(getProductInfo && { productInfo: productInfoObj }),
          ...(getProductInfoFormatted && {
            productInfoFormatted: productInfoFormattedObj,
          }),
          ...(getRelatedProducts && {
            relatedProducts: relatedProductsObj,
          }),
          ...(getCustomReviews && { customReviews: customReviewsObj }),
          ...(getRatingScore && { rating: rating }),
          ...(getReviewsAmount && { reviewsAmount: reviewsAmount }),
          ...(getReviewData && { reviewData: reviewData }),
          ...(getAnswersAmount && { answersAmount: answersAmount }),
          ...(getLanguageCode && { languageCode: languageCode }),
          ...(getCountryCode && { contryURL: contryURL }),
        };
        // console.log("Saving Data to Object: Done", timeStamp());
      }
      // });

      // console.log("Single Product Object: " + Boolean(singleProduct));

      if (getProductInfo) {
        // console.log("Waiting for Customer Review Data", timeStamp());
        // conditional statment to wait untill customReviews has captured usable data
        await singleProduct.productInfo.then((Response) => {
          singleProduct.productInfo = Response;
          // console.log("Waiting for Customer Review Data: Done", timeStamp());
        });
      }

      if (getCustomReviews) {
        // console.log("Waiting for Customer Review Data", timeStamp());
        // conditional statment to wait untill customReviews has captured usable data
        await singleProduct.customReviews.then((Response) => {
          singleProduct.customReviews = Response;
          // console.log("Waiting for Customer Review Data: Done", timeStamp());
        });
      }

      // if (getImageData) {
      //   // conditional statment to wait untill imageData has captured usable data
      //   await singleProduct.imageData.map(async (item, index) => {
      //     await item.imageData.then((responce) => {
      //       item.imageData = responce;
      //       singleProduct.imageData[index] = item;
      //       console.log(singleProduct.imageData[index]);
      //     });
      //   });
      // }

      if (getRelatedProducts) {
        // console.log("Waiting for Related Products Data", timeStamp());
        // conditional statment to wait untill relatedProducts has captured usable data
        // await singleProduct.relatedProducts.then((Response) => {
        //   singleProduct.relatedProducts = Response;

        if (typeof singleProduct.relatedProducts === "object") {
          singleProduct.relatedProducts = singleProduct.relatedProducts.map(
            (item, index) => {
              if (typeof item === "string") {
                item = JSON.parse(item);
              }

              return item;
            }
          );
        }
        // });

        // singleProduct.relatedProducts = singleProduct.relatedProducts.filter(
        //   (item, index) => index <= getRelatedProductsLimit - 1 && item
        // );

        for (let i = 0; i < singleProduct.relatedProducts.length; i++) {
          // looping through relatedProducts to save the relatedProducts Url by asin code
          const asin = singleProduct.relatedProducts[i].asin;

          const asinUrl = "https://www.amazon.com/dp/" + asin;
          singleProduct.relatedProducts[i]["productUrl"] = asinUrl;
          console.log("Waiting for Related Products Data: Done", timeStamp());
        }
      }

      if (getReviewData) {
        // console.log("Waiting for Review Data", timeStamp());
        await singleProduct.reviewData.then((Response) => {
          // console.log("Waiting for Review Data: Done", timeStamp());

          singleProduct.reviewData = Response;
        });
        if (!singleProduct.reviewData.length > 0) {
          // console.log("Waiting for Review Data: Done", timeStamp());

          singleProduct.reviewData =
            "Product does not have visible costumer reviews.";
        }
      }

      whileloop = false;
    } else {
      if (count == 10) {
        return {
          productIdentifier: productUrl,
          errMessage: "Could not pull the requested product.",
        };
      } else {
        console.log("Fetch product failed");

        userAgent = randomUserAgent();
        // console.log("Start of Fetch", timeStamp());
        HTMLData = await fetch(productUrl, {
          headers: {
            Accept: "application/json",
            "User-Agent": userAgent, // custom dynamic user-agent to avoid bot detection and blocking
          },
        })
          .then((res) => {
            return res.text();
          })
          .catch((err) => {
            console.log(err);
          });

        count++;
      }
    }
  }
  console.log("Parsed", singleProduct.asin);
  return singleProduct;
};

export const getDynamicRelatedItems = async (contryURL, uri, limit) => {
  let url = uri;

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 840,
    deviceScaleFactor: 1,
  });

  let userAgent = randomUserAgent();
  await page.setUserAgent(userAgent);
  try {
    await page.goto(url);
  } catch (e) {}

  await page.waitForTimeout(1000);

  let relatedProductsObj = [];
  let selectors = [];
  let refreshCount;
  let refreshArr = [];
  let refreshArrCount = 0;
  let newPageCount = 0;
  let nextPageCount = 0;
  let broswerExitCount = 0;
  let amazonFailCount = 0;
  let amazonAddressesCount = 0;
  let amazonAddresses = [
    ".com",
    ".ca",
    ".es",
    ".co.uk",
    ".fr",
    ".de",
    ".it",
    ".jp",
  ];

  //start of while loop
  while (true) {
    refreshCount = 0;

    try {
      const name = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll(".a-carousel-col"),
          (element) => element.innerHTML
        )
      );

      let nameLen = name.length;
      let idTuple = [];

      for (let i = 0; i < nameLen; i++) {
        let index = [
          ...name[i].matchAll(
            new RegExp(
              'a-autoid-(\\d{1,2})"><span class="a-button-inner">',
              "gi"
            )
          ),
        ].map((a) => a.index);
        let id = name[i].substring(index[0], index[0] + 12);
        if (id) {
          id = id.split('"');
          id = "#" + id[0];
          if (selectors.length > 0) {
            let duplicateCount = 0;
            for (let i = 0; i < selectors.length; i++) {
              if (selectors[i].includes(id)) {
                duplicateCount++;
                break;
              }
            }
            if (duplicateCount == 0) {
              idTuple.push(id);
              if (idTuple.length == 2) {
                selectors.push(idTuple);
                idTuple = [];
              }
            }
          } else {
            idTuple.push(id);
            if (idTuple.length == 2) {
              selectors.push(idTuple);
              idTuple = [];
            }
          }
        }
      }
      let selectorsLen = selectors.length;

      try {
        for (let i = 0; i < nameLen; i++) {
          let indexes = [
            ...name[i].matchAll(new RegExp(' data-adfeedbackdetails="', "gi")),
          ].map((a) => a.index); // RegEx statment to match specific selectors accosiated with realted products
          let indexes2 = [
            ...name[i].matchAll(new RegExp("data-p13n-asin-metadata=", "gi")),
          ].map((a) => a.index);
          for (let j = 0; j < indexes.length; j++) {
            let string = name[i]
              .substring(indexes[j] + 25, indexes2[j] - 25)
              .replaceAll("&quot;", '"');

            const compareStringAsin = JSON.parse(string).asin;
            let asinCount = 0;
            for (let i = 0; i < relatedProductsObj.length; i++) {
              const relatedProductsObjAsin = JSON.parse(
                relatedProductsObj[i]
              ).asin;
              if (relatedProductsObjAsin == compareStringAsin) {
                asinCount++;
              }
            }
            if (asinCount == 0) {
              relatedProductsObj.push(string);
            } else {
              refreshCount++;
            }

            if (relatedProductsObj.length >= limit) {
              relatedProductsObj.map((item, index) => index <= limit && item);
              browser.close();
              return relatedProductsObj;
            }
          }
        }
      } catch (e) {}

      refreshArr.push([refreshCount, relatedProductsObj.length]);
      if (refreshArr.length >= 3) {
        let compareCount = 0;
        for (let i = refreshArr.length - 3; i < refreshArr.length - 1; i++) {
          const compareTupleFinal = refreshArr[refreshArr.length - 1];
          const compareTuple = refreshArr[i];
          if (
            compareTupleFinal[0] == 0 &&
            compareTuple[0] == 0 &&
            compareTupleFinal[1] == 0 &&
            compareTuple[1] == 0
          ) {
            compareCount++;
          }

          if (
            compareTupleFinal[0] == compareTuple[0] &&
            compareTupleFinal[1] == compareTuple[1]
          ) {
            compareCount++;
          }

          if (compareCount >= 2) {
            refreshArrCount++;
          }
        }
      }

      for (let i = 0; i < selectorsLen; i++) {
        await page.waitForTimeout(400);
        try {
          await page.click(selectors[i][1]);
        } catch (err) {
          i++;
        }
      }

      if (refreshArrCount >= 3) {
        idTuple = [];
        newPageCount++;
        if (newPageCount >= 2) {
          url =
            `https://amazon${contryURL}/dp/` +
            JSON.parse(relatedProductsObj[nextPageCount]).asin;
          userAgent = randomUserAgent();
          await page.setUserAgent(userAgent);
          amazonAddressesCount = 0;
          while (true) {
            try {
              await page.goto(url);
            } catch (e) {}

            const amazonFail = await page.evaluate(() =>
              Array.from(
                document.querySelectorAll("#g > div > a > img"),
                (element) => element.getAttribute("alt")
              )
            );
            if (
              amazonFail[0] ==
              "Sorry! We couldn't find that page. Try searching or go to Amazon's home page."
            ) {
              amazonFailCount++;
              if (amazonFailCount == amazonAddresses.length) {
                nextPageCount++;
                url =
                  `https://amazon${contryURL}/dp/` +
                  JSON.parse(relatedProductsObj[nextPageCount]).asin;
                userAgent = randomUserAgent();
                await page.setUserAgent(userAgent);
                amazonFailCount = 0;
              }
              userAgent = randomUserAgent();
              await page.setUserAgent(userAgent);
              url =
                `https://amazon${amazonAddresses[amazonAddressesCount]}/dp/` +
                JSON.parse(relatedProductsObj[nextPageCount]).asin;
              amazonAddressesCount++;
            } else {
              break;
            }
          }
          await page.waitForTimeout(1000);

          newPageCount = 0;
          nextPageCount++;
          broswerExitCount++;
          selectors = [];
          if (broswerExitCount >= 3) {
            if (relatedProductsObj.length == 0) {
              break;
            }
            broswerExitCount = 0;
          }
        } else {
          userAgent = randomUserAgent();
          await page.setUserAgent(userAgent);
          try {
            await page.goto(url);
          } catch (e) {}
        }
        await page.waitForTimeout(2000);
        refreshArr = [];
        refreshArrCount = 0;
      }
    } catch (e) {}
  }
};

export const amazonProductReviews = async (contryURL, asin, limit, filters) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  let baseUrl = `https://www.amazon.${contryURL}/dp/product-reviews/${asin}`;

  baseUrl += "?";
  if (filters) {
    if (filters.sortBy) {
      baseUrl += `sortBy=${filters.sortBy}&`;
    }
    if (filters.reviewerType) {
      baseUrl += `reviewerType=${filters.reviewerType}&`;
    }
    if (filters.filterByStar) {
      baseUrl += `filterByStar=${filters.filterByStar}&`;
    }
    if (filters.mediaType) {
      baseUrl += `mediaType=${filters.mediaType}&`;
    }
  }

  baseUrl += "pageNumber=";
  let currentPage = 1;
  let reviewsData = [];
  let pageCount = 0;
  let arrSize = [];
  let arrcount = -1;

  while (reviewsData.length < limit) {
    arrcount++;
    userAgent = randomUserAgent();
    await page.setUserAgent(userAgent);
    const url = baseUrl + currentPage;
    // console.log(url);
    try {
      await page.goto(url);
    } catch (e) {}

    await page.waitForTimeout(400);
    const reviewCards = await page.$$eval('div[data-hook="review"]', (cards) =>
      cards.map((card) => {
        const reviewId = card.getAttribute("id");
        const profileName = card
          .querySelector("span.a-profile-name")
          ?.textContent.trim();
        const rating = card
          .querySelector("span.a-icon-alt")
          ?.textContent.trim()
          .replaceAll(" out of 5 stars", "");
        const subject =
          card
            .querySelector(`[data-hook="review-title"] > span:nth-child(3)`)
            ?.textContent.trim() || false;
        const reviewDate = card
          .querySelector('span[data-hook="review-date"]')
          ?.textContent.trim()
          .replaceAll("Reviewed in ", "")
          .split(" on ");

        if (reviewDate[0].includes("the ")) {
          reviewDate[0] = reviewDate[0].replace("the ", "");
        }

        const date = reviewDate[1];
        const location = reviewDate[0];
        const style = card
          .querySelector('a[data-hook="format-strip"]')
          ?.textContent.trim()
          .replaceAll("Style: ", "");
        let avpBadge =
          card
            .querySelector('span[data-hook="avp-badge"]')
            ?.textContent.trim() || false;
        if (avpBadge === "Verified Purchase") {
          avpBadge = true;
        }
        const message = card
          .querySelector('span[data-hook="review-body"] > span')
          ?.textContent.trim();
        let helpfulVoteStatement =
          card
            .querySelector('span[data-hook="helpful-vote-statement"]')
            ?.textContent.trim() || 0;

        if (helpfulVoteStatement) {
          if (helpfulVoteStatement.includes(" people found this helpful")) {
            helpfulVoteStatement = helpfulVoteStatement.replace(
              " people found this helpful"
            );
            helpfulVoteStatement = parseInt(helpfulVoteStatement);
          } else if (
            helpfulVoteStatement.includes(" person found this helpful")
          ) {
            helpfulVoteStatement = 1;
          }
        }

        let imglinks = Array.from(
          card.querySelectorAll(
            'div[class="review-image-tile-section"] span > a > img'
          )
        ).map((img) => {
          let src = img.src;
          return src;
        });
        if (!imglinks.length > 0) {
          imglinks = false;
        }

        return {
          reviewId,
          profileName,
          rating,
          subject,
          date,
          location,
          style,
          avpBadge,
          message,
          helpfulVoteStatement,
          imglinks,
        };
      })
    );

    arrSize.push(reviewsData.length);

    if (arrSize.length > 2) {
      if (arrSize[arrcount - 1] == reviewsData.length) {
        pageCount++;
      }
    }
    // Remove duplicates based on the profileName property
    reviewsData = removeDuplicatesByProperty(
      [...reviewsData, ...reviewCards],
      "message"
    );

    currentPage++;

    if (reviewsData.length >= limit) {
      reviewsData = reviewsData.slice(0, limit);
      break;
    }

    // If the next page button is not present, exit the loop
    const nextPageButtonDisabled = await page.evaluate(() => {
      const nextButton = document.querySelector(".a-pagination .a-last");
      return nextButton && nextButton.getAttribute("aria-disabled") === "true";
    });

    if (pageCount > 2) {
      break;
    }

    if (nextPageButtonDisabled) {
      break;
    }
  }

  await browser.close();
  return reviewsData;
};

const getProductInformation = async (url, rootUrl, $) => {
  let productInfoObj = {};
  let loopCount = 0;
  let refreshCount = 0;
  const names = []; //initializing names array to store more children name data
  const values = []; //initializing values array to store more children value data
  for (;;) {
    if (loopCount < 1) {
      loopCount++;
      // console.log(
      //   "Prod Product Info: " +
      //     Boolean(getProductInfo) +
      //     ", get Asin: " +
      //     Boolean(getAsin)
      // );
      let productInfo = $(".a-section", "#prodDetails").contents();

      productInfo.each((i, el) => {
        //locating the product information data and returning contents to find children
        let j = 1;
        while (
          // running while loop to parse product information data untill a selector set equals false
          $(
            `#productDetails_techSpec_section_${i} > tbody > tr:nth-child(${j}) > th`
          ).text() ||
          $(
            `#productDetails_detailBullets_sections${i} > tbody > tr:nth-child(${j}) > th`
          ).text()
        ) {
          if (
            // conditional statment to find all product summary and brand data
            $(
              `#productDetails_techSpec_section_${i} > tbody > tr:nth-child(${j}) > th`
            ).text()
          ) {
            let tempName = $(
              `#productDetails_techSpec_section_${i} > tbody > tr:nth-child(${j}) > th`
            ) //initializing temporary names variable to store child's names (left side column) (located with selector)
              .text()
              .replaceAll("\n", "");
            if (tempName.substring(0, 2) == "  ") {
              tempName = tempName.substring(1, tempName.length - 1);
            }
            tempName = tempName.substring(1, tempName.length - 1);

            let tempVal = $(
              `#productDetails_techSpec_section_${i} > tbody > tr:nth-child(${j}) > td`
            ) //initializing temporary vaules variable to store child's values (right side column) (located with selector)
              .text()
              .replaceAll("                ", "")
              .replaceAll("\n", "");
            tempVal = tempVal.substring(1, tempVal.length - 1);
            names.push(tempName);
            values.push(tempVal);
          }
          if (
            // conditional statment to find all product additional information data
            $(
              `#productDetails_detailBullets_sections${i}> tbody > tr:nth-child(${j}) > th`
            ).text()
          ) {
            let tempVal;

            let tempName = $(
              `#productDetails_detailBullets_sections${i} > tbody > tr:nth-child(${j}) > th`
            ).text(); //initializing temporary names variable to store child's names (left side column) (located with selector)
            if (tempName.substring(0, 2) == "  ") {
              tempName = tempName.substring(1, tempName.length - 1);
            }
            if (tempName[0] == " ") {
              tempName = tempName.substring(1, tempName.length);
            }

            tempName = tempName.substring(0, tempName.length - 1);

            if (tempName == "Best Sellers Rank") {
              tempVal = $(
                `#productDetails_detailBullets_sections${i} > tbody > tr:nth-child(${j}) > td`
              )
                .text()
                .replaceAll("    ", "")
                .replaceAll("   ", "")
                .split("#");
              tempVal.shift();
              for (let i = 0; i < tempVal.length; i++) {
                if (tempVal[i]) {
                  tempVal[i] = "#" + tempVal[i];
                }
              }
              let k = 1;
              let templinksUrls = [];
              let tempLinkCount = 0;
              while (true) {
                let templinks = $(
                  `#productDetails_detailBullets_sections${i} > tbody > tr:nth-child(${j}) > td > span > span:nth-child(${k}) > a`
                ).attr("href");
                if (templinks) {
                  templinksUrls.push(rootUrl + templinks);
                } else {
                  if (tempLinkCount > 5) {
                    break;
                  }
                  tempLinkCount++;
                }
                k++;
              }

              let rankUrls = "Category Rank URLs";

              names.push(tempName);
              values.push(tempVal);
              names.push(rankUrls);
              values.push(templinksUrls);
            } else {
              tempVal = $(
                `#productDetails_detailBullets_sections${i} > tbody > tr:nth-child(${j}) > td`
              ) //initializing temporary vaules variable to store child's values (right side column) (located with selector)
                .text()
                .replaceAll("                ", "")
                .replaceAll("\n", "")
                .split("                         ");
              tempVal = tempVal[tempVal.length - 1]
                .replace("    ", "")
                .replace("  ", "");
              tempVal = tempVal.substring(1, tempVal.length - 1);

              names.push(tempName); // pushing/saving all found names to names array
              values.push(tempVal); // pushing/saving all found values to values array
            }
          }
          j++;
        }
      });

      for (let i = 0; i < values.length; i++) {
        productInfoObj[`${names[i]}`] = values[i]; // pushing/saving all found values to product information object
      }

      if (Object.keys(productInfoObj).length > 0) {
        return productInfoObj;
      }
    } else if (refreshCount > 1) {
      productInfoObj =
        "Product does not have a visible techincal information section.";
      return productInfoObj;
    } else {
      // conditional statment to run request if customer review object has no size
      let crHTMLData;
      userAgent = randomUserAgent();
      // console.log("Start of Customer Reviews Fetch", timeStamp());
      crHTMLData = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent, // custom dynamic user-agent to avoid bot detection and blocking
        },
      })
        .then((res) => {
          // console.log("Coverting Binary of Fetch", timeStamp());
          return res.text();
        })
        .catch((err) => {
          console.log(err);
        });
      // console.log("Return of Customer Reviews Fetch", timeStamp());
      $ = cheerio.load(crHTMLData); // loading responce data into cheerio framework for parsing
      loopCount = 0;
      refreshCount++;
    }
  }
};

const getCustomerReviews = async (url, $) => {
  const names = []; //initializing names array to store more children name data
  const values = []; //initializing values array to store more children value data
  let customReviewsObj = {}; //initializing customer review object
  let loopCount = 0;

  for (;;) {
    loopCount++;
    // essentially a while loop
    if (loopCount < 2) {
      // console.log("Start of Customer Reviews Loop", timeStamp());
      const customReviews_scores = $("#histogramTable > tbody") // locating child's child's contents (located with selctor)
        .children()
        .children()
        .contents();

      customReviews_scores.each((i, el) => {
        let tempName = $(
          //initializing temporary name variable to store child's names (located with selector)
          `#histogramTable > tbody > tr:nth-child(${i}) > td.aok-nowrap > span.a-size-base > a`
        )
          .text()
          .replaceAll("            ", "")
          .replaceAll("          ", "")
          .replaceAll("\n", "");
        let tempVal = $(
          //initializing temporary value variable to store child's values (located with selector)
          `#histogramTable > tbody > tr:nth-child(${i}) > td.a-text-right.a-nowrap > span.a-size-base > a`
        )
          .text()
          .replaceAll("            ", "")
          .replaceAll("          ", "")
          .replaceAll("\n", "")
          .replaceAll(" ", "");
        if (tempName && tempVal) {
          names.push(tempName); // pushing/saving all found names to names array
          values.push(tempVal); // pushing/saving all found values to values array
        }
      });

      for (let i = 0; i < values.length; i++) {
        customReviewsObj[names[i]] = values[i]; // pushing/saving all (names, values) to customer review object array
      }

      if (Object.keys(customReviewsObj).length) {
        // conditional statment to check customer review object has a size
        // console.log("End of Customer Reviews Loop", timeStamp());
        return customReviewsObj;
      } else {
        // console.log("page was refreashed " + loopCount);
        // conditional statment to run request if customer review object has no size
        // console.log("Customer Reviews Not Found Loop", timeStamp());
        let crHTMLData;
        userAgent = randomUserAgent();
        // console.log("Start of Customer Reviews Fetch", timeStamp());
        crHTMLData = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": userAgent, // custom dynamic user-agent to avoid bot detection and blocking
          },
        })
          .then((res) => {
            // console.log("Coverting Binary of Fetch", timeStamp());
            return res.text();
          })
          .catch((err) => {
            console.log(err);
          });
        // console.log("Return of Customer Reviews Fetch", timeStamp());
        $ = cheerio.load(crHTMLData); // loading responce data into cheerio framework for parsing
      }
    } else {
      for (let j = 1; j < 6; j++) {
        let tempName = `${j} star`;
        names.push(tempName);
        let tempVal = "0%";
        values.push(tempVal);
      }
      for (let i = 0; i < values.length; i++) {
        customReviewsObj[names[i]] = values[i]; // pushing/saving all (names, values) to customer review object array
      }
      return customReviewsObj;
    }
  }
};

const removeDuplicatesByProperty = (arr, prop) => {
  return arr.filter(
    (obj, index, self) => index === self.findIndex((o) => o[prop] === obj[prop])
  );
};
