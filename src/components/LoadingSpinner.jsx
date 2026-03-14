export default function LoadingSpinner({ message = 'Loading...', hint }) {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner-card">
                <div className="loading-spinner"></div>
                <p className="loading-text">{message}</p>
                {hint ? <p className="loading-hint">{hint}</p> : null}
            </div>
        </div>
    );
}
