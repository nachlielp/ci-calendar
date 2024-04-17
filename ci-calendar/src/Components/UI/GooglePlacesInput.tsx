import { useState, useEffect } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

interface IGooglePlacesInput {
  onPlaceSelect: (e: IGooglePlaceOption) => void;
  defaultValue?: string;
}

const GooglePlacesInput = ({
  defaultValue,
  onPlaceSelect,
}: IGooglePlacesInput) => {
  const [selectedOption, setSelectedOption] = useState<any>(null);

  useEffect(() => {
    if (defaultValue) {
      const defaultOption = {
        label: defaultValue,
        value: defaultValue,
      };
      setSelectedOption(defaultOption);
    }
  }, [defaultValue]);

  const handleChange = (option: any) => {
    console.log("GooglePlacesInput.handleChange.option: ", option);
    setSelectedOption(option);
    onPlaceSelect(option);
  };

  return (
    <div>
      <GooglePlacesAutocomplete
        selectProps={{
          value: selectedOption,
          onChange: handleChange,
        }}
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        apiOptions={{ language: "he", region: "IL" }}
      />
    </div>
  );
};

export default GooglePlacesInput;

export interface IGooglePlaceOption {
  label: string;
  value: {
    description: string;
    matched_substrings: Array<{
      length: number;
      offset: number;
    }>;
    place_id: string;
    reference: string;
    structured_formatting: {
      main_text: string;
      main_text_matched_substrings: Array<{
        length: number;
        offset: number;
      }>;
      secondary_text: string;
    };
    terms: Array<{
      offset: number;
      value: string;
    }>;
    types: string[];
  };
}
