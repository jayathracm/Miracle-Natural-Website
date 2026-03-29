import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  logError,
  sendToErrorService,
  getUserFriendlyMessage,
} from '../utils/errorHandling';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error using our utility
    const errorData = logError(error, {
      componentStack: errorInfo.componentStack,
    });

    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Send to error tracking service
    sendToErrorService(errorData);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onRetry, onGoHome }) => {
  const navigate = useNavigate();
  const userMessage = getUserFriendlyMessage(error);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">{userMessage}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full px-10 py-4 rounded-full text-lg font-bold bg-accent-500 text-white shadow-lg hover:bg-accent-600 hover:scale-105 transition-all duration-200"
          >
            Try Again
          </button>
          <button
            onClick={onGoHome}
            className="w-full px-10 py-4 rounded-full text-lg font-bold border-2 border-accent-500 text-accent-500 bg-white shadow hover:bg-accent-50 hover:scale-105 transition-all duration-200"
          >
            Go to Homepage
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error?.toString()}
              </div>
              <div>
                <strong>Component Stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">
                  {errorInfo?.componentStack}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;
