import "./home.css";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // States pour les données
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les tâches et todos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const token = Cookies.get("userToken") || localStorage.getItem("token");
        const apiBase = "https://site--outilbackend--fp64tcf5fhqm.code.run";

        if (!token) {
          console.log("Aucun token trouvé, redirection vers login");
          navigate("/login");
          return;
        }

        console.log(
          `Chargement des données en tant que ${isAdmin ? "admin" : "utilisateur"}:`,
          token?.substring(0, 20) + "...",
        );

        // Choisir les endpoints en fonction du rôle
        const tasksEndpoint = isAdmin
          ? `${apiBase}/admin/tasks`
          : `${apiBase}/task/my/assigned`;

        const todosEndpoint = isAdmin
          ? `${apiBase}/admin/ToDo`
          : `${apiBase}/ToDo/my-toDo`;

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Charger les tâches
        let tasksData = [];
        try {
          const tasksResponse = await axios.get(tasksEndpoint, { headers });
          console.log("Réponse tâches:", tasksResponse.data);
          tasksData = tasksResponse.data.data || [];
        } catch (taskErr) {
          console.error(
            "Erreur tâches:",
            taskErr.response?.data || taskErr.message,
          );
        }

        // Charger les todos
        let todosData = [];
        try {
          const todosResponse = await axios.get(todosEndpoint, { headers });
          console.log("Réponse todos:", todosResponse.data);
          todosData = todosResponse.data.data || [];
        } catch (todoErr) {
          console.error(
            "Erreur todos:",
            todoErr.response?.data || todoErr.message,
          );
        }

        setTasks(tasksData);
        setTodos(todosData);
      } catch (err) {
        console.error("Erreur générale:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, navigate, isAdmin]);

  // Fonction pour calculer la progression depuis Progression[]
  const getProgress = (task) => {
    if (!task.Progression || task.Progression.length === 0) return 0;
    return task.Progression[task.Progression.length - 1].percentage;
  };

  // Filtrage des tâches
  const readyTasks = tasks.filter(
    (task) => task.Done === true || getProgress(task) === 100,
  );
  const inProgressTasks = tasks.filter((task) => {
    const progress = getProgress(task);
    return !task.Done && progress > 0 && progress < 100;
  });
  const reviewTasks = tasks.filter(
    (task) => !task.Done && getProgress(task) === 0,
  );

  // Navigation vers le détail d'une tâche
  const handleTaskClick = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  // Navigation vers le détail d'un todo (optionnel)
  const handleTodoClick = (todoId) => {
    navigate(`/todo/${todoId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main>
          <Menu />
          <div className="loading">Chargement...</div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main>
          <Menu />
          <div className="error">{error}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Menu />
        <div className="kanban-board">
          {/* Column Ready */}
          <KanbanColumn
            title="Ready"
            count={readyTasks.length}
            color="green"
            items={readyTasks}
            onAddTask={() => navigate("/addTask")}
            isAdmin={isAdmin}
            onItemClick={handleTaskClick}
            itemType="task"
          />

          {/* Column In Progress */}
          <KanbanColumn
            title="In progress"
            count={inProgressTasks.length}
            color="orange"
            items={inProgressTasks}
            onAddTask={() => navigate("/addTask")}
            isAdmin={isAdmin}
            onItemClick={handleTaskClick}
            itemType="task"
          />

          {/* Column Review */}
          <KanbanColumn
            title="Review"
            count={reviewTasks.length}
            color="blue"
            items={reviewTasks}
            onAddTask={() => navigate("/addTask")}
            isAdmin={isAdmin}
            onItemClick={handleTaskClick}
            itemType="task"
          />

          {/* Column To Do */}
          <KanbanColumn
            title="To Do"
            count={todos.length}
            color="teal"
            items={todos}
            onAddTask={() => navigate("/addToDo")}
            isAdmin={isAdmin}
            onItemClick={handleTodoClick}
            itemType="todo"
          />
        </div>
      </main>
    </>
  );
};

const KanbanColumn = ({
  title,
  count,
  color,
  items = [],
  onAddTask,
  isAdmin,
  onItemClick,
  itemType = "task",
}) => {
  return (
    <div className={`kanban-column kanban-column--${color}`}>
      <div className="kanban-column__header">
        <div className="kanban-column__title-wrapper">
          <span className="kanban-column__title">{title}</span>
          <span className="kanban-column__count">{count}</span>
        </div>
        {isAdmin && (
          <button className="kanban-column__add-btn" onClick={onAddTask}>
            +
          </button>
        )}
      </div>
      <div className="kanban-column__content">
        {items.map((item) => (
          <div
            key={item._id}
            className="kanban-card-wrapper"
            onClick={() => onItemClick(item._id)}
          >
            {itemType === "task" ? (
              <TaskCard task={item} />
            ) : (
              <TodoCard todo={item} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TaskCard = ({ task }) => {
  const commentCount = task.comments?.length || 1;

  return (
    <div className="kanban-card">
      <h4 className="kanban-card__title">{task.taskName || "TITRE"}</h4>
      <div className="kanban-card__footer"></div>
    </div>
  );
};

const TodoCard = ({ todo }) => {
  const commentCount = todo.comments?.length || 1;

  return (
    <div className="kanban-card">
      <h4 className="kanban-card__title">{todo.ToDoTitle || "TITRE"}</h4>
      <div className="kanban-card__footer"></div>
    </div>
  );
};

export default Home;
