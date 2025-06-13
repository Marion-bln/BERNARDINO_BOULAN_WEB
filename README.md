#Project WEB PROG

To download and launch the project you have to  : 
 - create an environnement
 - ``` pip install requirements.txt ```

Next for migration alembic : 
```
alembic revision --autogenerate -m "Initial migration" alembic upgrade head
```
To launch the backend : 
``` python run.py ```

To launch the frontend, in another terminal : 
```
cd frontend python server.py
```
