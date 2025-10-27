const _conf = {
  port: process.env.PORT || 8000,
  mongoDBURI: process.env.MONGODB_URI,
  dbName: "FOCUS_DB",
};

export const conf = Object.freeze(_conf);
