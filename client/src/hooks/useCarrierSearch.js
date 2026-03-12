import { useEffect, useState } from "react";
import { searchCarrierServices } from "../api.js";
import useDebouncedValue from "./useDebouncedValue.js";
import { initialSearchFilters } from "../constants/searchDefaults.js";

export default function useCarrierSearch() {
  const [filters, setFilters] = useState(initialSearchFilters);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");

  const debounced = useDebouncedValue(filters, 400);

  useEffect(() => {
    const searchParams = new URLSearchParams(debounced);
    window.history.replaceState(null, "", `/?${searchParams.toString()}`);

    let ignore = false;
    setStatus("loading");

    searchCarrierServices(debounced)
      .then((data) => {
        if (ignore) {
          return;
        }
        setResults(data.data || []);
        setStatus("done");
      })
      .catch(() => {
        if (!ignore) {
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [debounced]);

  return {
    filters,
    setFilters,
    results,
    status
  };
}
