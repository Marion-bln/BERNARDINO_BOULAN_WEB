// Gestion des appels API
const Api = {
    // Headers par défaut pour les requêtes
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (Auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }

        return headers;
    },

    // Appel API générique
    call: async function(endpoint, method = 'GET', data = null) {
        UI.showLoading();

        const url = `${CONFIG.API_URL}${endpoint}`;
        const options = {
            method: method,
            headers: this.getHeaders()
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.detail || 'Une erreur est survenue');
            }

            UI.hideLoading();
            return responseData;
        } catch (error) {
            UI.hideLoading();
            UI.showMessage(error.message, 'error');
            throw error;
        }
    },

    // Méthodes spécifiques
    login: async function(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        UI.showLoading();

        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Échec de la connexion');
            }

            // Stocker le token
            Auth.setToken(data.access_token);

            // Récupérer les informations utilisateur
            await this.getCurrentUser();

            UI.hideLoading();
            return data;
        } catch (error) {
            UI.hideLoading();
            UI.showMessage(error.message, 'error');
            throw error;
        }
    },

    register: async function(userData) {
        return this.call('/users/', 'POST', userData);
    },

    getCurrentUser: async function() {
        try {
            const userData = await this.call('/users/me');
            Auth.setUser(userData);
            return userData;
        } catch (error) {
            Auth.logout();
            throw error;
        }
    },


 // Crée un emprunt pour l'utilisateur courant
  async createLoan(bookId) {
    const user = Auth.getUser();
    // on utilise call générique : POST /loans/?user_id&book_id
    return this.call(
      `/loans/?user_id=${user.id}&book_id=${bookId}`,
      'POST'
    );
  },

  // Récupère les emprunts d’un utilisateur
  async getUserLoans(userId) {
    return this.call(`/loans/user/${userId}`, 'GET');
  },

  // Marquer un emprunt comme retourné
  async returnLoan(loanId) {
    return this.call(`/loans/${loanId}/return`, 'POST');
  },

   // Prolonge un emprunt de X jours (défaut 7)
  async extendLoan(loanId, extensionDays = 7) {
    // on passe extension_days en query param
    return this.call(`/loans/${loanId}/extend?extension_days=${extensionDays}`, 'POST');
  },




  // Recherche, pagination, filtrage :
  async getBooks(skip = 0, limit = 100, q = "", genre = "") {
    const qp = q     ? `&q=${encodeURIComponent(q)}`     : ""
    const gp = genre ? `&genre=${encodeURIComponent(genre)}` : ""
    return this.call(
      `/books/books/?skip=${skip}&limit=${limit}${qp}${gp}`
    )
  },

  // Récupérer un seul livre
  async getBook(id) {
    return this.call(`/books/books/${id}/`)
  },

};
