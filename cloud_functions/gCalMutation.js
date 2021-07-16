const fetch = require("node-fetch");
const { Storage } = require('@google-cloud/storage');

exports.restbackend = async (req, res) => {
  /* Get the Variables */
  let { url } = req.query;
  let body = JSON.stringify(req.body);

  // Google Cloud Download
  const bucketName = ""
  const srcFilename = req.query.apikey
  const gc = new Storage({
    GOOGLE_CLOUD_PROJECT: "",
    projectId: ""
  });

  if(req.headers.authorization !== `Bearer ${process.env.BEARER}`) {
    res.status(401).send('Permission Denied');
  } else {
    let listVariables = async function() {
      // Downloads the file
      let obj
      await gc
        .bucket(bucketName)
        .file(`${srcFilename}.json`)
        .download(`${srcFilename}.json`);
      var archivo = gc
        .bucket(bucketName)
        .file(`${srcFilename}.json`)
        .createReadStream();
      var buf = "";
      archivo
        .on("data", async function getVariables(d) {
          buf += d;
        })
        .on("end", async function () {
          obj = JSON.parse(buf);
          try {
          } catch (err) {
            console.error(err);
          }
          // return buf
          let bearer = obj.access_token

          let headers = {};
          headers["Content-Type"] = "application/json";
          headers["authorization"] = `Bearer ${bearer}`;

          const response = await fetch(url, {
            method: "POST",
            body: body,
            headers: headers,
          });
      
          let json = await response.json();

          res.json(json);
        });
        

    };
    listVariables();

  };
};
