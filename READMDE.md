pour télécharger le projet et le lancer : 
créer un environnement, 
pip install requirements.txt

Ensuite pour la migration alembic : 
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

pour lancer le backend : 
python run.py 

pour lancer le frontend : 
dans un autre terminal : 
cd frontend
python server.py 
