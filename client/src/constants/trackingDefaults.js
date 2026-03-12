export const initialTrackingFilter = {
  status: "",
  shipmentNumber: ""
};

export const shipmentStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Booked", label: "Booked" },
  { value: "In Transit", label: "In Transit" },
  { value: "Exception", label: "Exception" },
  { value: "Delivered", label: "Delivered" }
];
