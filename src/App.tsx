import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { api } from "./api";

import { Header } from "./components/Header";
import { BookingForm } from "./components/BookingForm/BookingForm";
import { BookingsTable } from "./components/BookingsTable";
import { BookingsSchedule } from "./components/BookingsSchedule";

type NavId = "catalog" | "bookings" | "settings";

export default function App() {
  const [nav, setNav] = useState<NavId>("catalog");

  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editBooking, setEditBooking] = useState<any | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [r, b] = await Promise.all([api.getRooms(), api.getBookings()]);
      setRooms(r);
      setBookings(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const available = rooms.filter((x) => x.status === "available").length;
    const booked = rooms.filter((x) => x.status === "booked").length;
    const maintenance = rooms.filter((x) => x.status === "maintenance").length;

    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;

    return { available, booked, maintenance, confirmed, pending, cancelled };
  }, [rooms, bookings]);

  async function createBooking(payload: any) {
    setLoading(true);
    setError(null);
    try {
      const created = await api.createBooking({ ...payload, status: payload.status ?? "pending" });
      setBookings((prev: any[]) => [created, ...prev]);
      setShowBookingForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function updateBooking(id: string, patch: any) {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateBooking(id, patch);
      setBookings((prev: any[]) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteBooking(id: string) {
    setLoading(true);
    setError(null);
    try {
      await api.deleteBooking(id);
      setBookings((prev: any[]) => prev.filter((b) => b.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <Header
        activeNavId={nav}
        onNavigate={(id) => setNav(id as NavId)}
        onBellClick={() => alert("Уведомления: пока нет")}
        userName="Кирилл"
      />

      <main className="main-content">
        {error && (
          <div className="filters-panel" style={{ border: "1px solid #ffbdbd", background: "#ffe5e5" }}>
            <b>Ошибка:</b> {error}
          </div>
        )}

        {nav === "catalog" && (
          <>
            <h1 className="page-title">Каталог аудиторий</h1>
            <div className="page-subtitle">Доступность аудиторий и оборудование.</div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.available}</div>
                <div className="stat-label">Доступны</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.booked}</div>
                <div className="stat-label">Забронированы</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.maintenance}</div>
                <div className="stat-label">Обслуживание</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{rooms.length}</div>
                <div className="stat-label">Всего</div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="primary-btn"
                onClick={() => {
                  setNav("bookings");
                  setShowBookingForm(true);
                }}
              >
                ➕ Создать бронирование
              </button>

              <button className="secondary-btn" onClick={loadAll} disabled={loading}>
                🔄 {loading ? "Обновляю..." : "Обновить"}
              </button>
            </div>

            <div className="table-container">
              <table className="rooms-table">
                <thead>
                  <tr className="table-header">
                    <th>Код</th>
                    <th>Название</th>
                    <th>Вместимость</th>
                    <th>Оборудование</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="no-data">
                        {loading ? "Загрузка..." : "Нет данных"}
                      </td>
                    </tr>
                  ) : (
                    rooms.map((r) => (
                      <tr key={r.id} className="table-row">
                        <td><strong>{r.code}</strong></td>
                        <td>{r.name}</td>
                        <td>{r.capacity}</td>
                        <td>
                          <div className="equipment-tags">
                            {String(r.equipment ?? "")
                              .split(",")
                              .map((x: string) => x.trim())
                              .filter(Boolean)
                              .map((x: string) => (
                                <span key={`${r.id}-${x}`} className="equipment-tag">
                                  {x}
                                </span>
                              ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              r.status === "available"
                                ? "status-available"
                                : r.status === "booked"
                                ? "status-booked"
                                : "status-maintenance"
                            }`}
                          >
                            {r.status === "available" && "Доступна"}
                            {r.status === "booked" && "Забронирована"}
                            {r.status === "maintenance" && "Обслуживание"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {nav === "bookings" && (
          <>
            <h1 className="page-title">Управление бронированием</h1>
            <div className="page-subtitle">Создание, фильтры, расписание.</div>

            <div className="action-buttons">
              <button
                className="primary-btn"
                onClick={() => {
                  setEditBooking(null);
                  setShowBookingForm(true);
                }}
              >
                ➕ Создать бронирование
              </button>

              <button className="secondary-btn" onClick={loadAll} disabled={loading}>
                🔄 {loading ? "Обновляю..." : "Обновить"}
              </button>
            </div>

            {showBookingForm && (
              <BookingForm
                mode={editBooking ? "edit" : "create"}
                initialData={editBooking}
                onCancel={() => {
                  setShowBookingForm(false);
                  setEditBooking(null);
                }}
                onSubmit={(payload) => {
                  if (editBooking) {
                    updateBooking(editBooking.id, payload);
                    setShowBookingForm(false);
                    setEditBooking(null);
                  } else {
                    createBooking(payload);
                  }
                }}
              />
            )}

            <BookingsTable
              bookings={bookings}
              onCancelBooking={(id) => updateBooking(id, { status: "cancelled" })}
              onStatusChange={(id, status) => updateBooking(id, { status })}
              onEditBooking={(b) => {
                setEditBooking(b);
                setShowBookingForm(true);
              }}
              onDeleteBooking={deleteBooking}
            />

            <BookingsSchedule bookings={bookings} />
          </>
        )}

        {nav === "settings" && (
          <>
            <h1 className="page-title">Настройки</h1>
            <div className="page-subtitle">Служебная страница.</div>

            <div className="filters-panel">
              <div className="filters-title">⚙️ Конфигурация</div>
              <div className="filter-stats">
                <div><strong>API Base:</strong> {import.meta.env.VITE_API_BASE}</div>
                <div><strong>Режим:</strong> {import.meta.env.DEV ? "DEV" : "PROD"}</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
