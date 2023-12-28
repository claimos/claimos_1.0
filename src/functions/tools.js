import fs from "fs";
import path from "path";

export const flatten = (lists) => {
  return lists.reduce((a, b) => a.concat(b), []);
};

export const getDirectories = (srcpath) => {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => fs.statSync(path).isDirectory());
};

export const getDirectoriesRecursive = (srcpath) => {
  return [
    srcpath,
    ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
  ];
};

export const getDirectoryFiles = (srcpath) => {
  return fs
    .readdirSync(srcpath, { withFileTypes: true })
    .filter((item) => !item.isDirectory())
    .map((item) => item.name);
};

// Returns current time stamp formatted
//
export const timeStamp = () => {
  const currentDate = new Date();
  const currentDayOfMonth = currentDate.getDate();
  let currentMonth = currentDate.getMonth() + 1;
  if (currentMonth < 10) {
    currentMonth = "0" + currentMonth;
  }
  const currentYear = currentDate.getFullYear();
  const dateString = currentYear + "-" + currentDayOfMonth + "-" + currentMonth;
  let hour = currentDate.getHours();
  if (hour < 10) {
    hour = "0" + hour;
  }
  let min = currentDate.getMinutes();
  if (min < 10) {
    min = "0" + min;
  }
  let sec = currentDate.getSeconds();
  if (sec < 10) {
    sec = "0" + sec;
  }
  let milli = currentDate.getMilliseconds();
  if (milli < 100) {
    milli = "00" + milli;
  }
  const timeZone = currentDate.getTimezoneOffset();
  const timeStamp =
    dateString +
    "T" +
    hour +
    ":" +
    min +
    ":" +
    sec +
    "." +
    milli +
    "+" +
    timeZone;
  return timeStamp;
};

export const DB2CSV = (data, dataTitleObj) => {
  let string = "";
  let keys = Object.keys(data);

  let index = keys.indexOf(dataTitleObj);

  let tilteEntries = Object.entries(data[`${keys[index]}`]);
  let titleStr = "";
  let entryString = "";

  for (let i = 0; i < tilteEntries.length; i++) {
    if (i === tilteEntries.length - 1) {
      titleStr += tilteEntries[i][0] + "$?$?$?";
    } else {
      titleStr += tilteEntries[i][0] + ",";
    }
  }
  string += titleStr;

  for (let i = 0; i < keys.length; i++) {
    let entries = Object.entries(data[`${keys[i]}`]);

    if (!(i === keys.indexOf(dataTitleObj))) {
      for (let j = 0; j < entries.length; j++) {
        let innerObj = entries[j][1];

        let innerArr = Object.values(innerObj);

        for (let n = 0; n < innerArr.length; n++) {
          let tempValues = innerArr[n];

          if (typeof tempValues === "object") {
            tempValues = JSON.stringify(tempValues).replaceAll(",", " |");
          } else {
            tempValues = tempValues.replaceAll(",", " |");
          }

          if (n === innerArr.length - 1) {
            entryString += tempValues + "\n";
          } else {
            entryString += tempValues + ",";
          }
        }

        string += entryString;
        entryString = "";
      }
    } else {
      for (let j = 0; j < entries.length; j++) {
        let entry = entries[j];

        let tempValues = entry[1];

        if (typeof tempValues === "object") {
          tempValues = JSON.stringify(tempValues).replaceAll(",", " |");
        } else {
          tempValues = tempValues.replaceAll(",", " |");
        }

        if (j === entries.length - 1) {
          entryString += tempValues + "\n";
        } else {
          entryString += tempValues + ",";
        }
      }

      let newStr = entryString;

      const index = string.indexOf("$?$?$?");
      const seperater = "$?$?$?";
      const seperaterLen = seperater.length;

      string =
        string.slice(0, index + seperaterLen) +
        "\n" +
        newStr +
        string.slice(index + seperaterLen);

      entryString = "";
    }
  }

  string = string
    .replaceAll(",,", " |")
    .replaceAll("$?$?$?", "")
    .replaceAll("null", "Product page does not include this section.")
    .replaceAll("{}", "Product page does not include this section.")
    .replaceAll("[]", "Product page does not include this section.")
    .replaceAll("{", "")
    .replaceAll("}", "")
    .replaceAll("[", "")
    .replaceAll("]", "");

  return string;
};

// Takes in an array of objects and returns a CSV.
// Data param must be an Array, of any length: 1 - inf, primary usage is for search
// query export on front end.
// Pass in proceed variable as true for more advanced objects, such as full products.
//
export const frontEnd2CSV = (data, proceed) => {
  let string = "";

  if (Array.isArray(data)) {
    let titleStr = Object.keys(data[0]);

    if (titleStr.includes("singleProduct")) {
      data.map((item) => {
        if (item.singleProduct) {
        } else {
          item.singleProduct = {};
        }
      });

      if (typeof data[0].singleProduct === "object") {
        if (Object.keys(data[0].singleProduct).includes("about")) {
          titleStr.push("about");
        }
      }

      let index = -1;

      index = titleStr.indexOf("singleProduct");

      if (index >= 0) titleStr.splice(index, 1);
    }

    titleStr = titleStr.join(",");

    string += titleStr + "\n";

    let valuesArr = [];

    for (let i = 0; i < data.length; i++) {
      let tempValues = Object.values(data[i]);

      for (let j = 0; j < tempValues.length; j++) {
        if (typeof tempValues[j] === "object") {
          if (Object.keys(tempValues[j]).includes("about")) {
            tempValues[j] = tempValues[j].about;
            tempValues[j] = JSON.stringify(tempValues[j]);
          } else if (Array.isArray(tempValues[j])) {
            tempValues[j] = JSON.stringify(tempValues[j]);
          } else if (Object.keys(tempValues[j]).includes("id")) {
            tempValues[j] = JSON.stringify(tempValues[j]);
          } else if (proceed) {
          } else {
            tempValues[j] = "Upgrade account plan to view more product claims.";
          }
        }

        if (typeof tempValues[j] === "string") {
          try {
            tempValues[j] = tempValues[j].replaceAll(",", " |");
          } catch (e) {}
        } else {
          try {
            tempValues[j] = JSON.stringify(tempValues[j]);
            tempValues[j] = tempValues[j].replaceAll(",", " |");
          } catch (e) {}
        }
      }

      valuesArr.push(tempValues);
    }

    let values = valuesArr.join(",\n");

    string += values;
    string = string
      .replaceAll(",,", " |")
      .replaceAll("$?$?$?", "")
      .replaceAll("null", "Product page does not include this section.")
      .replaceAll("{}", "Product page does not include this section.")
      .replaceAll("[]", "Product page does not include this section.")
      .replaceAll("{", "")
      .replaceAll("}", "")
      .replaceAll("[", "")
      .replaceAll("]", "");
  }

  return string;
};

// Return unique list with no duplicates
//
export const uniq = (a) => [...new Set(a)];

// Func to check if a uri is encoded or not
//
export const checkURIEncoded = (uri) => {
  uri = uri || "";

  return uri !== decodeURIComponent(uri);
};
