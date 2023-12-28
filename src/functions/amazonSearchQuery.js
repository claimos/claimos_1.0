import axios from "axios";
import cheerio from "cheerio";
import CC from "currency-converter-lt";
import fs from "fs";

import { randomUserAgent } from "./userAgents.js";

let userAgent = randomUserAgent();

export const getAmazonProductSearchList = async (
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
) => {
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

  // let currency;
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

  let searchUrl = `https://www.amazon.${contryURL}/s?k=${productKeyword}`;
  let KeywordComapreindex = [
    ...productKeyword.matchAll(
      new RegExp("(\\w)(\\d)(\\w)(\\d)(\\w)(\\d)(\\w)(\\w)(\\w)(\\w)", "gi")
    ),
  ].map((a) => a.index);
  let key = productKeyword.substring(
    KeywordComapreindex[0],
    KeywordComapreindex[0] + 10
  );
  if (key) {
    searchUrl = `https://www.amazon.${contryURL}/dp/${productKeyword}`;
  }

  let page = 2;
  let items = [];

  let HTMLData;
  let data = await axios
    .get(searchUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
    })
    .then((responce) => {
      HTMLData = responce.data;
    });
  data = {};

  while (true) {
    let itemsPush = true;
    const $ = cheerio.load(HTMLData);
    const list = $(".s-widget-spacing-small");

    // console.log(l;

    list.each(async (i, el) => {
      let asin = "";

      if (getAsin) {
        asin = el.attribs[`data-asin`];

        if (items.some((item) => item.asin === asin)) {
        } else {
          itemsPush = true;
          let description;
          let productName;
          let sellerName;
          if (
            getSearchProductDescription ||
            getProductName ||
            getProductSellerName ||
            bySeller
          ) {
            if ($(el).find(".a-size-medium").text()) {
              description = $(el).find(".a-size-medium").text();
            }
            if ($(el).find(".a-size-mini").text()) {
              description = $(el).find(".a-size-mini").text();
            }
            if ($(el).find(".a-size-large").text()) {
              description = $(el).find(".a-size-mini").text();
            }
            description = description.replaceAll("|", "").replaceAll("  ", "");

            var descArray = description.replaceAll("|", ",");
            descArray = descArray.replaceAll("  ", ",").split(",");
            if (
              descArray[0][descArray[0].length] == "&" ||
              descArray[0][descArray[0].length] == "-"
            ) {
              descArray[0] = descArray[0].substring(0, descArray[0].length - 1);
            }
            productName = descArray[0];
            sellerName = descArray[0].split(" ");
            sellerName = sellerName[0];
            if (bySeller) {
              if (bySeller == sellerName[0]) {
              } else {
                itemsPush = false;
              }
            }
          }
          let price;
          if (getPrice || priceMin || priceMax) {
            let price_val =
              $(el).find(".a-price-whole").text() +
              $(el).find(".a-price-fraction").text();
            // Not Working
            // let priceConvert = parseFloat(price_val.replaceAll(",", ""));
            // if (price_val) {
            //   if (setCurrency) {
            //     if (!(setCurrency == currency)) {
            //       price_val = convertPrice(currency, setCurrency, priceConvert);
            //       // let currencyConverter = new CC({
            //       //   from: currency,
            //       //   to: setCurrency,
            //       //   amount: priceConvert,
            //       //   isDecimalComma: true,
            //       // });
            //       // await currencyConverter.convert().then((response) => {
            //       //   price_val = response;
            //       // });
            //       // await price_val.then((Response) => {
            //       //   price_val = Response;
            //       // });
            //       currency = setCurrency;
            //       // console.log(
            //       //   "Converted price: " + "$" + price_val + " " + setCurrency
            //       // );
            //     }
            //   }
            // }
            price = "$" + price_val + " " + currency;
          }
          let sponsored = false;
          if (getProductIsSponsored) {
            if (
              $(el).find(".a-color-base").text().substring(0, 9) == "Sponsored"
            ) {
              sponsored = true;
            }
          }
          let imageUrl;
          if (getProductImageLink) {
            imageUrl = $(el).find(".s-image").attr("src");

            // let images = new Image();
            // images.onload = () => {
            //   console.log("Image Size", images.width, images.height);
            // };

            // const image = new Image();
            // image.onload;

            // image.src = imageUrl;

            // console.log(image.src);

            // console.log($(el).find(".s-image").data());
            //   axios({
            //     method: "get",
            //     url: image,
            //     responseType: "stream"
            // }).then(function(response) {
            //     response.data.pipe(fs.createWriteStream(`./images/${image.substring(35)}`))
            // });
          }
          const link = $(el).find(".a-link-normal").attr("href");
          let url;
          if (getProductUrl) {
            url = "https://www.amazon.com/" + link;
          }
          let rating;
          if (getProductRatingScore) {
            rating = $(el).find(".aok-align-bottom .a-icon-alt").text();

            if (rating.length > 0) {
              rating = rating.split(" ")[0] + "/5";
            } else {
              rating = "Product rating not found.";
            }
          }
          let review;
          if (getProductReviewsAmount) {
            review = $(el).find(".s-link-style .s-underline-text").text();
          }
          let nid;
          if (getProductID) {
            nid = $(el).find(".sg-col-inner > div").attr("data-csa-c-item-id");
          }
          if (priceMin || priceMax) {
            let price_compare = parseFloat(price_val);
            if (priceMin && priceMax) {
              if (price_compare >= priceMin && price_compare <= priceMax) {
              } else {
                itemsPush = false;
              }
            } else if (priceMin) {
              if (price_compare >= priceMin) {
              } else {
                itemsPush = false;
              }
            } else if (priceMax) {
              if (price_compare <= priceMax) {
              } else {
                itemsPush = false;
              }
            }
          }
          if (itemsPush) {
            items.push({
              ...(getAsin && { asin: asin }),
              ...(getProductImageLink && { imageUrl: imageUrl }),
              ...(getProductName && { productName: productName }),
              ...(getProductIsSponsored && { sponsoredProduct: sponsored }),
              ...(getProductID && { productId: nid }),
              ...(getProductSellerName && { sellerName: sellerName }),
              ...(getSearchProductDescription && {
                productDescription: description,
              }),
              ...(getProductUrl && { productUrl: url }),
              ...(getSingleProduct && { singleProduct: {} }),
              ...(getPrice && { price: price }),
              ...(getLanguageCode && { languageCode: languageCode }),
              ...(getProductRatingScore && { ratingScore: rating }),
              ...(getProductReviewsAmount && { reviewsAmount: review }),
            });
          }
        }
      } else {
        itemsPush = true;
        let description;
        let productName;
        let sellerName;
        if (
          getSearchProductDescription ||
          getProductName ||
          getProductSellerName ||
          bySeller
        ) {
          if ($(el).find(".a-size-medium").text()) {
            description = $(el).find(".a-size-medium").text();
          }
          if ($(el).find(".a-size-mini").text()) {
            description = $(el).find(".a-size-mini").text();
          }
          if ($(el).find(".a-size-large").text()) {
            description = $(el).find(".a-size-mini").text();
          }
          description = description.replaceAll("|", "").replaceAll("  ", "");

          var descArray = description.replaceAll("|", ",");
          descArray = descArray.replaceAll("  ", ",").split(",");
          if (
            descArray[0][descArray[0].length] == "&" ||
            descArray[0][descArray[0].length] == "-"
          ) {
            descArray[0] = descArray[0].substring(0, descArray[0].length - 1);
          }
          productName = descArray[0];
          sellerName = descArray[0].split(" ");
          sellerName = sellerName[0];
          if (bySeller) {
            if (bySeller == sellerName[0]) {
            } else {
              itemsPush = false;
            }
          }
        }
        let price;
        if (getPrice || priceMin || priceMax) {
          let price_val =
            $(el).find(".a-price-whole").text() +
            $(el).find(".a-price-fraction").text();
          // Not Working
          // let priceConvert = parseFloat(price_val.replaceAll(",", ""));
          // if (price_val) {
          //   if (setCurrency) {
          //     if (!(setCurrency == currency)) {
          //       price_val = convertPrice(currency, setCurrency, priceConvert);
          //       // let currencyConverter = new CC({
          //       //   from: currency,
          //       //   to: setCurrency,
          //       //   amount: priceConvert,
          //       //   isDecimalComma: true,
          //       // });
          //       // await currencyConverter.convert().then((response) => {
          //       //   price_val = response;
          //       // });
          //       // await price_val.then((Response) => {
          //       //   price_val = Response;
          //       // });
          //       currency = setCurrency;
          //       // console.log(
          //       //   "Converted price: " + "$" + price_val + " " + setCurrency
          //       // );
          //     }
          //   }
          // }
          price = "$" + price_val + " " + currency;
        }
        let sponsored = false;
        if (getProductIsSponsored) {
          if (
            $(el).find(".a-color-base").text().substring(0, 9) == "Sponsored"
          ) {
            sponsored = true;
          }
        }
        let imageUrl;
        if (getProductImageLink) {
          imageUrl = $(el).find(".s-image").attr("src");

          // let images = new Image();
          // images.onload = () => {
          //   console.log("Image Size", images.width, images.height);
          // };

          // const image = new Image();
          // image.onload;

          // image.src = imageUrl;

          // console.log(image.src);

          // console.log($(el).find(".s-image").data());
          //   axios({
          //     method: "get",
          //     url: image,
          //     responseType: "stream"
          // }).then(function(response) {
          //     response.data.pipe(fs.createWriteStream(`./images/${image.substring(35)}`))
          // });
        }
        const link = $(el).find(".a-link-normal").attr("href");
        let url;
        if (getProductUrl) {
          url = "https://www.amazon.com/" + link;
        }
        let rating;
        if (getProductRatingScore) {
          rating = $(el).find(".aok-align-bottom .a-icon-alt").text();

          if (rating.length > 0) {
            rating = rating.split(" ")[0] + "/5";
          } else {
            rating = "Product rating not found.";
          }
        }
        let review;
        if (getProductReviewsAmount) {
          review = $(el).find(".s-link-style .s-underline-text").text();
        }
        let nid;
        if (getProductID) {
          nid = $(el).find(".sg-col-inner > div").attr("data-csa-c-item-id");
        }
        if (priceMin || priceMax) {
          let price_compare = parseFloat(price_val);
          if (priceMin && priceMax) {
            if (price_compare >= priceMin && price_compare <= priceMax) {
            } else {
              itemsPush = false;
            }
          } else if (priceMin) {
            if (price_compare >= priceMin) {
            } else {
              itemsPush = false;
            }
          } else if (priceMax) {
            if (price_compare <= priceMax) {
            } else {
              itemsPush = false;
            }
          }
        }
        if (itemsPush) {
          items.push({
            ...(getAsin && { asin: asin }),
            ...(getProductImageLink && { imageUrl: imageUrl }),
            ...(getProductName && { productName: productName }),
            ...(getProductIsSponsored && { sponsoredProduct: sponsored }),
            ...(getProductID && { productId: nid }),
            ...(getProductSellerName && { sellerName: sellerName }),
            ...(getSearchProductDescription && {
              productDescription: description,
            }),
            ...(getProductUrl && { productUrl: url }),
            ...(getSingleProduct && { singleProduct: {} }),
            ...(getPrice && { price: price }),
            ...(getLanguageCode && { languageCode: languageCode }),
            ...(getProductRatingScore && { ratingScore: rating }),
            ...(getProductReviewsAmount && { reviewsAmount: review }),
          });
        }
      }
    });
    if (getNumProducts) {
      if (items.length >= getNumProducts) {
        const newItems = items.filter(
          (item, index) => index <= getNumProducts - 1 && item
        );
        return newItems;
      } else {
        HTMLData = await getMoreListings(
          searchUrl + "&page=" + page.toString()
        );
        page++;
        userAgent = randomUserAgent();
      }
    } else {
      return items;
    }
  }
};

const convertPrice = async (currency, setCurrency, priceConvert) => {
  let price;
  let currencyConverter = new CC({
    from: currency,
    to: setCurrency,
    amount: priceConvert,
    isDecimalComma: true,
  });
  await currencyConverter.convert().then((response) => {
    // console.log("Coverted price: " + response); //or do something else
    price = response;
  });
  return price;
};

const getMoreListings = async (searchUrl) => {
  let HTMLData;
  let data = await axios
    .get(searchUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
    })
    .then((responce) => {
      HTMLData = responce.data;
    });

  return HTMLData;
};
