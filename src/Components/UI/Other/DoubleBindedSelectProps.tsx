import React from "react"
import { Select } from "antd"

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
            className={className}
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
