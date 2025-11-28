import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PaymentPortalPage = () => {
    const { loanId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [loan, setLoan] = useState(null);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("tarjeta_credito");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchLoan = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await fetch(`/api/loans/${loanId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || "No se pudo cargar el crédito.");
                }

                const data = await res.json();
                setLoan(data);
            } catch (err) {
                setError(err.message || "Error al cargar el crédito.");
            } finally {
                setLoading(false);
            }
        };

        if (token && loanId) {
            fetchLoan();
        }
    }, [loanId, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await fetch(`/api/loans/${loanId}/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    method,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || "No se pudo registrar el pago.");
            }

            setMessage(data.message || "Pago registrado correctamente.");
            setLoan(data.loan || loan);
            setAmount("");
        } catch (err) {
            setError(err.message || "Error al procesar el pago.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <p className="text-zinc-500">Cargando portal de pagos...</p>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
                <p className="text-red-600 mb-4">
                    {error || "Crédito no encontrado."}
                </p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm"
                >
                    Volver al dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">
                            Portal de pagos
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Crédito #{loan.id} • Monto original:{" "}
                            <span className="font-semibold text-zinc-800">
                $
                                {new Intl.NumberFormat("es-CL").format(
                                    Number(loan.amount || 0)
                                )}
              </span>
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50"
                    >
                        Volver al dashboard
                    </button>
                </div>

                {/* Resumen del crédito */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1">
                    <p className="text-sm text-zinc-600">
                        Estado:{" "}
                        <span className="font-semibold text-zinc-900">
              {loan.status}
            </span>
                    </p>
                    <p className="text-sm text-zinc-600">
                        Saldo pendiente:{" "}
                        <span className="font-semibold text-zinc-900">
              $
                            {new Intl.NumberFormat("es-CL").format(
                                Number(loan.remaining_balance || 0)
                            )}
            </span>
                    </p>
                </div>

                {/* Formulario de pago */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Monto a pagar
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="1000"
                            required
                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Método de pago
                        </label>
                        <select
                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="tarjeta_credito">Tarjeta de crédito</option>
                            <option value="tarjeta_debito">Tarjeta de débito</option>
                            <option value="transferencia">Transferencia bancaria</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                    {message && (
                        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Confirmar pago (simulado)
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentPortalPage;
