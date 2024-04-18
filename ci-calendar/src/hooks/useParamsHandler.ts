import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SelectOption } from "../util/options";

interface IUseParamsProps {
  title: string;
  options: SelectOption[];
}

interface IUseParams {
  currentValues: string[];
  onOptionsChange: (type: string) => (values: string[]) => void;
  clearSearchParams: (titles: string[]) => void;
}
export const useParamsHandler = ({
  title,
  options,
}: IUseParamsProps): IUseParams => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentValues, setCurrentValues] = useState<string[]>([]);

  const getInitialValues = useCallback(
    (paramName: string, options: SelectOption[]) => {
      const params = searchParams.getAll(paramName);
      return options
        .filter((option) => params.includes(option.value))
        .map((option) => option.value);
    },
    [searchParams]
  );
  const onOptionsChange = (type: string) => (values: string[]) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete(type);
    values.forEach((value) => newSearchParams.append(type, value));
    setSearchParams(newSearchParams, { replace: true });
  };
  // Clearing based on instance search params rewrites other instances' search params
  // so i pass all of the titles to clear
  const clearSearchParams = (titles: string[]) => {
    const newSearchParams = new URLSearchParams(searchParams);
    titles.forEach((t) => newSearchParams.delete(t));
    setSearchParams(newSearchParams, { replace: true });
  };
  useEffect(() => {
    const initialValues = getInitialValues(`${title}`, options);
    setCurrentValues(initialValues);
  }, [searchParams, getInitialValues]);

  return { currentValues, onOptionsChange, clearSearchParams };
};
