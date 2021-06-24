/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import MapItem from "./MapItem";

export default {
  title: "MapItem",
  decorators: [(storyFn) => <div style={{ maxWidth: 640 }}>{storyFn()}</div>],
};

export const basic = () => (
  <MapItem
    title="Monitoring Points"
    geometry={{
      type: "Polygon",
      coordinates: [
        [
          [-132.04355058152245, 53.113102342980845],
          [-132.04533752374627, 53.11240233154012],
          [-132.0440772592305, 53.11144261991434],
          [-132.04136863101752, 53.11235716912036],
          [-132.04355058152245, 53.113102342980845],
        ],
      ],
    }}
    description="These reports from the Wapichan monitoring team document some of the key threats and impacts to our ancestral territory from illegal mining and crossings into our territory to steal cattle and illegally fish and hunt. The monitoring team has also been documenting important resources and cultural sites throughout our territory."
  />
);
