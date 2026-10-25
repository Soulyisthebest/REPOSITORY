import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Map } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 border border-amber-200 shadow-md">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-[#1E1B4B] mb-2">
            {this.props.fallbackTitle || 'Hubo un inconveniente al cargar esta sección'}
          </h2>
          <p className="text-xs text-stone-600 max-w-md mb-6 leading-relaxed">
            No te preocupes, tus datos están seguros. Puedes reiniciar la vista o volver al mapa principal de búsqueda de viviendas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2.5 rounded-2xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#28235C] transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar carga</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="px-4 py-2.5 rounded-2xl bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200 transition-all flex items-center gap-2 border border-stone-300"
            >
              <Home className="w-4 h-4" />
              <span>Recargar aplicación</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
