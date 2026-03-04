import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';

interface FallbackComponentProps {
  error?: Error;
  reset?: () => void;
}

const FallbackComponent: React.FC<FallbackComponentProps> = ({
  error: errorProp,
  reset,
}) => {
  const { t } = useTranslation();

  // React Router passes errors via useRouteError, not props
  let routeError: unknown;
  try {
    routeError = useRouteError();
  } catch {
    // Not inside a React Router error boundary — ignore
  }

  const error = errorProp ?? (routeError as Error | undefined);
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : error
          ? JSON.stringify(error)
          : undefined;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>{t('error_boundary.title', 'Something went wrong')}</h2>
      <p>
        {t(
          'error_boundary.description',
          'Sorry, an error occurred while loading the page.',
        )}
      </p>
      {errorMessage && (
        <details style={{ whiteSpace: 'pre-wrap', marginTop: '16px' }}>
          <summary>{t('error_boundary.details', 'Error details')}</summary>
          {errorMessage}
        </details>
      )}
      <div style={{ marginTop: '16px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginRight: '12px',
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {t('error_boundary.reload', 'Reload Page')}
        </button>
        {reset && (
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {t('error_boundary.retry', 'Retry')}
          </button>
        )}
      </div>
    </div>
  );
};

export default FallbackComponent;
