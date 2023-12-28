export const cosineSimilarity = (vec1, vec2) => {
  const dotProduct = vec1
    .map((val, i) => val * vec2[i])
    .reduce((accum, curr) => accum + curr, 0);
  const vec1Size = calcVectorSize(vec1);
  const vec2Size = calcVectorSize(vec2);

  return dotProduct / (vec1Size * vec2Size);
};

export const calcTfIdfVectorForDoc = (doc, otherDocs, allWordsSet) => {
  return Array.from(allWordsSet).map((word) => {
    return tf(word, doc) * idf(word, doc, otherDocs);
  });
};

export const tf = (word, doc) => {
  const wordOccurences = doc.filter((w) => w === word).length;
  return wordOccurences / doc.length;
};

export const idf = (word, doc, otherDocs) => {
  const docsContainingWord = [doc].concat(otherDocs).filter((doc) => {
    return !!doc.find((w) => w === word);
  });

  return (1 + otherDocs.length) / docsContainingWord.length;
};

export const omitPunctuations = (word) => {
  return word.replace(
    /[\!\.\,\:\【\】\[\]\{\}\(\)\;\'\"\@\#\+\=\^\&\*\|\~\`\?\?]/gi,
    ""
  );
};

export const toLowercase = (word) => {
  return word.toLowerCase();
};

export const calcVectorSize = (vec) => {
  return Math.sqrt(vec.reduce((accum, curr) => accum + Math.pow(curr, 2), 0));
};
