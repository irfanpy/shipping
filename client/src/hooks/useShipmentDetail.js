import { useEffect, useState } from "react";
import { getShipment } from "../api.js";

export default function useShipmentDetail(id) {
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let ignore = false;
    setStatus("loading");

    getShipment(id)
      .then((data) => {
        if (ignore) {
          return;
        }
        setDetail(data);
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
  }, [id]);

  return {
    detail,
    status
  };
}
