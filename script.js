/* ============================================
   TASK MANAGER - SCRIPT JAVASCRIPT
   ============================================ */

class TaskManager {
  /**
   * Initialise la classe TaskManager
   * Crée une nouvelle instance avec tous les éléments DOM et propriétés
   */
  constructor() {
    // Initialisation des propriétés
    this.tasks = [];
    this.editingTaskId = null;
    this.currentFilter = "all";
    this.currentSort = "date";
    this.searchQuery = "";

    // Éléments du DOM - Formulaire
    this.taskForm = document.getElementById("taskForm");
    this.taskTitle = document.getElementById("taskTitle");
    this.taskDescription = document.getElementById("taskDescription");
    this.taskDate = document.getElementById("taskDate");
    this.taskPriority = document.getElementById("taskPriority");

    // Éléments du DOM - Affichage
    this.tasksList = document.getElementById("tasksList");
    this.searchInput = document.getElementById("searchInput");
    this.filterStatus = document.getElementById("filterStatus");
    this.sortBy = document.getElementById("sortBy");

    // Éléments du DOM - Thème
    this.themeToggle = document.getElementById("themeToggle");

    // Éléments du DOM - Modal
    this.editModal = document.getElementById("editModal");
    this.editForm = document.getElementById("editForm");
    this.editTaskTitle = document.getElementById("editTaskTitle");
    this.editTaskDescription = document.getElementById("editTaskDescription");
    this.editTaskDate = document.getElementById("editTaskDate");
    this.editTaskPriority = document.getElementById("editTaskPriority");
    this.closeModal = document.getElementById("closeModal");
    this.cancelEdit = document.getElementById("cancelEdit");

    // Initialiser l'application
    this.init();
  }

  /* ============================================
     INITIALISATION
     ============================================ */

  /**
   * Initialise l'application
   * Charge les données, configure les écouteurs et affiche l'interface
   */
  init() {
    // Charger les tâches depuis le localStorage
    this.loadTasks();

    // Ajouter les écouteurs d'événements
    this.setupEventListeners();

    // Charger le thème sauvegardé
    this.loadTheme();

    // Afficher les tâches
    this.render();
  }

  /**
   * Configure tous les écouteurs d'événements de l'application
   */
  setupEventListeners() {
    // Formulaire d'ajout
    this.taskForm.addEventListener("submit", (e) => this.handleAddTask(e));

    // Recherche et filtrage
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.render();
    });

    this.filterStatus.addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.render();
    });

    this.sortBy.addEventListener("change", (e) => {
      this.currentSort = e.target.value;
      this.render();
    });

    // Thème
    this.themeToggle.addEventListener("click", () => this.toggleTheme());

    // Modal
    this.closeModal.addEventListener("click", () => this.closeEditModal());
    this.cancelEdit.addEventListener("click", () => this.closeEditModal());
    this.editModal.addEventListener("click", (e) => {
      if (e.target === this.editModal) this.closeEditModal();
    });
    this.editForm.addEventListener("submit", (e) => this.handleEditTask(e));
  }

  /* ============================================
     GESTION DES TÂCHES
     ============================================ */

  /**
   * Gère l'ajout d'une nouvelle tâche
   * @param {Event} e - L'événement submit du formulaire
   */
  handleAddTask(e) {
    e.preventDefault();

    // Validation - le titre est obligatoire
    const title = this.taskTitle.value.trim();
    if (!title) {
      this.showNotification("Veuillez entrer un titre de tâche", "error");
      return;
    }

    // Créer l'objet tâche
    const task = {
      id: Date.now(), // Utiliser le timestamp comme ID unique
      title: title,
      description: this.taskDescription.value.trim(),
      date: this.taskDate.value,
      priority: this.taskPriority.value,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Ajouter à la liste et sauvegarder
    this.tasks.push(task);
    this.saveTasks();
    this.render();

    // Réinitialiser le formulaire
    this.taskForm.reset();
    this.showNotification("✓ Tâche ajoutée avec succès!", "success");
  }

  /**
   * Ouvre la modal d'édition avec les données de la tâche
   * @param {number} id - L'ID de la tâche à éditer
   */
  openEditModal(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    this.editingTaskId = id;
    this.editTaskTitle.value = task.title;
    this.editTaskDescription.value = task.description;
    this.editTaskDate.value = task.date;
    this.editTaskPriority.value = task.priority;
    this.editModal.classList.add("active");
    this.editTaskTitle.focus();
  }

  /**
   * Ferme la modal d'édition
   */
  closeEditModal() {
    this.editModal.classList.remove("active");
    this.editingTaskId = null;
  }

  /**
   * Gère la mise à jour d'une tâche existante
   * @param {Event} e - L'événement submit du formulaire d'édition
   */
  handleEditTask(e) {
    e.preventDefault();

    // Validation
    const title = this.editTaskTitle.value.trim();
    if (!title) {
      this.showNotification("Veuillez entrer un titre", "error");
      return;
    }

    // Trouver et mettre à jour la tâche
    const task = this.tasks.find((t) => t.id === this.editingTaskId);
    if (!task) return;

    task.title = title;
    task.description = this.editTaskDescription.value.trim();
    task.date = this.editTaskDate.value;
    task.priority = this.editTaskPriority.value;

    this.saveTasks();
    this.render();
    this.closeEditModal();
    this.showNotification("✓ Tâche modifiée avec succès!", "success");
  }

  /**
   * Supprime une tâche après confirmation
   * @param {number} id - L'ID de la tâche à supprimer
   */
  deleteTask(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche?")) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.saveTasks();
      this.render();
      this.showNotification("✓ Tâche supprimée!", "success");
    }
  }

  /**
   * Bascule l'état de completion d'une tâche
   * @param {number} id - L'ID de la tâche
   */
  toggleTaskCompletion(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  }

  /* ============================================
     FILTRAGE ET TRI
     ============================================ */

  /**
   * Retourne les tâches filtrées, triées et recherchées
   * @returns {Array} Tableau des tâches filtrées et triées
   */
  getFilteredAndSortedTasks() {
    let filtered = this.tasks;

    // Filtrer par statut
    if (this.currentFilter === "active") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (this.currentFilter === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    // Filtrer par recherche
    if (this.searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(this.searchQuery) ||
          t.description.toLowerCase().includes(this.searchQuery),
      );
    }

    // Trier
    filtered.sort((a, b) => {
      if (this.currentSort === "date") {
        // Trier par date, les sans date à la fin
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      } else if (this.currentSort === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (this.currentSort === "title") {
        return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }

  /* ============================================
     STATISTIQUES ET RENDU
     ============================================ */

  /**
   * Met à jour les statistiques (total, en cours, terminées)
   * et la barre de progression
   */
  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const active = total - completed;

    // Mettre à jour les compteurs
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("activeTasks").textContent = active;
    document.getElementById("completedTasks").textContent = completed;

    // Mettre à jour la barre de progression
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById("progressBar").style.width = percentage + "%";
    document.getElementById("progressText").textContent = percentage + "%";
  }

  /**
   * Affiche ou réaffiche toutes les tâches
   */
  render() {
    this.updateStats();

    const filteredTasks = this.getFilteredAndSortedTasks();

    // Afficher le state vide s'il n'y a pas de tâches
    if (filteredTasks.length === 0) {
      this.tasksList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Aucune tâche trouvée. Ajoutez-en une ou modifiez vos filtres!</p>
        </div>
      `;
      return;
    }

    // Générer le HTML pour chaque tâche
    this.tasksList.innerHTML = filteredTasks
      .map((task) => this.createTaskElement(task))
      .join("");

    // Ajouter les écouteurs d'événements aux boutons
    this.attachTaskEventListeners();
  }

  /**
   * Attache les écouteurs d'événements aux éléments de tâche nouvellement rendus
   */
  attachTaskEventListeners() {
    // Boutons d'édition
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.closest(".task-card").dataset.taskId);
        this.openEditModal(id);
      });
    });

    // Boutons de suppression
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.closest(".task-card").dataset.taskId);
        this.deleteTask(id);
      });
    });

    // Cases à cocher de completion
    document.querySelectorAll(".task-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const id = parseInt(e.target.closest(".task-card").dataset.taskId);
        this.toggleTaskCompletion(id);
      });
    });
  }

  /**
   * Crée l'élément HTML pour une tâche
   * @param {Object} task - L'objet tâche
   * @returns {string} Le HTML de la tâche
   */
  createTaskElement(task) {
    // Formater la date
    const date = task.date ? new Date(task.date) : null;
    const dateString = date
      ? date.toLocaleDateString("fr-FR", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "";

    // Vérifier si la tâche est en retard
    const isOverdue = date && date < new Date() && !task.completed;

    // Labels et icônes de priorité
    const priorityLabel = {
      low: "Basse",
      medium: "Normale",
      high: "Élevée",
    };

    const priorityIcon = {
      low: "🟢",
      medium: "🟡",
      high: "🔴",
    };

    return `
      <div class="task-card task-priority-${task.priority} ${task.completed ? "completed" : ""}" data-task-id="${task.id}">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
        <div class="task-content">
          <div class="task-title">${this.escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ""}
          <div class="task-meta">
            <span class="task-badge badge-priority-${task.priority}">
              ${priorityIcon[task.priority]} ${priorityLabel[task.priority]}
            </span>
            ${task.date ? `<span class="task-badge badge-date">📅 ${dateString}</span>` : ""}
            ${isOverdue ? `<span class="task-badge" style="background-color: #ffe2e2; color: #721c24;">⚠️ En retard</span>` : ""}
          </div>
        </div>
        <div class="task-actions">
          <button type="button" class="btn-icon btn-icon-edit btn-edit">✏️ Éditer</button>
          <button type="button" class="btn-icon btn-icon-delete btn-delete">🗑️ Supprimer</button>
        </div>
      </div>
    `;
  }

  /* ============================================
     THÈME (MODE CLAIR/SOMBRE)
     ============================================ */

  /**
   * Bascule entre le mode clair et le mode sombre
   */
  toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");

    // Sauvegarder la préférence
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // Mettre à jour l'icône
    this.themeToggle.textContent = isDark ? "☀️" : "🌙";
  }

  /**
   * Charge le thème sauvegardé depuis le localStorage
   */
  loadTheme() {
    const theme = localStorage.getItem("theme") || "light";

    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      this.themeToggle.textContent = "☀️";
    } else {
      this.themeToggle.textContent = "🌙";
    }
  }

  /* ============================================
     STOCKAGE LOCAL (LOCALSTORAGE)
     ============================================ */

  /**
   * Sauvegarde toutes les tâches dans le localStorage
   */
  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  /**
   * Charge les tâches depuis le localStorage
   */
  loadTasks() {
    const saved = localStorage.getItem("tasks");
    this.tasks = saved ? JSON.parse(saved) : [];
  }

  /* ============================================
     UTILITAIRES
     ============================================ */

  /**
   * Échappe le HTML pour éviter les injections XSS
   * @param {string} text - Le texte à échapper
   * @returns {string} Le texte échappé
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Affiche une notification temporaire
   * @param {string} message - Le message à afficher
   * @param {string} type - Le type de notification (success, error, info)
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Retirer la notification après 3 secondes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

/* ============================================
   INITIALISATION DE L'APPLICATION
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  new TaskManager();
});
