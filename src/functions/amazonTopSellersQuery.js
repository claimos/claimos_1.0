import axios from "axios";
import cheerio from "cheerio";
import { randomUserAgent } from "./userAgents.js";

export const getAmazonTopSellers = async (
  rankUrls,
  topsellerURL,
  limit,
  getProductImageData
) => {
  let userAgent;
  let HTMLData;
  let topSellersObj = {};

  if (topsellerURL) {
    let arraylim = parseInt(limit / rankUrls.length);
    for (let i = 0; i < rankUrls.length; i++) {
      if (i == rankUrls.length - 1) {
        arraylim = limit - arraylim * (rankUrls.length - 1);
      }
      let topsellerslistArr = [];
      let url = rankUrls[i];
      let pageNum = 1;
      let whileTrue = true;
      while (whileTrue) {
        userAgent = randomUserAgent();
        let data = await axios
          .get(url, {
            headers: {
              Accept: "application/json",
              "User-Agent": userAgent,
            },
          })
          .then((responce) => {
            HTMLData = responce.data;
            let $ = cheerio.load(HTMLData);
            const list = $(".a-container");
            list.each(async (i, el) => {
              let categoryTitle = $(".a-size-large").text().split(" in ")[1];

              let imageUrls = [];
              let imageIDs = [];

              if (getProductImageData) {
                let idData = $(".p13n-sc-uncoverable-faceout").map(
                  (index, el) => {
                    if (el.attribs.id) {
                      imageIDs.push(el.attribs.id);
                    }
                  }
                );

                idData = "";

                let imageData = $(".a-dynamic-image").each((i, el) => {
                  if (
                    el.attribs.alt &&
                    el.attribs.src &&
                    el.attribs.height &&
                    imageIDs[i]
                  ) {
                    imageUrls.push({
                      id: imageIDs[i],
                      src: el.attribs.src,
                      alt: el.attribs.alt,
                      height: el.attribs.height,
                      width: el.attribs.height === "200px" ? "300px" : "85px",
                    });
                  }
                });

                imageData = "";
              }

              let topsellerslist = $(".p13n-desktop-grid").attr(
                "data-client-recs-list"
              );

              try {
                topsellerslist = JSON.parse(topsellerslist);
              } catch (e) {
                console.log(topsellerslist);
              }

              if (topsellerslist.length > 2) {
                for (let j = 0; j < topsellerslist.length; j++) {
                  if (imageUrls[j]) {
                    if (imageUrls[j].id === topsellerslist[j].id) {
                      topsellerslist[j]["imageData"] = imageUrls[j];
                      topsellerslist[j]["rank"] =
                        topsellerslist[j].metadataMap["render.zg.rank"];
                      if (
                        parseInt(
                          topsellerslist[j].metadataMap["render.zg.rank"][
                            topsellerslist[j].metadataMap["render.zg.rank"]
                              .length - 1
                          ]
                        ) === 1
                      ) {
                        topsellerslist[j]["rank"] += "st in " + categoryTitle;
                      } else if (
                        parseInt(
                          topsellerslist[j].metadataMap["render.zg.rank"][
                            topsellerslist[j].metadataMap["render.zg.rank"]
                              .length - 1
                          ]
                        ) === 2
                      ) {
                        topsellerslist[j]["rank"] += "nd in " + categoryTitle;
                      } else if (
                        parseInt(
                          topsellerslist[j].metadataMap["render.zg.rank"][
                            topsellerslist[j].metadataMap["render.zg.rank"]
                              .length - 1
                          ]
                        ) === 3
                      ) {
                        topsellerslist[j]["rank"] += "rd in " + categoryTitle;
                      } else {
                        topsellerslist[j]["rank"] += "th in " + categoryTitle;
                      }
                    }
                  }

                  if (categoryTitle) {
                    topsellerslist[j]["category"] = categoryTitle;
                  }

                  if (topsellerslistArr.length >= arraylim) {
                    topsellerslistArr.map(
                      (item, index) => index <= arraylim && item
                    );
                    whileTrue = false;
                  } else {
                    topsellerslistArr.push(topsellerslist[j]);
                  }
                }
                pageNum++;
                url = rankUrls[i] + "?pg=" + pageNum;
              } else {
                whileTrue = false;
              }
            });
          })
          .catch((e) => {});
      }
      topSellersObj[`link_${i + 1}`] = topsellerslistArr;
    }
    return topSellersObj;
  } else {
    let url;
    let index;
    let topsellerslistArr = [];

    if (rankUrls.length == 1) {
      url = rankUrls[0];
      index = 0;
    } else if (rankUrls.length >= 2) {
      url = rankUrls[1];
      index = 1;
    }

    let pageNum = 1;
    let errorCount = 0;
    let whileTrue = true;

    while (whileTrue) {
      if (errorCount === 10) {
        whileTrue = false;
      }

      userAgent = randomUserAgent();
      let data = await axios
        .get(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": userAgent,
          },
        })
        .then((responce) => {
          HTMLData = responce.data;
          let $ = cheerio.load(HTMLData);
          const list = $(".a-container");
          list.each(async (i, el) => {
            let categoryTitle = $(".a-size-large").text().split(" in ")[1];

            let imageUrls = [];
            let imageIDs = [];

            if (getProductImageData) {
              let idData = $(".p13n-sc-uncoverable-faceout").map(
                (index, el) => {
                  if (el.attribs.id) {
                    imageIDs.push(el.attribs.id);
                  }
                }
              );

              idData = "";

              let imageData = $(".a-dynamic-image").each((i, el) => {
                if (
                  el.attribs.alt &&
                  el.attribs.src &&
                  el.attribs.height &&
                  imageIDs[i]
                ) {
                  imageUrls.push({
                    id: imageIDs[i],
                    src: el.attribs.src,
                    alt: el.attribs.alt,
                    height: el.attribs.height,
                    width: el.attribs.height === "200px" ? "300px" : "85px",
                  });
                }
              });

              imageData = "";
            }

            let topsellerslist = $(".p13n-desktop-grid").attr(
              "data-client-recs-list"
            );

            // console.log(topsellerslist);

            try {
              topsellerslist = JSON.parse(topsellerslist);
            } catch (e) {
              // console.log(topsellerslist);
            }

            if (Array.isArray(topsellerslist)) {
              for (let j = 0; j < topsellerslist.length; j++) {
                if (imageUrls[j]) {
                  if (imageUrls[j].id === topsellerslist[j].id) {
                    topsellerslist[j]["imageData"] = imageUrls[j];

                    topsellerslist[j]["rank"] =
                      topsellerslist[j].metadataMap["render.zg.rank"];
                    if (
                      parseInt(
                        topsellerslist[j].metadataMap["render.zg.rank"][
                          topsellerslist[j].metadataMap["render.zg.rank"]
                            .length - 1
                        ]
                      ) === 1
                    ) {
                      topsellerslist[j]["rank"] += "st in " + categoryTitle;
                    } else if (
                      parseInt(
                        topsellerslist[j].metadataMap["render.zg.rank"][
                          topsellerslist[j].metadataMap["render.zg.rank"]
                            .length - 1
                        ]
                      ) === 2
                    ) {
                      topsellerslist[j]["rank"] += "nd in " + categoryTitle;
                    } else if (
                      parseInt(
                        topsellerslist[j].metadataMap["render.zg.rank"][
                          topsellerslist[j].metadataMap["render.zg.rank"]
                            .length - 1
                        ]
                      ) === 3
                    ) {
                      topsellerslist[j]["rank"] += "rd in " + categoryTitle;
                    } else {
                      topsellerslist[j]["rank"] += "th in " + categoryTitle;
                    }
                  }
                }

                if (categoryTitle) {
                  topsellerslist[j]["category"] = categoryTitle;
                }

                if (topsellerslistArr.length >= limit) {
                  topsellerslistArr.map(
                    (item, index) => index <= limit && item
                  );
                  whileTrue = false;
                } else {
                  topsellerslistArr.push(topsellerslist[j]);
                }
              }
              pageNum++;
              url = rankUrls[index] + "?pg=" + pageNum;
            } else {
              whileTrue = false;
              // console.log(topsellerslist);
            }
          });
        })
        .catch((e) => {
          // Used to stop the program if encounters multiple errors
          //
          errorCount++;
        });
    }
    topSellersObj[`link_${index + 1}`] = topsellerslistArr;

    return topSellersObj;
  }
};
