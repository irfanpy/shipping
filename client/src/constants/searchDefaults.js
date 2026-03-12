export const initialSearchFilters = {
  origin: "",
  destination: "",
  carrier: "",
  mode: "",
  sort: "price",
  order: "asc"
};

export const modeOptions = [
  { value: "", label: "All modes" },
  { value: "sea", label: "Sea" },
  { value: "air", label: "Air" },
  { value: "road", label: "Road" }
];

export const sortOptions = [
  { value: "price", label: "Sort by price" },
  { value: "transit", label: "Sort by transit" },
  { value: "carrier", label: "Sort by carrier" }
];

export const orderOptions = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" }
];
