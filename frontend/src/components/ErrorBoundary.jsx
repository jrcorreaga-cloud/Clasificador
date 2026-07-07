import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary">
          <section className="error-boundary__panel" role="alert" aria-live="assertive">
            <h1>Algo salió mal</h1>
            <p>Hemos encontrado un error inesperado y no podemos mostrar la pantalla en este momento.</p>
            <pre className="error-boundary__message">{String(this.state.error)}</pre>
            <button className="btn btn--primary" onClick={this.handleRetry} type="button">
              Recargar aplicación
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
