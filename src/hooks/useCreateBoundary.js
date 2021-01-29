import { useState, useCallback, useMemo, useRef } from "react";

import * as api from "../api";

function getJsonFromFiles(files, filepath) {
  const file = files.find(({ name }) => name === filepath);
  return file && file.type === "string" && JSON.parse(file.data);
}

export default function useCreateBoundary() {
  const metadataRef = useRef();
  const geojsonRef = useRef();

  const [state, setState] = useState("idle");
  const [error, setError] = useState();
  const [id, setId] = useState();

  const retry = useCallback(async (id) => {
    let error;
    if (!metadataRef.current || !geojsonRef.current) return;
    const createBoundaryPromise = api.createBoundary(
      id,
      metadataRef.current,
      geojsonRef.current
    );
    setId(createBoundaryPromise.id);
    setError(null);
    setState("loading");

    try {
      await createBoundaryPromise;
      if (error) return setError(error);
      setState("done");
    } catch (e) {
      setState("error");
      setError(e);
    }
  }, []);

  const createBoundary = useCallback(async (files, id) => {
    let error;
    const geojson = getJsonFromFiles(files, "boundary.geojson");
    const metadata = getJsonFromFiles(files, "metadata.json") || {};

    setError(null);
    setState("loading");

    if (!geojson || !geojson.features || !geojson.features.length) {
      setState("error");
      setError(new Error("No data found in file"));
      return;
    }
    metadata.title = metadata.title || "My ICCA Boundary";
    metadata.public = true;

    // Keep the metadata and points around in case we need to retry map creation
    metadataRef.current = metadata;
    geojsonRef.current = geojson;

    // Don't await, we can start uploading files whilst the map is created
    const createBoundaryPromise = api.createBoundary(id, metadata, geojson);
    setId(createBoundaryPromise.id);

    try {
      await createBoundaryPromise;
      if (error) return setError(error);
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
        id,
      },
      createBoundary,
      retry,
    ],
    [error, state, id, createBoundary, retry]
  );
}
