import { useState, useEffect } from "react";
import "./calendrier.css";
import Menu from "../../components/menu/Menu";
import axios from "axios";
import Header from "../../components/header/Header";

const Calendrier = () => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("weekly"); // 'daily' | 'weekly' | 'monthly'

  // Récupérer les tâches
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://site--outilbackend--fp64tcf5fhqm.code.run/task/my/assigned",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.data.success) {
          setTasks(response.data.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tâches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Obtenir le début de la semaine (Lundi)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Obtenir les jours à afficher selon la vue
  const getDisplayDays = () => {
    const days = [];

    if (viewMode === "daily") {
      days.push(currentDate);
    } else if (viewMode === "weekly") {
      const startOfWeek = getStartOfWeek(currentDate);
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
    } else if (viewMode === "monthly") {
      // Premier jour du mois
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      // Dernier jour du mois
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      // Trouver le dimanche de la première semaine (peut être du mois précédent)
      const startGrid = new Date(firstDay);
      startGrid.setDate(firstDay.getDate() - firstDay.getDay());

      // Générer 42 jours (6 semaines)
      for (let i = 0; i < 42; i++) {
        const day = new Date(startGrid);
        day.setDate(startGrid.getDate() + i);
        days.push(day);
      }
    }
    return days;
  };

  // Navigation
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === "weekly") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  // Formatage
  const formatDayName = (date) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days[date.getDay()];
  };

  const formatMonthYear = () => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: { bg: "#ffebee", border: "#ef5350", text: "#c62828" },
      medium: { bg: "#fff8e1", border: "#ffca28", text: "#f57f17" },
      low: { bg: "#e8f5e9", border: "#66bb6a", text: "#2e7d32" },
      default: { bg: "#e3f2fd", border: "#42a5f5", text: "#1565c0" },
    };
    return colors[priority] || colors.default;
  };

  const displayDays = getDisplayDays();

  if (loading) {
    return (
      <div className="calendrier-page">
        <Menu />
        <div className="calendrier-container">
          <div className="loading">Chargement du calendrier...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="calendrier-page">
        <Menu />
        <div className="calendrier-container">
          {/* Header */}
          <div className="calendrier-header">
            <div className="header-left">
              <div className="breadcrumb">
                <span className="breadcrumb-icon calendar">📅</span>
                <span className="breadcrumb-text">Calendrier</span>
              </div>
              <div className="month-navigation">
                <button className="nav-btn" onClick={() => navigateDate(-1)}>
                  ‹
                </button>
                <button className="nav-btn" onClick={() => navigateDate(1)}>
                  ›
                </button>
                <h2 className="month-title">{formatMonthYear()}</h2>
              </div>
            </div>
            <div className="header-right">
              <button
                className="today-btn"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd'hui
              </button>
              <div className="view-options">
                <button
                  className={`view-btn ${viewMode === "daily" ? "active" : ""}`}
                  onClick={() => setViewMode("daily")}
                >
                  📅 Daily
                </button>
                <button
                  className={`view-btn ${viewMode === "weekly" ? "active" : ""}`}
                  onClick={() => setViewMode("weekly")}
                >
                  📅 Weekly
                </button>
                <button
                  className={`view-btn ${viewMode === "monthly" ? "active" : ""}`}
                  onClick={() => setViewMode("monthly")}
                >
                  📅 Monthly
                </button>
              </div>
            </div>
          </div>

          {/* Grille du calendrier */}
          <div className={`calendrier-grid ${viewMode}`}>
            {/* En-têtes des jours */}
            {viewMode !== "daily" && (
              <div className="days-header">
                {displayDays
                  .slice(0, viewMode === "weekly" ? 7 : 7)
                  .map((day, index) => (
                    <div
                      key={index}
                      className={`day-header ${isToday(day) ? "today" : ""}`}
                    >
                      <span className="day-name">{formatDayName(day)}</span>
                      <span className="day-number">{day.getDate()}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Corps du calendrier */}
            <div className={`calendar-body ${viewMode}`}>
              {displayDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const isDisabled =
                  viewMode === "monthly" && !isCurrentMonth(day);

                return (
                  <div
                    key={index}
                    className={`
                    day-column 
                    ${isToday(day) ? "today-column" : ""}
                    ${isDisabled ? "disabled" : ""}
                    ${viewMode === "daily" ? "daily-view" : ""}
                  `}
                  >
                    {viewMode === "daily" && (
                      <div className="daily-date-header">
                        <h3>
                          {formatDayName(day)} {day.getDate()}
                        </h3>
                      </div>
                    )}
                    {dayTasks.length > 0 ? (
                      <div className="tasks-container">
                        {dayTasks.map((task) => {
                          const colors = getPriorityColor(task.priority);
                          return (
                            <div
                              key={task._id}
                              className="task-card"
                              style={{
                                backgroundColor: colors.bg,
                                borderLeft: `4px solid ${colors.border}`,
                              }}
                            >
                              <div className="task-content">
                                <span
                                  className="task-title"
                                  style={{ color: colors.text }}
                                >
                                  {task.taskName}
                                </span>
                                {task.description && (
                                  <span className="task-description">
                                    {task.description.length > 50
                                      ? `${task.description.substring(0, 50)}...`
                                      : task.description}
                                  </span>
                                )}
                                <div className="task-meta">
                                  <span
                                    className={`task-status status-${task.status}`}
                                  >
                                    {task.status === "to-do" && "À faire"}
                                    {task.status === "in-progress" &&
                                      "En cours"}
                                    {task.status === "completed" && "Terminé"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-tasks">
                        {viewMode === "daily"
                          ? "Aucune tâche pour aujourd'hui"
                          : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Résumé */}
          <div className="tasks-summary">
            <span className="summary-text">
              {tasks.length} tâche{tasks.length > 1 ? "s" : ""} assignée
              {tasks.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Calendrier;
