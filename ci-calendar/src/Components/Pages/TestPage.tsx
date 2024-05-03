import { useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

const Component = () => {
  const [value, setValue] = useState(null);

  const handleChange = (e: any) => {
    console.log(e);
    setValue(e);
  };
  return (
    <div>
      <GooglePlacesAutocomplete
        selectProps={{
          value,
          onChange: handleChange,
        }}
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        apiOptions={{ language: "he", region: "IL" }}
      />
    </div>
  );
};

export default Component;
