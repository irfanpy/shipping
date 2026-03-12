import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShipmentDetail from "../components/ShipmentDetail.jsx";

export default function TrackingDetailWrapper() {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      navigate("/tracking");
    }
  }, [id, navigate]);

  if (!id) {
    return null;
  }

  return <ShipmentDetail id={id} />;
}
