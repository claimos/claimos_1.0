import {
  cosineSimilarity,
  calcTfIdfVectorForDoc,
  omitPunctuations,
  toLowercase,
} from "./impactScoreTools.js";

import { avoidWords } from "./ftcComplienceScoreTools.js";

import { lexicon } from "./lexicon.js";

import {
  TextAnalyticsClient,
  AzureKeyCredential,
} from "@azure/ai-text-analytics";

const client = new TextAnalyticsClient(
  "YOUR-AZURE-CLIENT-URL",
  new AzureKeyCredential("YOUR-CLIENT-SECRET")
);

export const impactScore = (str, strArray) => {
  let score = 0;

  if (Array.isArray(str)) {
    str = str
      .join(" ")
      .replaceAll(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ""
      )
      .replaceAll(/\s{2,}/g, " ");
    const str1Words = str
      .trim()
      .split(" ")
      .map(omitPunctuations)
      .map(toLowercase)
      .filter((item) => item.length > 0);

    let cosineSimilarityScoreArr = [];

    for (let i = 0; i < strArray.length; i++) {
      let str2 = strArray[i].join(" ");
      str2 = str2
        .replaceAll(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ""
        )
        .replaceAll(/\s{2,}/g, " ");

      const str2Words = str2
        .trim()
        .split(" ")
        .map(omitPunctuations)
        .map(toLowercase)
        .filter((item) => item.length > 0);

      const allWordsUnique = Array.from(new Set(str1Words.concat(str2Words)));
      const str1Vector = calcTfIdfVectorForDoc(
        str1Words,
        [str2Words],
        allWordsUnique
      );

      const str2Vector = calcTfIdfVectorForDoc(
        str2Words,
        [str1Words],
        allWordsUnique
      );

      cosineSimilarityScoreArr.push(cosineSimilarity(str1Vector, str2Vector));
    }
    const average =
      cosineSimilarityScoreArr.reduce((p, c) => p + c, 0) /
      cosineSimilarityScoreArr.length;
    score = Math.round(100 * (average * (7.5 / 2.5)));

    if (score > 100) {
      score = 100;
    }
  }

  return score;
};

export const sentimentScore = async (str) => {
  let score = 0;
  let sentimentDataArr = [];
  const sentiment = await client
    .analyzeSentiment(str)
    .then((res) => {
      for (const data of res) {
        let quotient = 100 / res.length;
        if (data.error === undefined) {
          try {
            let posScore = data.confidenceScores["positive"] * 1 * quotient;
            let nueScore =
              Math.round(
                10 * (data.confidenceScores["neutral"] * 0.5 * quotient)
              ) / 10;
            let negScore =
              Math.round(10 * (data.confidenceScores["negative"] * quotient)) /
              10;
            let sentimentScore = posScore + nueScore - negScore;
            score += sentimentScore;
          } catch (e) {
            console.log(e);
          }
        }
      }
      if (score > 100) {
        score = 100;
      }
    })
    .catch((e) => {});

  return Math.round(score);
};

export const ftcComplienceScore = (str) => {
  if (Array.isArray(str)) {
    str = str.join(" ");
    str = str.toLowerCase();
    str = omitPunctuations(str);
    let score = 100;

    let wordsFound = [];

    for (let i = 0; i < avoidWords.length; i++) {
      let indexes = [
        ...str.matchAll(new RegExp(avoidWords[i].toLowerCase() + " ", "gi")),
      ].map((a) => a.index);
      let indexsLen = indexes.length;
      if (indexsLen > 0) {
        for (let j = 0; j < indexsLen; j++) {
          wordsFound.push(avoidWords[i]);
        }

        score -= indexsLen * 4;
      }
    }

    if (score < 0) {
      score = 0;
    }
    return { score: score, wordsFound: wordsFound };
  } else {
    return NaN;
  }
};

export const wordSentiment = async (strArr) => {
  let wordSentimentObj = {};

  for (let i = 0; i < strArr.length; i++) {
    let compound_list = [];
    let words = strArr[i].split(" ");
    wordSentimentObj[`${i}`] = [];
    wordSentimentObj[`${i}`]["phrases"] = [];
    wordSentimentObj["phrases"] = [];

    let savedVals = [];
    let phrases = [];
    for (let j = 0; j < words.length; j++) {
      let omit = false;
      wordSentimentObj[i][j] = {};

      let word = words[j].toLowerCase();
      // console.log("word: ", word);
      // console.log("punctuation: ", Boolean(word[word.length-1].includes(".")));
      if (word[word.length - 1] === ".") {
        omit = true;
      }
      word = omitPunctuations(word);
      if (word && !avoidWords.includes(word)) {
        let value = lexicon[`${word.toLowerCase()}`];
        let colour;
        let colourIntesity;
        let hexValue;
        let alpha;
        let hexOpacity;

        if (!value) {
          value = 0;
          hexValue = "#28323B";
        } else if (value > 0) {
          // console.log("positive word: ", word);
          // colourIntesity = Math.abs(value) / 4 * 100;
          // alpha = Math.round(colourIntesity);
          // console.log("word alpha: ", alpha);
          // hexOpacity = hexOpacityObj[`${alpha}`];
          // console.log("word hexOpacity: ", hexOpacity);
          // hexValue = "#0198" + hexOpacity;
          hexValue = "#019881";
          // console.log("word hexValue: ", hexValue);
          if (!omit) {
            savedVals.push({
              word: word,
              index: j,
              value: value,
              sentiment: "positive",
            });
          }
        } else if (value < 0) {
          // console.log("neg word: ", word);
          // colourIntesity = Math.abs(value) / 4 * 100;
          // alpha = Math.round(colourIntesity);
          // console.log("word alpha: ", alpha);
          // hexOpacity = hexOpacityObj[`${alpha}`];
          // console.log("word hexOpacity: ", hexOpacity);
          // hexValue = "#ff00" + hexOpacity;
          // console.log("word hexValue: ", hexValue);
          hexValue = "#ff0000";
          if (!omit) {
            savedVals.push({
              word: word,
              index: j,
              value: value,
              sentiment: "negitive",
            });
          }
        }

        if (savedVals.length > 1) {
          if (value > 0 || value < 0) {
            if (savedVals[savedVals.length - 2].word != word) {
              if (savedVals[savedVals.length - 2].index === j - 1) {
                if (value < 0) {
                  value = Math.abs(value);
                  hexValue = "#019881";
                }
                if (savedVals[savedVals.length - 2].sentiment === "negitive") {
                  let oppVal = Math.abs(
                    wordSentimentObj[i][j - 1]["sentimentValue"]
                  );
                  hexValue = "#019881";

                  wordSentimentObj[i][j - 1]["sentimentValue"] = oppVal;
                  wordSentimentObj[i][j - 1]["hexCode"] = hexValue;
                }
                let counter = 2;
                let newVal = Math.round(
                  Math.abs(savedVals[savedVals.length - 2].value) + value
                );
                let phrase = savedVals[savedVals.length - 2].word + " " + word;
                for (let k = savedVals.length - 3; k > 0; k--) {
                  if (savedVals[k].index === j - counter) {
                    if (savedVals[k].sentiment === "negitive") {
                      wordSentimentObj[i][j - counter]["sentimentValue"] =
                        Math.abs(
                          wordSentimentObj[i][j - counter]["sentimentValue"]
                        );
                    }
                    newVal += savedVals[k].value;
                    phrase = savedVals[k].word + " " + phrase;
                    if (
                      wordSentimentObj[`${i}`]["phrases"].includes(
                        wordSentimentObj[`${i}`]["phrases"][
                          wordSentimentObj[`${i}`]["phrases"].length - 1
                        ]
                      )
                    ) {
                      wordSentimentObj[`${i}`]["phrases"].pop();
                    }
                  } else {
                    break;
                  }
                }
                if (!wordSentimentObj[`${i}`]["phrases"].includes(phrase)) {
                  wordSentimentObj[`${i}`]["phrases"].push(phrase);
                  /// gets deleted every push for some reason
                }
                if (!wordSentimentObj["phrases"].includes(phrase)) {
                  wordSentimentObj["phrases"].push(phrase);
                  if (wordSentimentObj["phrases"].length > 1) {
                    if (
                      wordSentimentObj["phrases"][
                        wordSentimentObj["phrases"].length - 1
                      ].includes(phrase)
                    ) {
                      wordSentimentObj["phrases"].pop();
                    }
                  }
                }
              }
            }
          }
        }

        wordSentimentObj[i][j]["word"] = word;
        wordSentimentObj[i][j]["sentimentValue"] = value;
        wordSentimentObj[i][j]["hexCode"] = hexValue;
      }
    }
  }
  return wordSentimentObj;
};

const hexOpacityObj = {
  100: "FF",
  99: "FC",
  98: "FA",
  97: "F7",
  96: "F5",
  95: "F2",
  94: "F0",
  93: "ED",
  92: "EB",
  91: "E8",
  90: "E6",
  89: "E3",
  88: "E0",
  87: "DE",
  86: "DB",
  85: "D9",
  84: "D6",
  83: "D4",
  82: "D1",
  81: "CF",
  80: "CC",
  79: "C9",
  78: "C7",
  77: "C4",
  76: "C2",
  75: "BF",
  74: "BD",
  73: "BA",
  72: "B8",
  71: "B5",
  70: "B3",
  69: "B0",
  68: "AD",
  67: "AB",
  66: "A8",
  65: "A6",
  64: "A3",
  63: "A1",
  62: "9E",
  61: "9C",
  60: "99",
  59: "96",
  58: "94",
  57: "91",
  56: "8F",
  55: "8C",
  54: "8A",
  53: "87",
  52: "85",
  51: "82",
  50: "80",
  49: "7D",
  48: "7A",
  47: "78",
  46: "75",
  45: "73",
  44: "70",
  43: "6E",
  42: "6B",
  41: "69",
  40: "66",
  39: "63",
  38: "61",
  37: "5E",
  36: "5C",
  35: "59",
  34: "57",
  33: "54",
  32: "52",
  31: "4F",
  30: "4D",
  29: "4A",
  28: "47",
  27: "45",
  26: "42",
  25: "40",
  24: "3D",
  23: "3B",
  22: "38",
  21: "36",
  20: "33",
  19: "30",
  18: "2E",
  17: "2B",
  16: "29",
  15: "26",
  14: "24",
  13: "21",
  12: "1F",
  11: "1C",
  10: "1A",
  9: "17",
  8: "14",
  7: "12",
  6: "0F",
  5: "0D",
  4: "0A",
  3: "08",
  2: "05",
  1: "03",
  0: "00",
};
