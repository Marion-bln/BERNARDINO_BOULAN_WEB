const API_BASE = "http://localhost:8000/api/v1";
// Application principale
const App = {
    // Initialisation de l'application
    init: function() {
        UI.init();
        this.loadInitialPage();
    },

    // Réserve un livre
    reserveBook: async function(bookId) {
    try {
      await Api.createLoan(bookId);
      UI.showMessage('Livre réservé avec succès !', 'success');
      // on recharge la liste pour mettre à jour la quantité
      this.loadPage('books');
    } catch (err) {
      console.error('Erreur de réservation :', err);
      UI.showMessage('Impossible de réserver : ' + err.message, 'error');
    }
  },

    // Charge la page initiale en fonction de l'état d'authentification
    loadInitialPage: function() {
        if (Auth.isAuthenticated()) {
            this.loadPage('books');
        } else {
            this.loadPage('login');
        }
    },

    // Charge une page spécifique
    loadPage: function(page) {
        UI.setContent("");
        // Vérifier si la page nécessite une authentification
        const authRequiredPages = ['books', 'profile'];
        if (authRequiredPages.includes(page) && !Auth.isAuthenticated()) {
            UI.showMessage('Vous devez être connecté pour accéder à cette page', 'error');
            page = 'login';
        }

        // Charger le contenu de la page
        switch (page) {
            case 'login':
                this.loadLoginPage();
                break;
            case 'register':
                this.loadRegisterPage();
                break;
            case 'books':
                this.loadBooksPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            default:
                this.loadLoginPage();
        }

        // Mettre à jour la navigation active
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === page);
        });
    },

    // Charge la page de connexion
    loadLoginPage: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Connexion</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Mot de passe</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-block">Se connecter</button>
                </form>
                <p class="text-center mt-20">
                    Vous n'avez pas de compte ? 
                    <a href="#" class="nav-link" data-page="register">Inscrivez-vous</a>
                </p>
            </div>
        `;

        UI.setContent(html);

        // Configurer le formulaire de connexion
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await Api.login(email, password);
                UI.updateNavigation();
                UI.showMessage('Connexion réussie', 'success');
                this.loadPage('books');
            } catch (error) {
                console.error('Erreur de connexion:', error);
            }
        });

        // Configurer les liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.loadPage(page);
            });
        });
    },

    // Charge la page d'inscription
    loadRegisterPage: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Inscription</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="full_name">Nom complet</label>
                        <input type="text" id="full_name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Mot de passe</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm_password">Confirmer le mot de passe</label>
                        <input type="password" id="confirm_password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-block">S'inscrire</button>
                </form>
                <p class="text-center mt-20">
                    Vous avez déjà un compte ? 
                    <a href="#" class="nav-link" data-page="login">Connectez-vous</a>
                </p>
            </div>
        `;

        UI.setContent(html);

        // Configurer le formulaire d'inscription
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('full_name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            // Vérifier que les mots de passe correspondent
            if (password !== confirmPassword) {
                UI.showMessage('Les mots de passe ne correspondent pas', 'error');
                return;
            }

            try {
                const userData = {
                    full_name: fullName,
                    email: email,
                    password: password
                };

                await Api.register(userData);
                UI.showMessage('Inscription réussie. Vous pouvez maintenant vous connecter.', 'success');
                this.loadPage('login');
            } catch (error) {
                console.error('Erreur d\'inscription:', error);
            }
        });

        // Configurer les liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.loadPage(page);
            });
        });
    },
    

    // affiche la page des livres 
// js/app.js

// js/app.js

loadBooksPage: async function(q = "", genre = "") {
  // 1) Loader
  UI.setContent(`<p class="text-center">Chargement en cours…</p>`);

  try {
    // 2) Barre de recherche + filtre genre
    const filterHtml = `
      <div class="filters mb-20" style="display:flex;gap:0.5rem;align-items:center;">
        <input
          type="text"
          id="search-input"
          class="form-control"
          placeholder="Rechercher titre/auteur…"
          value="${q}"
          style="flex:1;"
        />
        <select id="genre-select" class="form-control" style="width:150px;">
          <option value="">Tous genres</option>
          <option value="Roman"      ${genre === "Roman"      ? "selected" : ""}>Roman</option>
          <option value="Essai"      ${genre === "Essai"      ? "selected" : ""}>Essai</option>
          <option value="Science Fiction"         ${genre === "Science Fiction"         ? "selected" : ""}>Science Fiction</option>
          <option value="Policier"   ${genre === "Policier"   ? "selected" : ""}>Policier</option>
          <option value="Biographie" ${genre === "Biographie" ? "selected" : ""}>Biographie</option>
          <!-- Ajoute ici tes autres genres -->
        </select>
        <button id="filter-btn" class="btn">Filtrer</button>
      </div>
    `;

    // 3) Appel API
    const raw = await Api.getBooks(0, 100, q, genre);
    console.log("🔍 raw books:", raw);
    const books = Array.isArray(raw.items) ? raw.items : [];

    // 4) Construction des cartes
    let html = `
      <h2 class="mb-20">Catalogue de Livres</h2>
      ${filterHtml}
      <div class="card-container">
    `;

    if (books.length === 0) {
      html += `<p>Aucun livre trouvé.</p>`;
    } else {
      books.forEach(book => {
        html += `
          <div class="card">
            <div class="card-header"><h3>${book.title}</h3></div>
            <div class="card-body">
              <p><strong>Auteur :</strong> ${book.author}</p>
              <p><strong>Genre :</strong> ${book.genre || "—"}</p>
              <p><strong>ISBN :</strong> ${book.isbn}</p>
              <p><strong>Année :</strong> ${book.publication_year}</p>
              <p><strong>Disponible :</strong> ${book.quantity} exemplaires</p>
            </div>
            <div class="card-footer">
              <button class="btn" onclick="App.viewBookDetails(${book.id})">
                Détails
              </button>
              <button class="btn ml-10" ${book.quantity === 0 ? "disabled" : ""}
                      onclick="App.reserveBook(${book.id})">
                Réserver
              </button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;  // fermeture card-container

    // 5) Affiche tout
    UI.setContent(html);

    // 6) Événements sur Recherche + Filtre
    document.getElementById("filter-btn").addEventListener("click", () => {
      const newQ     = document.getElementById("search-input").value.trim();
      const newGenre = document.getElementById("genre-select").value;
      this.loadBooksPage(newQ, newGenre);
    });
    // Enter déclenche aussi le filtre
    document.getElementById("search-input").addEventListener("keyup", e => {
      if (e.key === "Enter") {
        const newQ     = e.target.value.trim();
        const newGenre = document.getElementById("genre-select").value;
        this.loadBooksPage(newQ, newGenre);
      }
    });

  } catch (error) {
    console.error("Erreur lors du chargement des livres :", error);
    UI.setContent(`
      <p>Erreur lors du chargement des livres. (${error.message})</p>
      <button class="btn" onclick="App.loadBooksPage()">Réessayer</button>
    `);
  }
},




    // Affiche les détails d'un livre
    viewBookDetails: async function(bookId) {
  UI.showLoading();
  try {
    const book = await Api.getBook(bookId);
    const html = `
      <div class="book-details">
        <h2>${book.title}</h2>
        <div class="book-info">
          <p><strong>Auteur :</strong> ${book.author}</p>
          <p><strong>ISBN :</strong> ${book.isbn}</p>
          <p><strong>Année de publication :</strong> ${book.publication_year}</p>
          <p><strong>Éditeur :</strong> ${book.publisher || '—'}</p>
          <p><strong>Langue :</strong> ${book.language || '—'}</p>
          <p><strong>Pages :</strong> ${book.pages || '—'}</p>
          <p><strong>Genre :</strong> ${book.genre || '—'}</p>
          <p><strong>Quantité disponible :</strong> ${book.quantity}</p>
        </div>
        <div class="book-description">
          <h3>Description</h3>
          <p>${book.description || 'Aucune description disponible.'}</p>
        </div>
        <button class="btn mt-20" onclick="App.loadPage('books')">← Retour</button>
      </div>
    `;

    UI.setContent(html);
  } catch (err) {
    console.error('Erreur détails du livre :', err);
    UI.setContent(`
      <p>Impossible de charger les détails. (${err.message})</p>
      <button class="btn" onclick="App.loadPage('books')">Retour</button>
    `);
  }
},


returnLoan: async function(loanId) {
    try {
      await Api.returnLoan(loanId);
      UI.showMessage('Livre rendu avec succès !', 'success');
      // On recharge la page profil pour mettre à jour la liste des emprunts
      this.loadPage('profile');
    } catch (err) {
      console.error('Erreur de retour de prêt :', err);
      UI.showMessage(`Impossible de retourner le livre : ${err.message}`, 'error');
    }
  },


extendLoan: async function(loanId) {
    try {
      await Api.extendLoan(loanId, 7);
      UI.showMessage('Emprunt prolongé de 7 jours !', 'success');
      // on recharge le profil pour voir la nouvelle due_date
      this.loadPage('profile');
    } catch (err) {
      console.error('Erreur de prolongation :', err);
      UI.showMessage('Impossible de prolonger : ' + err.message, 'error');
    }
  },


    // Charge la page de profil
loadProfilePage: async function() {
  // Affiche immédiatement le loader
  UI.setContent(`<p class="text-center">Chargement du profil…</p>`);

  try {
    // Récupération de l'utilisateur courant
    let user = Auth.getUser();
        if (!user) {
      await Api.getCurrentUser();
      user = Auth.getUser();
    }

    // Récupération des emprunts
    const rawLoans = await Api.getUserLoans(user.id);
    const loans = Array.isArray(rawLoans.items) ? rawLoans.items : rawLoans;

    // Filtrer les emprunts actifs
    const activeLoans = loans.filter(l => l.return_date === null);

    // Calcul des initiales
    const initials = user.full_name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase();

    // Construction du HTML
    let html = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar">${initials}</div>
          <h2>${user.full_name}</h2>
        </div>
        <div class="profile-info">
          <div><strong>Email :</strong> ${user.email}</div>
          <div><strong>Statut :</strong> ${user.is_active ? 'Actif' : 'Inactif'}</div>
          <div><strong>Rôle :</strong> ${user.is_admin ? 'Admin' : 'Utilisateur'}</div>
          <div><strong>Téléphone :</strong> ${user.phone || '—'}</div>
          <div><strong>Adresse :</strong> ${user.address || '—'}</div>
        </div>

        <h3 class="mt-20">Mes emprunts en cours</h3>
        <ul class="loan-list">
    `;

    if (activeLoans.length === 0) {
      html += `<li>Aucun emprunt actif.</li>`;
    } else {
      activeLoans.forEach(loan => {
        // Si la relation book n'est pas jointe, on affiche un titre de secours
        const bookTitle = loan.book?.title || `Livre #${loan.book_id}`;
        const loanDate = new Date(loan.loan_date).toLocaleDateString(); 
        const dueDate   = new Date(loan.due_date).toLocaleDateString();
        html += `
          <li class="loan-item">
            ${bookTitle}</strong><br>
      Emprunté le ${loanDate} – À rendre le ${dueDate}
      <div class="loan-actions">
        <button class="btn btn-small" onclick="App.returnLoan(${loan.id})">
          Rendre
        </button>
        <button class="btn btn-small ml-5" onclick="App.extendLoan(${loan.id})">
          Prolonger 
        </button>
      </div>
    </li>
  `;
});
    }

    html += `
        </ul>
        <button id="edit-profile-btn" class="btn mt-20">Modifier le profil</button>
      </div>
    `;

    // Remplace le loader par le contenu
    UI.setContent(html);

    // Bouton modifier le profil
    document.getElementById('edit-profile-btn')
      .addEventListener('click', () => this.loadEditProfilePage(user));

  } catch (error) {
    console.error('Erreur chargement profil :', error);
    UI.setContent(`
      <p>Erreur lors du chargement du profil (${error.message})</p>
      <button class="btn" onclick="App.loadPage('books')">Retour aux livres</button>
    `);
  }
},



    // Charge la page de modification du profil
    loadEditProfilePage: function(user) {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Modifier le profil</h2>
                <form id="edit-profile-form">
                    <div class="form-group">
                        <label for="full_name">Nom complet</label>
                        <input type="text" id="full_name" class="form-control" value="${user.full_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Téléphone</label>
                        <input type="text" id="phone" class="form-control" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="address">Adresse</label>
                        <textarea id="address" class="form-control">${user.address || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-block">Enregistrer les modifications</button>
                </form>
                <button class="btn btn-block mt-20" onclick="App.loadPage('profile')">Annuler</button>
            </div>
        `;

        UI.setContent(html);

        // Configurer le formulaire de modification du profil
        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('full_name').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;

            try {
                const userData = {
                    full_name: fullName,
                    phone: phone || null,
                    address: address || null
                };

                await Api.call('/users/me', 'PUT', userData);
                await Api.getCurrentUser();
                UI.showMessage('Profil mis à jour avec succès', 'success');
                this.loadPage('profile');
            } catch (error) {
                console.error('Erreur lors de la mise à jour du profil:', error);
            }
        });
    }
};

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});