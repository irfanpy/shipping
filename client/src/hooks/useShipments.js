import { useEffect, useState } from "react";
import { getShipments } from "../api.js";
import { initialTrackingFilter } from "../constants/trackingDefaults.js";

export default function useShipments() {
  const [filter, setFilter] = useState(initialTrackingFilter);
  const [shipments, setShipments] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let ignore = false;
    setStatus("loading");

    getShipments(filter)
      .then((data) => {
        if (ignore) {
          return;
        }
        setShipments(data.data || []);
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
  }, [filter]);

  return {
    filter,
    setFilter,
    shipments,
    status
  };
}
