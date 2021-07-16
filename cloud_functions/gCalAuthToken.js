const fetch = require("node-fetch");
var fs = require("fs"),
    path = require("path");
const { Storage } = require('@google-cloud/storage');

exports.restbackend = async (req, res) => {
  // Get properties from the request
  let { authorization } = req.headers;
  let headers = {};
  headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (authorization) {
    headers["authorization"] = authorization;
  }

  if(req.headers.authorization !== `Bearer ${process.env.BEARER}`) {
    res.status(401).send('Permission Denied')
  } else {
    // Google Cloud Download
    const bucketName = ""
    const srcFilename = req.query.apikey
    const gc = new Storage({
        GOOGLE_CLOUD_PROJECT: "",
        projectId: ""
    });

    let credentials

    let listVariables = async function() {
      // Downloads the file
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
          // Parse the storage file and reassign to variable
          credentials = JSON.parse(buf);
          try {
          } catch (err) {
            console.error(err);
          }
      
          // Get the access_token
          const response = await fetch("https://accounts.google.com/o/oauth2/token", {
            method: "POST",
            body: `client_secret=${credentials.client_secret}&client_id=${credentials.client_id}&grant_type=refresh_token&refresh_token=${credentials.refresh_token}`,
            headers: headers,
          });

        
          // Replace the access_token in the same storage file 
          let json = await response.json();
          const key = json.access_token
        
          try {
            const mutationBucket = gc.bucket(bucketName);
            credentials.access_token = key
            const file = `${JSON.stringify(credentials)}`;
              
            fs.writeFile(`../../../tmp/${srcFilename}.json`, file, function(err, result) {
                if(err) console.log('error', err);
              });
              const filePath = path.join(__dirname, `../../../tmp/${srcFilename}.json`);
              // Uploads a local file to the bucket
              await mutationBucket.upload(filePath, {
                // Support for HTTP requests made with `Accept-Encoding: gzip`
                gzip: true,
                // By setting the option `destination`, you can change the name of the
                // object you are uploading to a bucket.
                metadata: {
                  // Enable long-lived HTTP caching headers
                  // Use only if the contents of the file will never change
                  // (If the contents will change, use cacheControl: 'no-cache')
                  cacheControl: 'public, max-age=31536000',
                },
              });
            
              console.log(`${filePath} uploaded to ${mutationBucket.id}.`);
              
              res.status(200).send(`Success`)
              
          } catch (err) {
            console.error('ERROR:', err);
          }

        });
    }
  
    listVariables()

  }
};