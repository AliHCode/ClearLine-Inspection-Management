export default function LoadingSpinner({ message = 'Loading...', hint }) {
    const defaultHint = !window.navigator.onLine
        ? 'You are offline. We are loading cached data where available.'
        : 'Preparing your secure session and workspace.';

    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner-card">
                <div className="loading-spinner"></div>
                <p className="loading-text">{message}</p>
                <p className="loading-hint">{hint || defaultHint}</p>
            </div>
        </div>
    );
}
