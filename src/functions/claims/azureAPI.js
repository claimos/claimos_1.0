import {
  TextAnalyticsClient,
  AzureKeyCredential,
} from "@azure/ai-text-analytics";

const client = new TextAnalyticsClient(
  "YOUR-AZURE-CLIENT-URL",
  new AzureKeyCredential("YOUR-CLIENT-SECRET")
);

export const sentimentAnalysis = async (str) => {
  let sentimentDataObj = {};
  sentimentDataObj["sentiments"] = [];
  sentimentDataObj["scores"] = [];
  let sentimentDataArr = [];

  let entitiesDataArr = [];
  let entitiesDataObj = {};
  entitiesDataObj["ids"] = [];
  entitiesDataObj["text"] = [];
  entitiesDataObj["catagories"] = [];
  entitiesDataObj["scores"] = [];

  let scientificEntitiesDataArr = [];
  let scientificEntitiesDataObj = {};
  scientificEntitiesDataObj["ids"] = [];
  scientificEntitiesDataObj["text"] = [];
  scientificEntitiesDataObj["category"] = [];
  scientificEntitiesDataObj["confidenceScore"] = [];
  scientificEntitiesDataObj["offset"] = [];

  let keyWordsArr = [];
  let keyWordsDataObj = {};
  keyWordsDataObj["keywords"] = [];
  keyWordsDataObj["keywords_list"] = [];
  keyWordsDataObj["ids"] = [];

  const sentiment = await client
    .analyzeSentiment(str)
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          let sentimentObj = {};
          sentimentObj["sentiments"] = data.sentiment;
          sentimentObj["scores"] = data.confidenceScores;

          sentimentDataObj["sentiments"].push(data.sentiment);
          sentimentDataObj["scores"].push(data.confidenceScores);
          sentimentDataArr.push(sentimentObj);
        }
      }
    })
    .catch((e) => {});

  const keyWords = await client
    .extractKeyPhrases(str, "en")
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          let keywordsObj = {};
          keywordsObj["id"] = data.id;
          keywordsObj["keywords"] = data.keyPhrases;
          keyWordsDataObj["ids"].push(data.id);

          if (data.keyPhrases.length > 0) {
            for (let i = 0; i < data.keyPhrases.length; i++) {
              if (
                !keyWordsDataObj["keywords_list"].includes(data.keyPhrases[i])
              ) {
                keyWordsDataObj["keywords_list"].push(data.keyPhrases[i]);
              }
            }
          }
          keyWordsDataObj["keywords"].push(data.keyPhrases);
          keyWordsArr.push(keywordsObj);
        }
      }
    })
    .catch((e) => {});

  const entities = await client
    .recognizePiiEntities(str, "en")
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          for (const entity of data.entities) {
            let entitiesObj = {};
            entitiesObj["id"] = data.id;
            entitiesObj["text"] = entity.text;
            entitiesObj["category"] = entity.category;
            entitiesObj["confidenceScore"] = entity.confidenceScore;

            entitiesDataObj["ids"].push(data.id);
            entitiesDataObj["text"].push(entity.text);
            entitiesDataObj["catagories"].push(entity.category);
            entitiesDataObj["scores"].push(entity.confidenceScore);
            entitiesDataArr.push(entitiesObj);
          }
        }
      }
    })
    .catch((e) => {});

  const linkedEntities = await client
    .recognizeLinkedEntities(str, "en")
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          for (const entity of data.entities) {
            for (const match of entity.matches) {
              if (!entitiesDataObj["text"].includes(entity.name)) {
                let entitiesObj = {};
                entitiesObj["id"] = data.id;
                entitiesObj["text"] = entity.text;
                entitiesObj["category"] = entity.category;
                entitiesObj["confidenceScore"] = entity.confidenceScore;

                entitiesDataObj["text"].push(entity.name);
                entitiesDataObj["ids"].push(data.id);
                entitiesDataObj["scores"].push(match.confidenceScore);
                entitiesDataArr.push(entitiesObj);
              }
            }
          }
        }
      }
    })
    .catch((e) => {});

  const healthCareEntities = await client.beginAnalyzeHealthcareEntities(
    str,
    "en"
  );
  const results = await healthCareEntities.pollUntilDone();
  try {
    for await (const result of results) {
      if (!result.error) {
        for (const entity of result.entities) {
          if (
            !scientificEntitiesDataObj["text"].includes(
              entity.text.toLowerCase()
            )
          ) {
            scientificEntitiesDataObj["ids"].push(result.id);
            scientificEntitiesDataObj["text"].push(entity.text.toLowerCase());
            scientificEntitiesDataObj["category"].push(entity.category);
            scientificEntitiesDataObj["confidenceScore"].push(
              entity.confidenceScore
            );
            scientificEntitiesDataObj["offset"].push(entity.offset);
          }
        }
      }
    }
  } catch (e) {}
  return {
    sentimentDataObj,
    entitiesDataObj,
    scientificEntitiesDataObj,
    keyWordsDataObj,
  };
};

export const sentimentData = async (str) => {
  let sentimentDataObj = {};
  const sentiment = await client
    .analyzeSentiment(str)
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          sentimentDataObj["sentiments"].push(data.sentiment);
          sentimentDataObj["scores"].push(data.confidenceScores);
        }
      }
    })
    .catch((e) => {
      console.log(e);
    });

  return sentimentDataObj;
};
export const recognizedEntities = async (str) => {
  let entitiesDataObj = {};
  entitiesDataObj["ids"] = [];
  entitiesDataObj["text"] = [];
  entitiesDataObj["catagories"] = [];
  entitiesDataObj["scores"] = [];
  entitiesDataObj["linkedEntities"] = {};
  entitiesDataObj["linkedEntities"]["ids"] = [];
  entitiesDataObj["linkedEntities"]["text"] = [];
  entitiesDataObj["linkedEntities"]["catagories"] = [];
  entitiesDataObj["linkedEntities"]["scores"] = [];

  const entities = await client
    .recognizePiiEntities(str, "en")
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          for (const entity of data.entities) {
            entitiesDataObj["ids"].push(data.id);
            entitiesDataObj["text"].push(entity.text);
            entitiesDataObj["catagories"].push(entity.category);
            entitiesDataObj["scores"].push(entity.confidenceScore);
          }
        }
      }
    })
    .catch((e) => {});

  const linkedEntities = await client
    .recognizeLinkedEntities(str, "en")
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          for (const entity of data.entities) {
            for (const match of entity.matches) {
              if (
                !entitiesDataObj["linkedEntities"]["text"].includes(entity.name)
              ) {
                entitiesDataObj["linkedEntities"]["text"].push(entity.name);
                entitiesDataObj["linkedEntities"]["ids"].push(data.id);
                entitiesDataObj["linkedEntities"]["scores"].push(
                  match.confidenceScore
                );
              }
            }
          }
        }
      }
    })
    .catch((e) => {});

  return entitiesDataObj;
};

export const healthCareEntities = async (str) => {
  let scientificEntitiesDataObj = {};
  scientificEntitiesDataObj["ids"] = [];
  scientificEntitiesDataObj["text"] = [];
  scientificEntitiesDataObj["category"] = [];
  scientificEntitiesDataObj["confidenceScore"] = [];
  scientificEntitiesDataObj["offset"] = [];

  const healthCareEntities = await client.beginAnalyzeHealthcareEntities(
    str,
    "en"
  );
  const results = await healthCareEntities.pollUntilDone();
  try {
    for await (const result of results) {
      if (!result.error) {
        for (const entity of result.entities) {
          if (
            !scientificEntitiesDataObj["text"].includes(
              entity.text.toLowerCase()
            )
          ) {
            scientificEntitiesDataObj["ids"].push(result.id);
            scientificEntitiesDataObj["text"].push(entity.text.toLowerCase());
            scientificEntitiesDataObj["category"].push(entity.category);
            scientificEntitiesDataObj["confidenceScore"].push(
              entity.confidenceScore
            );
            scientificEntitiesDataObj["offset"].push(entity.offset);
          }
        }
      }
    }
  } catch (e) {}

  return scientificEntitiesDataObj;
};
export const keywordData = async (str) => {
  let keyWordsDataObj = {};
  keyWordsDataObj["keywords"] = [];
  keyWordsDataObj["keywords_list"] = [];
  keyWordsDataObj["ids"] = [];

  const keyWords = await client
    .extractKeyPhrases(str, "en")
    .then((res) => {
      for (const data of res) {
        if (data.error === undefined) {
          keyWordsDataObj["ids"].push(data.id);

          if (data.keyPhrases.length > 0) {
            for (let i = 0; i < data.keyPhrases.length; i++) {
              if (
                !keyWordsDataObj["keywords_list"].includes(data.keyPhrases[i])
              ) {
                keyWordsDataObj["keywords_list"].push(data.keyPhrases[i]);
              }
            }
          }
          keyWordsDataObj["keywords"].push(data.keyPhrases);
        }
      }
    })
    .catch((e) => {});

  return keyWordsDataObj;
};
