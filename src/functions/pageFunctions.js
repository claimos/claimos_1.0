import Axios from "axios";
export const popupCenter = async ({
  url,
  title,
  w,
  h,
  state,
  location,
  params,
}) => {
  // Fixes dual-screen position                             Most browsers      Firefox
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `
      scrollbars=yes,
      width=${w / systemZoom}, 
      height=${h / systemZoom}, 
      top=${top}, 
      left=${left}
      `
  );

  if (window.focus) newWindow.focus();

  let count = 0;
  const myInterval = setInterval(() => {
    try {
      count += 1;
      if (count < 599) {
        Axios.get("http://localhost:8080/sign-in")
          .then(async (responce) => {
            if (responce.data.loggedIn === true) {
              newWindow.close();
              // console.log("object")

              if (window.location.pathname.includes("sign-up")) {
                Axios.defaults.withCredentials = false;
                let userIPInfo = "";

                await Axios.get("https://api.db-ip.com/v2/free/self").then(
                  (response) => {
                    userIPInfo = JSON.stringify(response.data);
                  }
                );

                Axios.defaults.withCredentials = true;

                await Axios.post(
                  "http://localhost:8080/linkedin-auth/sign-up/extended",
                  { userIPInfo: userIPInfo }
                ).then((response) => {
                  if (response.data === "OK") {
                    window.location.href = "/onboarding/early-bird";
                  }
                });
              } else if (
                state ||
                (params.get("after") &&
                  params.get("billingCycle") &&
                  params.get("plan"))
              ) {
                if (params.get("after") === "checkout") {
                  window.location.href = `/subscriptions/checkout?billingCycle=${params.get(
                    "billingCycle"
                  )}&plan=${params.get("plan")}`;
                } else if (state) {
                  window.location.href = state.from || "/";
                } else {
                  window.location.href = "/";
                }
              } else {
                window.location.href = "/";
              }

              clearInterval(myInterval);
            }
            if (location.includes("/sign-up")) {
              if (
                responce.data.accountError.includes(
                  "You already have a Claimos account."
                )
              ) {
                newWindow.close();
                window.location.href = "/users/sign-in";
                clearInterval(myInterval);
              }
            }
          })
          .catch((e) => {});
      } else {
        newWindow.close();
        clearInterval(myInterval);
      }
    } catch (e) {}
  }, [100]);
};

// Given any array of products and category, will take the top 10 of the products that match that category,
// not including the the product whos asin matches productAsin, and return an array
// with each element being the top 10 products about section.
//
export const getProductsAboutArr = (
  products,
  productAsin,
  category,
  setAboutArr,
  setCategory
) => {
  let aboutArr = [];

  if (Array.isArray(products) && typeof category === "string") {
    let count = 0;
    let hasCategory = false;

    if (products.every((item) => item.rank)) {
      hasCategory = products.some(
        (item) =>
          item.rank.split(" in ")[1].toLowerCase() === category.toLowerCase()
      );
    }

    products.map((item, index) => {
      if (hasCategory) {
        let productCategory = item.rank || "";

        if (productCategory) {
          productCategory = productCategory.split(" in ")[1];

          if (
            count < 10 &&
            item.asin != productAsin &&
            productCategory.toLowerCase() == category.toLowerCase()
          ) {
            let aboutStr = "";

            const productAbout = item.relatedProductPage
              ? item.relatedProductPage.about
              : item.about;

            if (Array.isArray(productAbout)) {
              aboutStr = productAbout.join(" - ");
              aboutArr.push(aboutStr);
              count++;
            } else {
              count++;
            }
          }
        }
      } else {
        if (count < 10 && item.asin != productAsin) {
          if (index === 0 || index === 1) {
            setCategory(item.rank.split(" in ")[1]);
          }

          let aboutStr = "";

          const productAbout = item.relatedProductPage
            ? item.relatedProductPage.about
            : item.about;

          if (Array.isArray(productAbout)) {
            aboutStr = productAbout.join(" - ");
            aboutArr.push(aboutStr);
            count++;
          } else {
            count++;
          }
        }
      }
    });

    setAboutArr(aboutArr);

    return aboutArr;
  } else {
    return "Products must be an array of objects";
  }
};

// Given any array of products and category, will take the top 10 of the products that match that category,
// not including the the product whos asin matches productAsin, and return an array
// with each element being the top 10 products ingredients section.
//
export const getProductsIngredientsArr = (
  products,
  productAsin,
  category,
  setCategory
) => {
  let IngredientsArr = [];

  if (Array.isArray(products) && typeof category === "string") {
    let count = 0;
    let hasCategory = false;

    if (products.every((item) => item.rank)) {
      hasCategory = products.some(
        (item) =>
          item.rank.split(" in ")[1].toLowerCase() === category.toLowerCase()
      );
    }

    products.map((item, index) => {
      if (hasCategory) {
        let productCategory = item.rank || "";

        if (productCategory) {
          productCategory = productCategory.split(" in ")[1];

          if (
            count < 10 &&
            item.asin != productAsin &&
            productCategory.toLowerCase() == category.toLowerCase()
          ) {
            const productIngredients = item.importantInformation
              ? item.importantInformation.Ingredients || ""
              : "";

            if (productIngredients) {
              IngredientsArr.push(productIngredients);
              count++;
            } else {
              count++;
            }
          }
        }
      } else {
        if (count < 10 && item.asin != productAsin) {
          if (index === 0 || index === 1) {
            setCategory(item.rank.split(" in ")[1]);
          }

          const productIngredients = item.importantInformation
            ? item.importantInformation.Ingredients || ""
            : "";

          if (productIngredients) {
            IngredientsArr.push(productIngredients);
            count++;
          } else {
            count++;
          }
        }
      }
    });

    return IngredientsArr;
  } else {
    return "Products must be an array of objects";
  }
};
