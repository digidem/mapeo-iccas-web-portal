import { useState, useCallback, useMemo } from "react";

import * as api from "../api";

function getJsonFromFiles(files, filepath) {
  const file = files.find(({ name }) => name === filepath);
  return file && file.type === "string" && JSON.parse(file.data);
}

export default function useCreateBoundaries() {
  const [state, setState] = useState("idle");
  const [error, setError] = useState();

  const createBoundaries = useCallback(async (files) => {
    const geojson = getJsonFromFiles(files, "boundary.geojson");
    const submissionMetadata = getJsonFromFiles(files, "metadata.json") || {};

    setError(null);
    setState("loading");

    if (!geojson || !geojson.features || !geojson.features.length) {
      setState("error");
      setError(new Error("No data found in file"));
      return;
    }

    try {
      for (const feature of geojson.features) {
        await api.createBoundary(submissionMetadata, feature);
      }
      setState("done");
    } catch (e) {
      setState("error");
      setError(e);
    }
  }, []);

  return useMemo(
    () => [
      {
        error,
        value: state,
      },
      createBoundaries,
    ],
    [error, state, createBoundaries]
  );
}
