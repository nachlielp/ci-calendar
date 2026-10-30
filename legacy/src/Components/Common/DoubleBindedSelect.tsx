import React from "react"
import Select from "antd/es/select"

const { Option } = Select

interface DoubleBindedSelectProps {
    options: { value: string; label: string }[]
    selectedValues: string[]
    onChange: (values: string[]) => void
    placeholder?: string
    className?: string
}

const DoubleBindedSelect: React.FC<DoubleBindedSelectProps> = ({
    options,
    selectedValues,
    onChange,
    placeholder = "",
    className = "",
}) => {
    return (
        <Select
            mode="multiple"
            style={{ width: "100%" }}
            value={selectedValues}
            onChange={onChange}
            allowClear
            placeholder={placeholder}
            className={`form-input-large ${className}`}
            popupClassName={`form-input-large ${className}`}
            size="large"
        >
            {options.map((option) => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
            ))}
        </Select>
    )
}

export default DoubleBindedSelect
