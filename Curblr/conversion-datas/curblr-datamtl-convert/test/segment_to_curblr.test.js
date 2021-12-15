const segmentToCurblr = require("../scripts/segment_to_curblr");

describe("segment to curblr", () => {

    let curblr;

    beforeAll(() => {
        curblr = segmentToCurblr.convertToCurblr(rpaCode, input);
    });

    test("manifest", () => {
        const manifest = curblr.manifest;

        // regex:  https://stackoverflow.com/questions/12756159/regex-and-iso8601-formatted-datetime
        const isoDateRegex = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/
        const createdDateIsValid = isoDateRegex.test(manifest.createdDate);
        expect(createdDateIsValid).toBeTruthy();

        expect(manifest.timeZone).toBe("America/Toronto");
        
        expect(manifest.currency).toBe("CAD");

        const priorityHierarchyIsValid = manifest.priorityHierarchy.length > 0;
        expect(priorityHierarchyIsValid).toBeTruthy();

        expect(manifest.curblrVersion).toBe("1.1.0");

        expect(manifest.authority.name).toBe("Fabrique des Mobilités Québec")

        expect(manifest.authority.url).toBe("https://fabmobqc.ca/");
    });

    test("type", () => {
        const isValid = (curblr.type == "FeatureCollection");
        expect(isValid).toBeTruthy();
    });

    test("features", () => {
        const features = curblr.features;

        const nbFeatures = features.length;
        expect(nbFeatures).toEqual(1);
    });

    test("features[0].type", () => {
        const featureType = curblr.features[0].type;
        expect(featureType).toBe("Feature");
    });

    test("features[0].properties", () => {
        const featureProperties = curblr.features[0].properties;
        expect(featureProperties && typeof featureProperties === 'object').toBe(true)
    });

    test("features[0].properties.location", () => {
      const curblrLocation = curblr.features[0].properties.location;
      const inputProperties = input.features[0].properties;

      expect(curblrLocation.shstRefId).toBe(inputProperties.referenceId);
      expect(curblrLocation.sideOfStreet).toBe(inputProperties.sideOfStreet);
      expect(curblrLocation.shstLocationStart).toBe(Math.round(inputProperties.section[0])); // Why rounded?
      expect(curblrLocation.shstLocationEnd).toBe(Math.round(inputProperties.section[1])); // Why rounded?
      expect(curblrLocation.derivedFrom).toBe(undefined);
      expect(typeof curblr.assetType).toBe(""); // Required but currently missing
    });

    test("features[0].properties.regulations", () => {
      const curblrRegulations = curblr.features[0].properties.regulations;
      const rpaCodeRegulations = rpaCode["1"].regulations;
      expect(curblrRegulations).toBe(rpaCodeRegulations)
    })


    test("features[0].geometry", () => {
        const curblrGeometry = curblr.features[0].geometry;
        const inputGeometry = input.features[0].geometry;
        expect(curblrGeometry).toBe(inputGeometry);
    });
});

const rpaCode = {
  "1": {
    "description": "INTERDICTION DE STAT. S3R (GR. R) 9H - 3H", // Not used
    "code": "R-XD", // Not used
    "regulations": [
      {
        "priorityCategory": "3",
        "rule": {
          "activity": "no parking"
        },
        "timeSpans": [
          {
            "timesOfDay": [
              {
                "from": "09:00",
                "to": "03:00"
              }
            ]
          }
        ]
      }
    ]
  }
}

const input = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "referenceLength": 322.6, // Not used
        "geometryId": "9c57ceae50ebc6f92529091228f4a8b0", // Not used
        "referenceId": "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
        "sideOfStreet": "left", 
        "section": [1.23, 4.56],
        "pp_code_rpa": "PX-PH_R-PF", // Not used
        "pp_panneau_id_rpa": "1",
        "shst_joined_point_count": 3 // Not used
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-73.60304758801902, 45.537420367562284],
          [-73.60367583639929, 45.53770251852865]
        ]
      }
    }
  ]
};
