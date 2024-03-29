import { sdk } from "./deps.ts";

const mapNumber = (value: number, in_min: number, in_max: number, out_min: number, out_max: number) => {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

const getRange = (arr: any[], key: string) => {
  const min = arr.reduce((val, obj) => {
    if (val === -1 || obj[key] < val) {
      return obj[key]
    }

    return val;
  }, -1);

  const max = arr.reduce((val, obj) => {
    if (val === -1 || obj[key] > val) {
      return obj[key]
    }

    return val;
  }, -1);

  return { min, max };
}

const getDifficulty = (perc: number) => {
  if (perc <= 0.27) {
    return "hard";
  }

  if (perc <= 0.73) {
    return "medium";
  }

  return "easy";
};

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body data
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200
  
  If an error is thrown, a response with code 500 will be returned.
*/

const func = async function (req: any, res: any) {
  const client = new sdk.Client();

  let db = new sdk.Databases(client);

  client
    .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'] as string)
    .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'] as string)
    .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'] as string);

  let didFail = false;
  let cursor: string | undefined = undefined;

  let mapsArray = [];

  do {
    try {
      const queries = [ sdk.Query.limit(100) ];

      if(cursor) {
        queries.push(sdk.Query.cursorAfter(cursor));
      }

      const mapsResponse: sdk.Models.DocumentList<sdk.Models.Document> = await db.listDocuments("default", "dailyMaps", queries);

      mapsArray.push(...mapsResponse.documents);

      if (mapsResponse.documents.length > 0) {
        cursor = mapsResponse.documents[mapsResponse.documents.length - 1].$id;
      } else {
        throw Error("Cursor not found.");
      }
    } catch (err) {
      console.log(err);

      didFail = true;
    }
  } while (!didFail);

  mapsArray = mapsArray.map((m: any) => {
    m.weightBronze = m.bronzeScorePosition / m.totalScorePositions;
    m.weightSilver = m.silverScorePosition / m.totalScorePositions;
    m.weightGold = m.goldScorePosition / m.totalScorePositions;
    m.weightAuthor = m.authorScorePosition / m.totalScorePositions;

    return m;
  });

  const bronzeRange = getRange(mapsArray, "weightBronze");
  const silverRange = getRange(mapsArray, "weightSilver");
  const goldRange = getRange(mapsArray, "weightGold");
  const authorRange = getRange(mapsArray, "weightAuthor");

  mapsArray = mapsArray.map((m: any) => {
    m.bronzeDifficulty = mapNumber(m.weightBronze, bronzeRange.min, bronzeRange.max, 0, 1);
    m.silverDifficulty = mapNumber(m.weightSilver, silverRange.min, silverRange.max, 0, 1);
    m.goldDifficulty = mapNumber(m.weightGold, goldRange.min, goldRange.max, 0, 1);
    m.authorDifficulty = mapNumber(m.weightAuthor, authorRange.min, authorRange.max, 0, 1);

    return m;
  });

  mapsArray = mapsArray.map((m: any) => {
    m.difficulty = (m.bronzeDifficulty + m.silverDifficulty + m.goldDifficulty + m.authorDifficulty) / 4;

    return m;
  });

  mapsArray = mapsArray.map((m: any) => {
    delete m.weightBronze;
    delete m.weightSilver;
    delete m.weightGold;
    delete m.weightAuthor;

    return m;
  });

  for (const map of mapsArray) {
    const mapUpdate = {
      difficulty: map.difficulty,
      bronzeDifficulty: map.bronzeDifficulty,
      silverDifficulty: map.silverDifficulty,
      goldDifficulty: map.goldDifficulty,
      authorDifficulty: map.authorDifficulty
    };

    await db.updateDocument("default", "dailyMaps", map.$id, mapUpdate);
  }

  res.json({
    success: true,
  });
}

export default async function (req: any, res: any) {
  try {
    await func(req, res);
  } catch (err) {
    res.json({
      message: err
    });
  }
}