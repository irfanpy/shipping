import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addLeg, createDraft, getDraftPricing, submitShipment } from "../api.js";
import { emptyDraft } from "../constants/bookingDefaults.js";

export default function useBookingWorkflow() {
  const [draft, setDraft] = useState(emptyDraft);
  const [shipment, setShipment] = useState(null);
  const [legs, setLegs] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();

  const draftReady = useMemo(
    () => draft.shipperName && draft.shipperEmail && draft.pickupAddress && draft.deliveryAddress,
    [draft]
  );

  const handleCreateDraft = async () => {
    setStatus("loading");
    try {
      const created = await createDraft(draft);
      setShipment(created);
      setStatus("drafted");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleAddLeg = async () => {
    if (!shipment) {
      return;
    }

    setStatus("loading");
    try {
      const nextSequence = legs.length + 1;
      const carrierServiceId = window.prompt("Enter carrier service id for leg");

      if (!carrierServiceId) {
        setStatus("drafted");
        return;
      }

      const newLeg = await addLeg(shipment.id, {
        carrierServiceId,
        sequence: nextSequence
      });

      setLegs([...legs, newLeg]);
      const currentPricing = await getDraftPricing(shipment.id);
      setPricing(currentPricing);
      setStatus("drafted");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleSubmit = async () => {
    if (!shipment) {
      return;
    }

    setStatus("loading");
    try {
      const submitted = await submitShipment(shipment.id, `idem-${Date.now()}`);
      navigate(`/tracking/${submitted.id}`);
    } catch (error) {
      setStatus("error");
    }
  };

  return {
    draft,
    setDraft,
    shipment,
    legs,
    pricing,
    status,
    draftReady,
    handleCreateDraft,
    handleAddLeg,
    handleSubmit
  };
}
