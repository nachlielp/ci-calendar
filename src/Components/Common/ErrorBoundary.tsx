import { Icon } from "../Common/Icon"
import React from "react"
import { NavigateFunction } from "react-router"
import '../../styles/error-boundary.scss'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    navigate: NavigateFunction
}

class ErrorBoundaryClass extends React.Component<
    ErrorBoundaryProps,
    { hasError: boolean }
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="error-container">
                        <h2> נראה שמשהו השתבש</h2>
                        <Icon icon="warning" className="warning-icon" />
                        <button
                            onClick={() => {
                                this.props.navigate("/")
                                window.location.reload()
                            }}
                            className="general-action-btn large-btn"
                        >
                            חזרה לדף הבית
                        </button>
                    </div>
                )
            )
        }

        return this.props.children
    }
}

// Function component wrapper for better DX
export const ErrorBoundary = (props: ErrorBoundaryProps) => {
    return <ErrorBoundaryClass {...props} />
}

export default ErrorBoundary
